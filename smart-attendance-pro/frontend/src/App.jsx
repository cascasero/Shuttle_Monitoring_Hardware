import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Clock, ShieldCheck, User, Download, Activity } from 'lucide-react';

const API_BASE = "http://localhost:5000/api"; // Change 'localhost' to your IP for the ESP32

export default function App() {
  const [logs, setLogs] = useState([]);
  const [name, setName] = useState("");
  const [systemState, setSystemState] = useState({ mode: "ATTENDANCE", pending_name: "" });

  // 1. Poll the backend every 2 seconds for updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stateRes = await axios.get(`${API_BASE}/get-mode`);
        setSystemState(stateRes.data);
        const logsRes = await axios.get(`${API_BASE}/logs`);
        setLogs(logsRes.data);
      } catch (err) {
        console.error("Server not reachable");
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerRegister = async () => {
    if (!name) return alert("Please enter a student name first!");
    await axios.post(`${API_BASE}/set-mode`, { mode: "REGISTER", name: name });
    setName("");
    alert(`System set to Register. Go to the device to scan ${name}'s card and finger.`);
  };

  const downloadCSV = () => window.open(`${API_BASE}/export`);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-black text-indigo-900 tracking-tight">SmartScan Pro</h1>
            <p className="text-slate-500 font-medium">Dual-Factor Attendance System</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${systemState.mode === 'REGISTER' ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
              <Activity size={16} />
              System: {systemState.mode} {systemState.pending_name && `(${systemState.pending_name})`}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Registration Card */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 self-start">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-6">
              <UserPlus className="text-indigo-600" /> Enrollment
            </h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Student Name" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button 
                onClick={triggerRegister}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-100"
              >
                Register Student
              </button>
            </div>
          </section>

          {/* Attendance Logs Table */}
          <section className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Clock className="text-slate-400" /> Live Attendance Feed
              </h2>
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <Download size={18} /> Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4 text-right">Time Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan="2" className="p-10 text-center text-slate-400">Waiting for scans...</td></tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3 font-bold text-slate-700">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                          <User size={20} />
                        </div>
                        {log.name}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 font-medium">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}