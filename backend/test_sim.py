import sys
sys.path.insert(0, '/home/lavany-jain/ThermoShelter/backend')
import json

with open('/home/lavany-jain/ThermoShelter/backend/app/data/climate_leh_24h.json') as f:
    climate = json.load(f)
records = climate['records']

with open('/home/lavany-jain/ThermoShelter/backend/app/data/materials.json') as f:
    mats = json.load(f)

from app.core.thermal_network import ThermalNetworkSolver

geometry = {
    'length': 5.0, 'width': 4.0, 'height': 3.0, 'floors': 1,
    'orientation': 15.0, 'window_ratio': 0.08, 'ach': 0.5,
    'wall_layers': [{'material': 'Common Clay Brick', 'thickness': 0.23}, {'material': 'Expanded Polystyrene (EPS)', 'thickness': 0.05}],
    'roof_layers': [{'material': 'Softwood Timber', 'thickness': 0.05}, {'material': 'Expanded Polystyrene (EPS)', 'thickness': 0.05}],
    'floor_layers': [{'material': 'Dense Concrete', 'thickness': 0.10}]
}

solver = ThermalNetworkSolver(geometry, mats, records)
result = solver.solve(initial_temp=18.0)
print('solar_gain:', result['solar_gain_total_kwh'])
print('heat_loss:', result['heat_loss_total_kwh'])
print('comfort_hours:', result['comfort_hours'])
print('SOLVER OK')
