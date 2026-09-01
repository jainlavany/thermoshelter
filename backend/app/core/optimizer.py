from typing import List, Dict, Any
from app.core.thermal_network import ThermalNetworkSolver

class ShelterOptimizer:
    def __init__(self, available_materials: List[Dict[str, Any]], weather_records: List[Dict[str, Any]]):
        self.available_materials = available_materials
        self.weather_records = weather_records
        
    def run_optimization(self, constraints: Dict[str, Any]) -> Dict[str, Any]:
        length = constraints["length"]
        width = constraints["width"]
        height = constraints["height"]
        target_min = constraints.get("target_min_temp", 18.0)
        target_max = constraints.get("target_max_temp", 25.0)
        
        structural_mats = [m for m in self.available_materials if m["category"] == "structural"]
        insulation_mats = [m for m in self.available_materials if m["category"] == "insulation"]
        mass_mats = [m for m in self.available_materials if m["category"] == "thermal_mass"]
        
        orientations = [0.0, 45.0, 90.0, 135.0, 180.0]
        window_ratios = [0.04, 0.08, 0.12, 0.16]
        insulation_thicknesses = [0.0, 0.05, 0.10, 0.15]
        
        candidates = []
        
        for struct in structural_mats[:3]:
            for ins in insulation_mats[:3]:
                for t_ins in insulation_thicknesses:
                    for orient in orientations:
                        for win_ratio in window_ratios:
                            wall_layers = [
                                {"material": struct["name"], "thickness": 0.23}, # 230mm structural block
                            ]
                            if t_ins > 0:
                                wall_layers.append({"material": ins["name"], "thickness": t_ins})
                                
                            roof_layers = [
                                {"material": "Softwood Timber", "thickness": 0.05},
                            ]
                            if t_ins > 0:
                                roof_layers.append({"material": ins["name"], "thickness": t_ins})
                                
                            floor_layers = [
                                {"material": "Dense Concrete", "thickness": 0.10} # base slab
                            ]
                            
                            geom = {
                                "length": length,
                                "width": width,
                                "height": height,
                                "orientation": orient,
                                "window_ratio": win_ratio,
                                "ach": 0.5,
                                "wall_layers": wall_layers,
                                "roof_layers": roof_layers,
                                "floor_layers": floor_layers
                            }
                            
                            try:
                                solver = ThermalNetworkSolver(geom, self.available_materials, self.weather_records)
                                res = solver.solve(initial_temp=15.0)
                                
                                temps = res["indoor_temperatures"]
                                comfort_steps = sum(1 for t in temps if target_min <= t <= target_max)
                                comfort_pct = comfort_steps / len(temps)
                                
                                loss = res["heat_loss_total_kwh"]
                                gain = res["solar_gain_total_kwh"]
                                
                                score = (comfort_pct * 100.0) - (loss * 1.5) + (gain * 0.5)
                                
                                candidates.append({
                                    "geometry": geom,
                                    "comfort_pct": comfort_pct,
                                    "heat_loss_kwh": loss,
                                    "solar_gain_kwh": gain,
                                    "score": score,
                                    "description": f"{struct['name']} + {ins['name']} ({int(t_ins*1000)}mm) @ {int(orient)}°"
                                })
                            except Exception:
                                continue
                                
        candidates.sort(key=lambda x: x["score"], reverse=True)
        top_candidates = candidates[:5]
        
        return {
            "optimal_design": top_candidates[0] if top_candidates else None,
            "comparison_runs": top_candidates,
            "total_explored": len(candidates)
        }
