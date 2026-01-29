import serial
import requests
import time

PORT = 'COM5'
BAUD = 115200
API_URL = "http://localhost:5000/api"

try:
    ser = serial.Serial(PORT, BAUD, timeout=0.1)
    print(f"✅ Connected to {PORT}")
except:
    print(f"❌ Error: Close Arduino Serial Monitor first!")
    exit()

last_mode = "ATTENDANCE"

while True:
    try:
        # Check if Website triggered Registration
        state = requests.get(f"{API_URL}/get-mode").json()
        if state['mode'] == "REGISTER" and last_mode == "ATTENDANCE":
            print(f"🔔 Command: Start Register for {state['pending_name']}")
            ser.write(f"START_REG|{state['pending_name']}\n".encode())
            last_mode = "REGISTER"
        elif state['mode'] == "ATTENDANCE":
            last_mode = "ATTENDANCE"

        # Listen to ESP32
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            print(f"📟 ESP32: {line}")

            if line.startswith("VERIFY|"):
                _, uid, fid = line.split("|")
                requests.post(f"{API_URL}/verify", json={"card_uid": uid, "finger_id": int(fid)})
            
            elif line.startswith("REGISTER_DONE|"):
                _, name, uid, fid = line.split("|")
                requests.post(f"{API_URL}/register", json={"name": name, "card_uid": uid, "finger_id": int(fid)})
    except Exception as e:
        print(f"⚠️ Connection error: {e}")

    time.sleep(0.5)