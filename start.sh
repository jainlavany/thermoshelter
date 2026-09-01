#!/usr/bin/env bash
# ThermoShelter — One-command local dev launcher
# Usage:  bash start.sh
# Prereqs: Python 3.10+, Node 18+, MongoDB running on localhost:27017

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║        ThermoShelter — Local Dev         ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── MongoDB check ─────────────────────────────────────────────────────────────
if ! pgrep -x mongod &>/dev/null; then
  echo -e "${RED}[ERROR] MongoDB is not running.${NC}"
  echo "        Start it with:  sudo systemctl start mongod"
  exit 1
fi
echo -e "${GREEN}[OK]${NC}  MongoDB running on localhost:27017"

# ── Python venv + backend ─────────────────────────────────────────────────────
echo -e "\n${CYAN}[1/3] Setting up backend...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  echo "      Virtual environment created."
fi
source .venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}[OK]${NC}  Dependencies installed."

uvicorn app.main:app --host localhost --port 8000 --reload &
BACKEND_PID=$!
echo -e "${GREEN}[OK]${NC}  Backend started (PID $BACKEND_PID) → http://localhost:8000"

# ── ANSYS runner daemon ───────────────────────────────────────────────────────
echo -e "\n${CYAN}[2/3] Starting ANSYS job runner...${NC}"
cd "$PROJECT_ROOT"
python3 ansys_runner/runner.py &
RUNNER_PID=$!
echo -e "${GREEN}[OK]${NC}  ANSYS runner started (PID $RUNNER_PID)"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}[3/3] Starting React frontend...${NC}"
cd "$PROJECT_ROOT/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}[OK]${NC}  Frontend started (PID $FRONTEND_PID) → http://localhost:5173"

# ── Summary ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}╔══════════════════════════════════════════╗"
echo "║  All services running:                   ║"
echo "║  Frontend  →  http://localhost:5173      ║"
echo "║  Backend   →  http://localhost:8000      ║"
echo "║  API Docs  →  http://localhost:8000/docs ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo "  Press Ctrl+C to stop everything."

trap "echo -e '\n${RED}Stopping all services...${NC}'; kill $BACKEND_PID $RUNNER_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
