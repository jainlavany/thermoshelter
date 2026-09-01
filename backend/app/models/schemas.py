from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class LayerInput(BaseModel):
    material: str
    thickness: float = Field(..., gt=0, description="Thickness in meters")

class GeometryInput(BaseModel):
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    floors: int = Field(1, ge=1, le=2)
    orientation: float = Field(0.0, ge=0.0, le=360.0)
    window_ratio: float = Field(0.08, ge=0.0, le=0.50)
    ach: float = Field(0.5, ge=0.0, le=10.0)
    wall_layers: List[LayerInput]
    roof_layers: List[LayerInput]
    floor_layers: List[LayerInput]

class SimulationRequest(BaseModel):
    geometry: GeometryInput
    location: str = "Leh, Ladakh"
    location_key: Optional[str] = "leh"   # leh | delhi | mumbai
    initial_temp: float = 15.0

class OptimizationRequest(BaseModel):
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    target_min_temp: float = 18.0
    target_max_temp: float = 25.0
    available_materials: Optional[List[str]] = None
    location_key: Optional[str] = "leh"   # leh | delhi | mumbai
