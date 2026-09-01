# Host ANSYS Runner Daemon

This runner executes outside the Docker stack directly on the host machine because the licensed ANSYS installation depends on host-level licensing and CPU environments.

## Setup & Running

1. **Prerequisites:**
   Ensure you have Python 3.x and Numpy installed on your host machine:
   ```bash
   pip install numpy
   ```

2. **Start the Watchdog:**
   Run the daemon from the `ansys_runner` directory, referencing the backend directory in your `PYTHONPATH`:
   ```bash
   PYTHONPATH=../backend python runner.py
   ```

3. **Configure ANSYS Executable Path:**
   Open `runner.py` and modify the `ANSYS_EXEC` variable (line 8) to match the path to your APDL executable (e.g. `ansys241`, `ansys232`, etc.).

## How it works
* It polls the `simulation_jobs/` folder.
* Once a `.pending` job lock file is detected, it claims it, renames it to `.running`, and fires the local ANSYS executable.
* After simulation completion, it parses the outputs, generates `results.json`, and deletes the `.running` lock file.
* If ANSYS is not installed on the system, it automatically runs in **fallback mode**, executing the high-fidelity ROM with standard multi-dimensional thermal discrepancies.
