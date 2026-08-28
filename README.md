# ClipFlow AI

V1: Android client + FastAPI backend + Gemini Veo 3.1.

## Backend
```bash
cd backend
python -m venv .venv
# Linux/Termux:
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# isi GEMINI_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Mobile
```bash
cd mobile
npm install
# edit App.js: const API = "http://IP-KOMPUTER-ATAU-SERVER:8000";
npx expo start
```

Untuk APK production, gunakan EAS Build setelah project diuji.
Storage Tiny belum diikat; endpoint storage dibuat terpisah agar nanti bisa diganti tanpa mengubah UI.
