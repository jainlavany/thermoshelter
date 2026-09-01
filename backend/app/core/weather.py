import logging
import json
import urllib.request
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

CITY_COORDINATES = {
    "leh":    {"name": "Leh, Ladakh", "lat": 34.1526, "lon": 77.5771, "climate_type": "Cold & Arid"},
    "delhi":  {"name": "New Delhi",   "lat": 28.6139, "lon": 77.2090, "climate_type": "Composite"},
    "mumbai": {"name": "Mumbai",      "lat": 19.0760, "lon": 72.8777, "climate_type": "Hot & Humid"},
}

SEASON_TEMPS = {
    "winter":  {"temp_offset": -8.0, "solar_factor": 0.85},
    "equinox": {"temp_offset": 0.0,  "solar_factor": 1.00},
    "summer":  {"temp_offset": 14.0, "solar_factor": 1.15},
}

def fetch_live_weather(lat: float, lon: float, location_name: str, season: str = "winter") -> Optional[Dict[str, Any]]:
    try:
        url = (
            f"{settings.OPEN_METEO_URL}?"
            f"latitude={lat}&longitude={lon}"
            f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation"
            f"&forecast_days=1&timezone=auto"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "ThermoShelter/2.0"})
        with urllib.request.urlopen(req, timeout=settings.OPEN_METEO_TIMEOUT_SECONDS) as response:
            if response.status == 200:
                raw_data = json.loads(response.read().decode("utf-8"))
                hourly = raw_data.get("hourly", {})

                times = hourly.get("time", [])
                temps = hourly.get("temperature_2m", [])
                humidities = hourly.get("relative_humidity_2m", [])
                winds = hourly.get("wind_speed_10m", [])
                solar = hourly.get("shortwave_radiation", [])

                season_meta = SEASON_TEMPS.get(season, SEASON_TEMPS["winter"])
                offset = season_meta["temp_offset"]
                factor = season_meta["solar_factor"]

                records = []
                for i in range(min(24, len(times))):
                    t_str = times[i].split("T")[1][:5] if "T" in times[i] else f"{i:02d}:00"
                    t_val = float(temps[i]) + offset
                    s_val = (float(solar[i]) if solar[i] is not None else 0.0) * factor
                    records.append({
                        "timestamp": t_str,
                        "ambient_temp_C": round(t_val, 1),
                        "solar_irradiance_W_m2": round(s_val, 1),
                        "wind_speed_m_s": float(winds[i]) if winds[i] is not None else 1.0,
                        "relative_humidity_pct": float(humidities[i]) if humidities[i] is not None else 50.0
                    })

                return {
                    "source": f"Open-Meteo Live ({season.capitalize()})",
                    "data_type": "live_weather",
                    "season": season,
                    "is_real_time": True,
                    "is_synthetic": False,
                    "location": {
                        "name": location_name,
                        "latitude": lat,
                        "longitude": lon
                    },
                    "records": records
                }
    except Exception as e:
        logger.warning(f"Open-Meteo live API fetch failed: {e}")
        return None
