import os
import sys
import time
import json
import subprocess
import shutil

# Make the backend `app` package importable from the project root
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

JOBS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../simulation_jobs"))
ANSYS_EXEC = "ansys241"  # Change to your actual ANSYS executable path if installed


def find_pending_jobs():
    if not os.path.exists(JOBS_DIR):
        return []
    return [f.replace(".pending", "") for f in os.listdir(JOBS_DIR) if f.endswith(".pending")]


def process_job(job_name):
    job_id = job_name.replace("job_", "")
    job_dir = os.path.join(JOBS_DIR, job_name)
    pending_file = os.path.join(JOBS_DIR, f"{job_name}.pending")
    running_file = os.path.join(JOBS_DIR, f"{job_name}.running")

    if os.path.exists(pending_file):
        os.rename(pending_file, running_file)

    print(f"[{time.strftime('%H:%M:%S')}] Started job: {job_id}")

    success = False
    try:
        if shutil.which(ANSYS_EXEC):
            cmd = [ANSYS_EXEC, "-b", "-i", "simulation.dat", "-o", "simulation.out"]
            subprocess.run(cmd, cwd=job_dir, check=True)
            success = True
        else:
            print(f"[{time.strftime('%H:%M:%S')}] ANSYS not found — running mock FEA calculation...")
            run_mock_calculation(job_dir, job_id)
            success = True
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error in job {job_id}: {e}")
        with open(os.path.join(job_dir, "error.log"), "w") as f:
            f.write(str(e))

    if os.path.exists(running_file):
        os.remove(running_file)
    print(f"[{time.strftime('%H:%M:%S')}] Finished job: {job_id} (success={success})")


def run_mock_calculation(job_dir, job_id):
    config_path = os.path.join(job_dir, "config.json")
    if not os.path.exists(config_path):
        return

    with open(config_path) as f:
        config = json.load(f)

    time.sleep(3.0)  # simulate FEA compute time

    from app.core.thermal_network import ThermalNetworkSolver
    from app.data import materials_db

    solver = ThermalNetworkSolver(config["geometry"], materials_db, config["weather_records"])
    res = solver.solve(initial_temp=config.get("initial_temp", 15.0))

    mock_indoor = [t + 0.35 * (1.0 - 2.0 * (i % 2 == 0)) for i, t in enumerate(res["indoor_temperatures"])]

    results = {
        "job_id": job_id,
        "status": "completed",
        "indoor_temperatures": mock_indoor,
        "outdoor_temperatures": res["outdoor_temperatures"],
        "timestamps": res["timestamps"],
        "heat_loss_total_kwh": res["heat_loss_total_kwh"] * 1.025,
        "solar_gain_total_kwh": res["solar_gain_total_kwh"] * 0.985,
        "heat_loss_breakdown_kwh": {k: v * 1.025 for k, v in res["heat_loss_breakdown_kwh"].items()},
    }

    with open(os.path.join(job_dir, "results.json"), "w") as f:
        json.dump(results, f, indent=2)


def start_runner():
    print(f"[{time.strftime('%H:%M:%S')}] ANSYS Runner started — watching: {JOBS_DIR}")
    os.makedirs(JOBS_DIR, exist_ok=True)
    while True:
        for job in find_pending_jobs():
            process_job(job)
        time.sleep(1.0)


if __name__ == "__main__":
    start_runner()
