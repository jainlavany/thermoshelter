from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json

from app.config import settings
from app.core.database import get_database
from app.core.thermal_network import ThermalNetworkSolver
from app.core.optimizer import ShelterOptimizer
from app.core.ansys_orchestrator import AnsysOrchestrator
from app.models.schemas import SimulationRequest, OptimizationRequest
from app.data import (
    materials_db,
    climate_leh_24h,
    climate_delhi_24h,
    climate_mumbai_24h,
    climate_registry,
    LOCATION_META,
)
from app.core.weather import fetch_live_weather, CITY_COORDINATES

app = FastAPI(title="ThermoShelter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ansys_orchestrator = AnsysOrchestrator(settings.JOBS_DIR)

@app.on_event("startup")
async def startup_event():
    db = get_database()
    await db.materials.delete_many({})
    if materials_db:
        await db.materials.insert_many(materials_db)

    for key, data in climate_registry.items():
        exists = await db.climate.count_documents({"location_key": key})
        if exists == 0:
            await db.climate.insert_one({"location_key": key, **data})

def resolve_climate_data(location_key: str):
    key = (location_key or "leh").lower()
    meta = CITY_COORDINATES.get(key)
    if meta:
        live_data = fetch_live_weather(meta["lat"], meta["lon"], meta["name"])
        if live_data:
            return live_data
    return climate_registry.get(key, climate_leh_24h)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ThermoShelter API"}

@app.get("/api/materials")
async def get_materials():
    db = get_database()
    materials = await db.materials.find({}, {"_id": 0}).to_list(length=100)
    return materials

@app.get("/api/locations")
async def list_locations():
    return LOCATION_META

@app.get("/api/climate")
async def get_climate_default():
    return resolve_climate_data("leh")

@app.get("/api/climate/{location_key}")
@app.get("/api/weather/{location_key}")
async def get_climate_by_key(location_key: str):
    return resolve_climate_data(location_key)

@app.post("/api/simulations/quick")
@app.post("/api/simulate")
async def run_quick_simulation(req: SimulationRequest):
    location_key = req.location_key or "leh"
    climate_data = resolve_climate_data(location_key)
    records = climate_data["records"]

    db = get_database()
    materials_list = await db.materials.find({}, {"_id": 0}).to_list(length=100)

    try:
        geom_dict = req.geometry.dict()
        solver = ThermalNetworkSolver(geom_dict, materials_list, records)
        results = solver.solve(initial_temp=req.initial_temp)
        results["location"] = climate_data.get("location", {})
        results["location_key"] = location_key
        results["is_real_time"] = climate_data.get("is_real_time", False)
        results["source"] = climate_data.get("source", "local_fixture")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/api/simulations/ansys")
@app.post("/api/ansys/run")
async def run_ansys_simulation(req: SimulationRequest):
    location_key = req.location_key or "leh"
    climate_data = resolve_climate_data(location_key)
    records = climate_data["records"]

    db = get_database()
    materials_list = await db.materials.find({}, {"_id": 0}).to_list(length=100)

    try:
        geom_dict = req.geometry.dict()
        job_id = ansys_orchestrator.create_job(
            geometry=geom_dict,
            materials=materials_list,
            weather_records=records,
            initial_temp=req.initial_temp
        )
        return {"job_id": job_id, "status": "QUEUED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ANSYS Job creation failed: {str(e)}")

@app.get("/api/simulations/ansys/status/{job_id}")
@app.get("/api/ansys/status/{job_id}")
async def check_ansys_status(job_id: str):
    try:
        return ansys_orchestrator.check_job_status(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimization")
async def optimize_design(req: OptimizationRequest):
    location_key = req.location_key or "leh"
    climate_data = resolve_climate_data(location_key)
    records = climate_data["records"]

    db = get_database()
    materials_list = await db.materials.find({}, {"_id": 0}).to_list(length=100)

    try:
        optimizer = ShelterOptimizer(materials_list, records)
        constraints = req.dict()
        results = optimizer.run_optimization(constraints)
        results["location"] = climate_data.get("location", {})
        results["location_key"] = location_key
        results["is_real_time"] = climate_data.get("is_real_time", False)
        results["source"] = climate_data.get("source", "local_fixture")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/api/export/json")
async def export_results_json(payload: dict):
    json_bytes = json.dumps(payload, indent=2).encode("utf-8")
    return JSONResponse(
        content=payload,
        headers={
            "Content-Disposition": "attachment; filename=thermoshelter_results.json"
        }
    )
