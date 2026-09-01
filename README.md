# 🏔️ ThermoShelter — High-Altitude Passive Solar Simulator & Thermal Optimization Platform

> **Smart India Hackathon 2026 (SIH 2026)**  
> **Problem Statement ID**: SIH26051  
> **Problem Statement Title**: Software Based Model Development for Design of Area Specific Shelter for Thermal Comfort Maintenance  
> **Category / Theme**: Software / Defense & High-Altitude Shelters  
> **Team Name**: INFINITY  

---

## 📌 Project Overview

**ThermoShelter** is an advanced engineering web platform designed to simulate, optimize, and evaluate passive solar shelter architectures for extreme cold and high-altitude regions (e.g., Leh, Ladakh). 

By integrating a real-time **2-Node Resistance-Capacitance ($RC$) Lumped ODE Physics Engine**, an interactive **Multi-Story Building Envelope Studio**, and a **3D Transient FEA Structural Thermal Validator (PyANSYS APDL)**, ThermoShelter enables defense personnel, architects, and engineers to design zero-carbon, thermal-comfort-guaranteed shelters without reliance on fossil fuels.

---

## ✨ Key Features

- **☀️ Real-Time Cold-Arid Microclimate Simulator**:
  - Live diurnal weather integration for Leh/Ladakh cold-arid microclimates.
  - Solar geometry raytracing computing hourly solar irradiance ($I_{\text{south}}$) and Sol-Air temperatures ($T_{\text{sol-air}}$).

- **🏢 Multi-Story Building Envelope Studio**:
  - Interactive configuration of 1-story (Ground Floor) & 2-story (G + 1st Floor) building geometries.
  - Custom material layer stacking for walls, roofs, floors, glazing types (single vs. double glass), and air infiltration rates ($ACH$).

- **⚡ 2-Node RC Lumped ODE Physics Solver**:
  - Instantaneous differential equation solver ($<50\text{ms}$ execution latency) calculating indoor temperature curves ($T_{\text{in}}$) and envelope mass temperatures ($T_{\text{env}}$).
  - Energy balance breakdown tracking envelope conduction, roof radiation, ground heat loss, and infiltration loss.

- **🧊 ASHRAE 55 Thermal Comfort Engine**:
  - Computes PMV (Predicted Mean Vote) and PPD (Predicted Percentage Dissatisfied) comfort metrics.
  - Displays daily comfort hours ($18^\circ\text{C}\text{--}24^\circ\text{C}$).

- **⚖️ Housing Comparison Benchmark**:
  - Dynamic side-by-side benchmark comparing user passive designs against legacy uninsulated mud-brick shelters.
  - Live economic analysis highlighting annual fuel savings, cost reductions, and $\text{CO}_2$ offsets.

- **🧱 3D Transient FEA Structural Thermal Validator**:
  - Asynchronous background job runner mapping structural meshes using **PyANSYS APDL**.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18, Vite
- **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`
- **Data Visualization**: Plotly.js (`plotly.js-basic-dist`), React Plotly
- **Styling & UI**: Tailwind CSS, Lucide React Icons

### **Backend & Physics Engine**
- **Framework**: FastAPI (Python 3.10+), Uvicorn ASGI Server
- **Physics Solvers**: SciPy (`scipy.integrate.solve_ivp`), NumPy
- **FEA Automation**: PyANSYS APDL / ANSYS APDL Runner

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18.0 or higher
- npm / yarn

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/ThermoShelter.git
cd ThermoShelter
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser to access ThermoShelter!

---

## 📡 API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/simulations/quick` | `POST` | Executes 1D 2-Node RC thermal ODE simulation |
| `/api/materials` | `GET` | Retrieves standard material library metadata |
| `/api/ansys/run` | `POST` | Submits asynchronous 3D FEA structural simulation job |
| `/api/ansys/status/{job_id}` | `GET` | Checks progress of active 3D FEA simulation job |

---

## 📄 License & Acknowledgments

- **Hackathon**: Smart India Hackathon 2026 (SIH 2026)
- **Problem Statement**: SIH26051 — Defense & High-Altitude Area Specific Shelter Design
- **Team**: INFINITY
