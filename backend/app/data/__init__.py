import os
import json

data_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(data_dir, "materials.json"), "r") as f:
    materials_db = json.load(f)

with open(os.path.join(data_dir, "climate_leh_24h.json"), "r") as f:
    climate_leh_24h = json.load(f)

with open(os.path.join(data_dir, "climate_delhi_24h.json"), "r") as f:
    climate_delhi_24h = json.load(f)

with open(os.path.join(data_dir, "climate_mumbai_24h.json"), "r") as f:
    climate_mumbai_24h = json.load(f)

# Registry keyed by location slug — used by /api/climate/{key}
climate_registry = {
    "leh":    climate_leh_24h,
    "delhi":  climate_delhi_24h,
    "mumbai": climate_mumbai_24h,
}

LOCATION_META = [
    {"key": "leh",    "name": "Leh, Ladakh",  "lat": 34.1526, "lon": 77.5771, "climate_type": "Cold & Arid"},
    {"key": "delhi",  "name": "New Delhi",     "lat": 28.6139, "lon": 77.2090, "climate_type": "Composite"},
    {"key": "mumbai", "name": "Mumbai",        "lat": 19.0760, "lon": 72.8777, "climate_type": "Hot & Humid"},
]
