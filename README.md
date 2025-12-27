# Caliana - AI Receptionist & Security System 🤖🛡️

**Caliana** is a next-generation "Hybrid AI Receptionist" designed for hospitality and high-security environments. It is not just a chatbot; it's a **Multimodal Agent** that can hear, speak, and *see*.

![Caliana Banner](https://img.shields.io/badge/Status-Active-success) ![Tech](https://img.shields.io/badge/Gemini-Multimodal_Live-blue) ![Stack](https://img.shields.io/badge/Stack-Next.js_FastAPI-black)

## 🌟 Key Features

### 1. Dual Persona System 🎭
The system switches personality, voice, and capabilities based on the interface context:
- **Sari (Receptionist)**: Warm, welcoming, handles restaurant bookings and general inquiries. Uses a soft female voice ("Aoede").
- **Reza (Security/Kiosk)**: Professional, firm, handles guest check-in, identity verification, and access control. Uses a deep male voice ("Puck").

### 2. Multimodal Kiosk Mode (Vision Enabled) 👁️
The `/kiosk` interface transforms any screen into a **Smart Mirror**:
- **Video Stream Analysis**: The AI "sees" you through the camera in real-time.
- **Biometric Simulation**: Performs "Face Scanning" and "ID Card Reading".
- **Reactive UI**: The screen physically reacts to AI commands (flashing during scans, changing scan frame colors, holographic overlays).

### 3. Agentic Backend 🧠
Powered by **Google Gemini Multimodal Live API**:
- **Real-time Voice**: Low-latency spoken conversation.
- **Autonomous Tool Use**: The AI decides when to check the database, creating bookings, or trigger UI scans.
- **Context Awareness**: Knows the [SYSTEM TIME] to enforce strict rules (e.g., denying entry if >30 mins early).

### 4. Enterprise Integration (n8n MCP) ⚙️
Seamlessly connects to business logic via **n8n**:
- Google Calendar (Booking Management)
- Google Sheets (CRM/Database)
- Access Control Simulation (Grant Access/Open Door)

## 🏗️ Architecture

```mermaid
graph TD
    User[User/Guest] -->|Audio/Video| Frontend[Next.js Kiosk UI]
    Frontend -->|WebSocket (Audio+Images)| Backend[FastAPI Python]
    Backend -->|Multimodal Live API| Gemini[Google Gemini 2.0]
    Backend -->|MCP Protocol| n8n[n8n Workflow Engine]
    n8n -->|API| GCal[Google Calendar]
    n8n -->|API| GSheets[Google Sheets]
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key
- n8n Instance (Webhook-based workflows)

### Installation

1.  **Clone Request**
    ```bash
    git clone https://github.com/nugrahalabib/AI-Receptionist.git
    cd AI-Receptionist
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    
    # Create .env
    cp .env.example .env
    # Fill in GEMINI_API_KEY, N8N_MCP_URL, N8N_AUTH_TOKEN
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    ```

### Running the System

1.  **Start Backend**
    ```bash
    # In /backend
    venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Start Frontend**
    ```bash
    # In /frontend
    npm run dev
    ```

3.  **Access Interfaces**
    - **Booking Mode (Sari)**: `http://localhost:3000`
    - **Security Kiosk (Reza)**: `http://localhost:3000/kiosk` (Requires Camera Access)

## 🛡️ Security Protocol (Reza Logic)
The Security Persona enforces strict rules:
1.  **Unknown Guest**: Deny Access -> Redirect to Receptionist.
2.  **Too Early (>30m)**: Deny Access -> Waiting Room.
3.  **Too Late (>15m)**: Deny Access -> Reschedule.
4.  **On Time**: Biometric Scan (Face + ID) -> Access Granted 🟢.

## 🛠️ Tech Stack
- **AI**: Google Gemini 2.0 Flash (Multimodal Live)
- **Backend**: FastAPI, Uvicorn, Websockets
- **Frontend**: Next.js, TailwindCSS, Framer Motion (Animations)
- **Orchestration**: n8n (Low-code Backend)
