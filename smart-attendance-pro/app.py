from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

def db_interaction(query, params=(), fetch=False):
    with sqlite3.connect('attendance.db') as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(query, params)
        if fetch: return [dict(row) for row in cursor.fetchall()]
        conn.commit()

# Init Database
db_interaction("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, name TEXT, card_uid TEXT, finger_id INTEGER)")
db_interaction("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, name TEXT, timestamp TEXT)")
db_interaction("CREATE TABLE IF NOT EXISTS system_state (id INTEGER PRIMARY KEY, mode TEXT, pending_name TEXT)")
db_interaction("INSERT OR IGNORE INTO system_state (id, mode) VALUES (1, 'ATTENDANCE')")

@app.route('/api/get-mode', methods=['GET'])
def get_mode():
    return jsonify(db_interaction("SELECT * FROM system_state WHERE id=1", fetch=True)[0])

@app.route('/api/set-mode', methods=['POST'])
def set_mode():
    data = request.json
    db_interaction("UPDATE system_state SET mode=?, pending_name=? WHERE id=1", (data['mode'], data.get('name', '')))
    return jsonify({"status": "ok"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    db_interaction("INSERT INTO students (name, card_uid, finger_id) VALUES (?, ?, ?)", (data['name'], data['card_uid'], data['finger_id']))
    db_interaction("UPDATE system_state SET mode='ATTENDANCE', pending_name='' WHERE id=1")
    return jsonify({"status": "registered"})

@app.route('/api/verify', methods=['POST'])
def verify():
    data = request.json
    student = db_interaction("SELECT name FROM students WHERE card_uid=? AND finger_id=?", (data['card_uid'], data['finger_id']), fetch=True)
    if student:
        name = student[0]['name']
        db_interaction("INSERT INTO logs (name, timestamp) VALUES (?, ?)", (name, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        return jsonify({"status": "success", "name": name})
    return jsonify({"status": "failed"}), 404

@app.route('/api/logs', methods=['GET'])
def get_logs():
    return jsonify(db_interaction("SELECT * FROM logs ORDER BY id DESC", fetch=True))

if __name__ == '__main__':
    app.run(port=5000)

