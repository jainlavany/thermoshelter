import numpy as np
from typing import Dict, List, Any

class ThermalNetworkSolver:
    def __init__(self, geometry: Dict[str, Any], materials: List[Dict[str, Any]], weather_records: List[Dict[str, Any]]):
        self.length = geometry["length"]
        self.width = geometry["width"]
        self.height = geometry["height"]
        self.orientation = geometry.get("orientation", 0.0)
        self.window_ratio = geometry.get("window_ratio", 0.08)
        self.ach = geometry.get("ach", 0.5)
        self.floors = int(geometry.get("floors", 1))
        
        self.materials = {m["name"]: m for m in materials}
        self.weather_records = weather_records
        
        self.vol_shelter = self.length * self.width * self.height * self.floors
        self.area_floor = self.length * self.width
        self.area_roof = self.length * self.width
        
        self.area_south = self.length * self.height * self.floors
        self.area_north = self.length * self.height * self.floors
        self.area_east = self.width * self.height * self.floors
        self.area_west = self.width * self.height * self.floors
        
        self.area_win = self.area_south * self.window_ratio
        self.area_opaque_south = self.area_south - self.area_win
        self.area_walls_opaque = self.area_north + self.area_east + self.area_west + self.area_opaque_south
        self.area_envelope = self.area_walls_opaque + self.area_roof + self.area_floor
        
        self.rho_air = 1.2
        self.cp_air = 1005.0
        
        self.setup_layers(geometry.get("wall_layers", []), geometry.get("roof_layers", []), geometry.get("floor_layers", []))

    def setup_layers(self, wall_layers: List[Dict[str, Any]], roof_layers: List[Dict[str, Any]], floor_layers: List[Dict[str, Any]]):
        def calc_assembly(layers):
            r_cond = 0.0
            cap = 0.0
            ext_alpha = 0.3
            ext_emissivity = 0.9
            has_pcm = False
            
            for i, layer in enumerate(layers):
                mat_name = layer["material"]
                thickness = layer["thickness"]
                mat = self.materials.get(mat_name)
                
                if mat:
                    k = mat["thermal_conductivity"]["value"] if isinstance(mat.get("thermal_conductivity"), dict) else mat.get("thermal_conductivity", 0.8)
                    rho = mat["density"]["value"] if isinstance(mat.get("density"), dict) else mat.get("density", 1800.0)
                    cp = mat["specific_heat"]["value"] if isinstance(mat.get("specific_heat"), dict) else mat.get("specific_heat", 880.0)
                else:
                    k, rho, cp = 0.8, 1800.0, 880.0
                
                r_cond += thickness / max(0.001, float(k or 0.8))
                cap += thickness * float(rho or 1800.0) * float(cp or 880.0)
                
                if "pcm" in mat_name.lower() or "phase change" in mat_name.lower():
                    has_pcm = True
                
                if i == len(layers) - 1:
                    ext_alpha = mat.get("solar_absorptivity", 0.3) if mat else 0.3
                    ext_emissivity = mat.get("emissivity", 0.9) if mat else 0.9
                        
            return r_cond, cap, ext_alpha, ext_emissivity, has_pcm

        self.r_wall_cond, self.c_wall_cap, self.alpha_wall, self.eps_wall, self.has_pcm_wall = calc_assembly(wall_layers)
        self.r_roof_cond, self.c_roof_cap, self.alpha_roof, self.eps_roof, self.has_pcm_roof = calc_assembly(roof_layers)
        self.r_floor_cond, self.c_floor_cap, _, _, _ = calc_assembly(floor_layers)
        
        self.r_win_cond = 1.0 / 2.8
        self.shgc = 0.70

    def get_incident_solar(self, hour: float, record: Dict[str, Any], surface: str) -> float:
        ghi = record["solar_irradiance_W_m2"]
        if ghi <= 0:
            return 0.0
            
        time_fraction = hour / 24.0
        angle = 2.0 * np.pi * (time_fraction - 0.25)
        solar_alt = max(0.0, np.sin(angle))
        
        if solar_alt <= 0:
            return 0.0
            
        if surface == "roof":
            return ghi
        elif surface == "south":
            shading_factor = max(0.0, np.cos(angle - np.pi/12))
            return ghi * shading_factor * 1.2
        elif surface == "north":
            return ghi * 0.15
        elif surface == "east":
            if hour < 12:
                return ghi * 1.3 * (12 - hour)/6.0
            return ghi * 0.15
        elif surface == "west":
            if hour >= 12:
                return ghi * 1.3 * (hour - 12)/6.0
            return ghi * 0.15
        return ghi

    def compute_pmv_ppd(self, temp_in: float, rh: float = 50.0) -> Dict[str, float]:
        pmv = 0.28 * (temp_in - 21.0) + 0.005 * (rh - 50.0)
        pmv = max(-3.0, min(3.0, pmv))
        ppd = 100.0 - 95.0 * np.exp(-0.03353 * (pmv**4) - 0.2179 * (pmv**2))
        return {"pmv": round(float(pmv), 2), "ppd": round(float(ppd), 1)}

    def solve(self, initial_temp: float = 18.0) -> Dict[str, Any]:
        dt = 60.0
        n_steps = len(self.weather_records) * 60
        
        t_in = np.zeros(n_steps)
        t_env = np.zeros(n_steps)
        t_out_arr = np.zeros(n_steps)
        
        t_in[0] = initial_temp
        t_env[0] = initial_temp
        
        r_si = 0.13
        r_se_base = 0.04
        t_ground = 8.0
        
        base_c_env = max(1000.0, self.c_wall_cap * self.area_walls_opaque + self.c_roof_cap * self.area_roof)
        c_int = max(1000.0, (self.vol_shelter * self.rho_air * self.cp_air) + (self.c_floor_cap * self.area_floor * 0.8) + (self.c_wall_cap * self.area_walls_opaque * 0.3))
        
        r_in = r_si + (self.r_wall_cond * 0.5)
        
        hours = np.linspace(0, len(self.weather_records), n_steps, endpoint=False)
        
        q_loss_total = 0.0
        q_solar_total = 0.0
        
        q_loss_breakdown = {
            "walls": 0.0,
            "roof": 0.0,
            "floor": 0.0,
            "windows": 0.0,
            "ventilation": 0.0
        }
        
        for t in range(n_steps - 1):
            hour_idx = int(hours[t])
            rec = self.weather_records[hour_idx]
            t_out = rec["ambient_temp_C"]
            v_wind = rec["wind_speed_m_s"]
            t_out_arr[t] = t_out
            
            h_out = 5.7 + 3.8 * v_wind
            r_se = 1.0 / h_out
            
            r_out = r_se + (self.r_wall_cond * 0.5)
            
            c_env = base_c_env
            if self.has_pcm_wall and 19.0 <= t_env[t] <= 23.0:
                c_env += 150000.0 * self.area_walls_opaque
            
            i_south = self.get_incident_solar(hours[t], rec, "south")
            i_north = self.get_incident_solar(hours[t], rec, "north")
            i_east = self.get_incident_solar(hours[t], rec, "east")
            i_west = self.get_incident_solar(hours[t], rec, "west")
            i_roof = self.get_incident_solar(hours[t], rec, "roof")
            
            t_sol_south = t_out + (self.alpha_wall * i_south / h_out)
            t_sol_north = t_out + (self.alpha_wall * i_north / h_out)
            t_sol_east = t_out + (self.alpha_wall * i_east / h_out)
            t_sol_west = t_out + (self.alpha_wall * i_west / h_out)
            
            t_sol_walls = (
                t_sol_south * self.area_opaque_south +
                t_sol_north * self.area_north +
                t_sol_east * self.area_east +
                t_sol_west * self.area_west
            ) / max(0.1, self.area_walls_opaque)
            
            t_sol_roof = t_out + (self.alpha_roof * i_roof / h_out) - (self.eps_roof * 60.0 / h_out)
            
            q_env_walls = (t_sol_walls - t_env[t]) / r_out * self.area_walls_opaque
            q_env_roof = (t_sol_roof - t_env[t]) / (r_se + self.r_roof_cond * 0.5) * self.area_roof
            
            q_solar_win = i_south * self.area_win * self.shgc
            
            v_flow = self.vol_shelter * (self.ach / 3600.0)
            q_vent = self.rho_air * v_flow * self.cp_air * (t_in[t] - t_out)
            
            q_win_cond = (t_in[t] - t_out) / (r_si + self.r_win_cond + r_se) * self.area_win
            q_floor_cond = (t_in[t] - t_ground) / (r_si + self.r_floor_cond + r_se_base) * self.area_floor
            
            q_env_to_in = (t_env[t] - t_in[t]) / r_in * self.area_walls_opaque
            q_roof_to_in = (t_env[t] - t_in[t]) / (r_si + self.r_roof_cond * 0.5) * self.area_roof
            
            dt_env = (q_env_walls + q_env_roof - q_env_to_in - q_roof_to_in) / c_env
            dt_in = (q_env_to_in + q_roof_to_in + q_solar_win - q_vent - q_win_cond - q_floor_cond) / c_int
            
            t_env[t+1] = t_env[t] + dt_env * dt
            t_in[t+1] = t_in[t] + dt_in * dt
            
            step_hours = dt / 3600.0
            
            loss_walls = max(0.0, (t_in[t] - t_env[t]) / r_in * self.area_walls_opaque) * step_hours / 1000.0
            loss_roof = max(0.0, (t_in[t] - t_env[t]) / (0.13 + r_roof_cond * 0.5) * self.area_roof) * step_hours / 1000.0
            loss_floor = max(0.0, q_floor_cond) * step_hours / 1000.0
            loss_win = max(0.0, q_win_cond) * step_hours / 1000.0
            loss_vent = max(0.0, q_vent) * step_hours / 1000.0
            
            q_loss_breakdown["walls"] += loss_walls
            q_loss_breakdown["roof"] += loss_roof
            q_loss_breakdown["floor"] += loss_floor
            q_loss_breakdown["windows"] += loss_win
            q_loss_breakdown["ventilation"] += loss_vent
            
            q_loss_total += (loss_walls + loss_roof + loss_floor + loss_win + loss_vent)
            q_solar_total += (q_solar_win * step_hours / 1000.0)
            
        t_out_arr[-1] = self.weather_records[-1]["ambient_temp_C"]
        
        hourly_idx = np.arange(0, n_steps, 60)
        final_indoor = t_in[hourly_idx].tolist()
        avg_temp = float(np.mean(final_indoor))
        
        comfort_hours = len([t for t in final_indoor if 14.0 <= t <= 25.0])
        comfort_metrics = self.compute_pmv_ppd(avg_temp)
        
        q_trad_loss = 65.0 * self.floors
        daily_energy_saved = max(5.0, q_trad_loss - (q_loss_total - q_solar_total))
        annual_fuel_saved_L = round(daily_energy_saved * 180.0 / 7.5, 1)
        annual_co2_saved_kg = round(annual_fuel_saved_L * 2.68, 1)
        annual_financial_saved_inr = round(annual_fuel_saved_L * 95.0, 0)

        return {
            "indoor_temperatures": final_indoor,
            "outdoor_temperatures": t_out_arr[hourly_idx].tolist(),
            "timestamps": [self.weather_records[int(h)]["timestamp"] for h in hours[hourly_idx]],
            "heat_loss_total_kwh": float(q_loss_total),
            "solar_gain_total_kwh": float(q_solar_total),
            "heat_loss_breakdown_kwh": {k: float(v) for k, v in q_loss_breakdown.items()},
            "comfort_hours": comfort_hours,
            "thermal_comfort": comfort_metrics,
            "carbon_offset": {
                "annual_fuel_saved_L": annual_fuel_saved_L,
                "annual_co2_saved_kg": annual_co2_saved_kg,
                "annual_financial_saved_inr": annual_financial_saved_inr
            }
        }
