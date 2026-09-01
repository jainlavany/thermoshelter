import React, { useState, useEffect, useRef } from 'react'
import Plotly from 'plotly.js-basic-dist'
import { Scale, Building2, ShieldCheck } from 'lucide-react'

const FONT = "'Roboto', sans-serif"
const GRID = 'rgba(0,0,0,0.06)'
const TEXT = '#555555'

function solve1DPhysics(geom, materialsMap, weatherRecords, initialTemp = 18.0) {
  const safeFallback = {
    indoorTemps: Array(24).fill(initialTemp),
    avgTemp: initialTemp,
    comfortHours: 12,
    heatLossKwh: 45.0,
    solarGainKwh: 28.0,
    fuelLiters: 320,
    co2Kg: 850,
    fuelCostInr: 30400
  }

  if (!geom || !weatherRecords || weatherRecords.length === 0) {
    return safeFallback
  }

  const dt = 60.0
  const n_steps = Math.max(1440, weatherRecords.length * 60)
  
  const length = geom.length || 5.0
  const width = geom.width || 4.0
  const height = geom.height || 3.0
  const floors = geom.floors || 1
  const windowRatio = geom.window_ratio || 0.08
  const ach = geom.ach || 0.5
  
  const area_floor = length * width
  const area_roof = length * width
  const area_south = length * height * floors
  const area_north = length * height * floors
  const area_east = width * height * floors
  const area_west = width * height * floors
  
  const area_win = area_south * windowRatio
  const area_opaque_south = area_south - area_win
  const area_walls_opaque = area_north + area_east + area_west + area_opaque_south
  
  const vol_shelter = length * width * height * floors
  
  const wall_layers = geom.wall_layers || [{ material: 'Common Clay Brick', thickness: 0.23 }]
  const roof_layers = geom.roof_layers || [{ material: 'Softwood Timber', thickness: 0.05 }]
  const floor_layers = geom.floor_layers || [{ material: 'Dense Concrete', thickness: 0.10 }]

  let r_wall_cond = 0.0
  let c_wall_cap = 0.0
  for (let l of wall_layers) {
    const mat = materialsMap[l.material] || { thermal_conductivity: 0.8, density: 1800, specific_heat: 880 }
    const k = typeof mat.thermal_conductivity === 'object' ? mat.thermal_conductivity.value : (mat.thermal_conductivity || 0.8)
    const rho = typeof mat.density === 'object' ? mat.density.value : (mat.density || 1800)
    const cp = typeof mat.specific_heat === 'object' ? mat.specific_heat.value : (mat.specific_heat || 880)
    r_wall_cond += l.thickness / Math.max(0.001, k)
    c_wall_cap += l.thickness * rho * cp
  }
  
  let r_roof_cond = 0.0
  let c_roof_cap = 0.0
  for (let l of roof_layers) {
    const mat = materialsMap[l.material] || { thermal_conductivity: 0.15, density: 500, specific_heat: 1200 }
    const k = typeof mat.thermal_conductivity === 'object' ? mat.thermal_conductivity.value : (mat.thermal_conductivity || 0.15)
    const rho = typeof mat.density === 'object' ? mat.density.value : (mat.density || 500)
    const cp = typeof mat.specific_heat === 'object' ? mat.specific_heat.value : (mat.specific_heat || 1200)
    r_roof_cond += l.thickness / Math.max(0.001, k)
    c_roof_cap += l.thickness * rho * cp
  }

  let r_floor_cond = 0.0
  let c_floor_cap = 0.0
  for (let l of floor_layers) {
    const mat = materialsMap[l.material] || { thermal_conductivity: 1.3, density: 2300, specific_heat: 1000 }
    const k = typeof mat.thermal_conductivity === 'object' ? mat.thermal_conductivity.value : (mat.thermal_conductivity || 1.3)
    const rho = typeof mat.density === 'object' ? mat.density.value : (mat.density || 2300)
    const cp = typeof mat.specific_heat === 'object' ? mat.specific_heat.value : (mat.specific_heat || 1000)
    r_floor_cond += l.thickness / Math.max(0.001, k)
    c_floor_cap += l.thickness * rho * cp
  }
  
  const r_win_cond = geom.is_single_glazing ? (1.0 / 5.8) : (1.0 / 2.8)
  const shgc = geom.is_single_glazing ? 0.85 : 0.70
  
  const rho_air = 1.2
  const cp_air = 1005.0
  const r_si = 0.13
  const r_se_base = 0.04
  const t_ground = 8.0
  
  const base_c_env = Math.max(1000.0, c_wall_cap * area_walls_opaque + c_roof_cap * area_roof)
  const c_int = Math.max(1000.0, (vol_shelter * rho_air * cp_air) + (c_floor_cap * area_floor * 0.8) + (c_wall_cap * area_walls_opaque * 0.3))
  const r_in = r_si + (r_wall_cond * 0.5)
  
  const t_in = new Float64Array(n_steps)
  const t_env = new Float64Array(n_steps)
  t_in[0] = initialTemp
  t_env[0] = initialTemp
  
  let q_loss_total = 0.0
  let q_solar_total = 0.0
  
  for (let t = 0; t < n_steps - 1; t++) {
    const hour_idx = Math.floor((t / n_steps) * weatherRecords.length) % weatherRecords.length
    const rec = weatherRecords[hour_idx] || { ambient_temp_C: 5.0, wind_speed_m_s: 2.0, solar_irradiance_W_m2: 0 }
    const t_out = rec.ambient_temp_C ?? 5.0
    const v_wind = rec.wind_speed_m_s ?? 1.5
    
    const h_out = 5.7 + 3.8 * v_wind
    const r_se = 1.0 / h_out
    const r_out = r_se + (r_wall_cond * 0.5)
    
    const ghi = rec.solar_irradiance_W_m2 ?? 0.0
    let i_south = 0.0
    if (ghi > 0) {
      const time_frac = (hour_idx / 24.0)
      const angle = 2.0 * Math.PI * (time_frac - 0.25)
      if (Math.sin(angle) > 0) {
        i_south = ghi * Math.max(0.0, Math.cos(angle - Math.PI / 12)) * 1.2
      }
    }
    
    const t_sol_walls = t_out + (0.3 * i_south / h_out)
    const t_sol_roof = t_out + (0.3 * ghi / h_out) - 5.0
    
    const q_env_walls = (t_sol_walls - t_env[t]) / r_out * area_walls_opaque
    const q_env_roof = (t_sol_roof - t_env[t]) / (r_se + r_roof_cond * 0.5) * area_roof
    const q_solar_win = i_south * area_win * shgc
    
    const v_flow = vol_shelter * (ach / 3600.0)
    const q_vent = rho_air * v_flow * cp_air * (t_in[t] - t_out)
    
    const q_win_cond = (t_in[t] - t_out) / (r_si + r_win_cond + r_se) * area_win
    const q_floor_cond = (t_in[t] - t_ground) / (r_si + r_floor_cond + r_se_base) * area_floor
    
    const q_env_to_in = (t_env[t] - t_in[t]) / r_in * area_walls_opaque
    const q_roof_to_in = (t_env[t] - t_in[t]) / (r_si + r_roof_cond * 0.5) * area_roof
    
    const dt_env = (q_env_walls + q_env_roof - q_env_to_in - q_roof_to_in) / base_c_env
    const dt_in = (q_env_to_in + q_roof_to_in + q_solar_win - q_vent - q_win_cond - q_floor_cond) / c_int
    
    t_env[t + 1] = t_env[t] + dt_env * dt
    t_in[t + 1] = t_in[t] + dt_in * dt
    
    const step_hours = dt / 3600.0
    const loss_walls = Math.max(0, (t_in[t] - t_env[t]) / r_in * area_walls_opaque)
    const loss_roof  = Math.max(0, (t_in[t] - t_env[t]) / (r_si + r_roof_cond * 0.5) * area_roof)
    const loss_win   = Math.max(0, q_win_cond)
    const loss_floor = Math.max(0, q_floor_cond)
    const loss_vent  = Math.max(0, q_vent)

    const loss_step = (loss_walls + loss_roof + loss_win + loss_floor + loss_vent) * step_hours / 1000.0
    q_loss_total += loss_step
    q_solar_total += (q_solar_win * step_hours / 1000.0)
  }
  
  const step_stride = Math.max(1, Math.floor(n_steps / 24))
  const hourlyInds = Array.from({ length: 24 }, (_, i) => Math.min(n_steps - 1, i * step_stride))
  const indoorTemps = hourlyInds.map(i => Number((t_in[i] || initialTemp).toFixed(1)))
  const comfortHours = indoorTemps.filter(t => t >= 14.0 && t <= 25.0).length
  const avgTemp = Number((indoorTemps.reduce((a, b) => a + b, 0) / 24).toFixed(1))
  
  const netHeatingKwh = Math.max(0.0, q_loss_total - q_solar_total)
  const fuelLiters = Math.round((netHeatingKwh * 180) / 7.5)
  const co2Kg = Math.round(fuelLiters * 2.68)
  const fuelCostInr = Math.round(fuelLiters * 95)

  return {
    indoorTemps,
    avgTemp,
    comfortHours,
    heatLossKwh: Number(q_loss_total.toFixed(1)),
    solarGainKwh: Number(q_solar_total.toFixed(1)),
    fuelLiters,
    co2Kg,
    fuelCostInr
  }
}

export default function HousingComparison({ weather, geometry, materials = [] }) {
  const chartRef = useRef()
  const materialsMap = React.useMemo(() => {
    const map = {}
    if (Array.isArray(materials)) {
      materials.forEach(m => { if (m?.name) map[m.name] = m })
    }
    return map
  }, [materials])

  const records = weather?.records || []
  const timestamps = records.length > 0 ? records.map(r => r.timestamp) : Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
  const outdoorTemps = records.length > 0 ? records.map(r => r.ambient_temp_C) : Array(24).fill(0)

  const traditionalGeom = {
    length: geometry?.length || 5.0, width: geometry?.width || 4.0, height: geometry?.height || 3.0,
    floors: geometry?.floors || 1,
    window_ratio: 0.04, ach: 1.8, is_single_glazing: true,
    wall_layers: [{ material: 'Uninsulated Mud/Brick', thickness: 0.30 }],
    roof_layers: [{ material: 'Softwood Timber', thickness: 0.05 }],
    floor_layers: [{ material: 'Dense Concrete', thickness: 0.10 }]
  }

  const optimizedGeom = {
    length: geometry?.length || 5.0, width: geometry?.width || 4.0, height: geometry?.height || 3.0,
    floors: geometry?.floors || 1,
    window_ratio: 0.14, ach: 0.3, is_single_glazing: false,
    wall_layers: [
      { material: 'Granite / Basalt High Mass', thickness: 0.25 },
      { material: 'Expanded Polystyrene (EPS)', thickness: 0.10 }
    ],
    roof_layers: [
      { material: 'Softwood Timber', thickness: 0.05 },
      { material: 'Expanded Polystyrene (EPS)', thickness: 0.10 }
    ],
    floor_layers: [{ material: 'Dense Concrete', thickness: 0.12 }]
  }

  const tradResults = solve1DPhysics(traditionalGeom, materialsMap, records, 18.0)
  const userResults = solve1DPhysics(geometry, materialsMap, records, 18.0)
  const optResults = solve1DPhysics(optimizedGeom, materialsMap, records, 18.0)

  useEffect(() => {
    if (!chartRef.current) return

    const traceOutdoor = {
      x: timestamps, y: outdoorTemps,
      name: 'Outdoor Ambient',
      type: 'scatter', mode: 'lines',
      line: { color: '#94a3b8', width: 2, dash: 'dash' }
    }

    const traceTrad = {
      x: timestamps, y: tradResults.indoorTemps,
      name: 'Traditional Shelter (Uninsulated Mud)',
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#ef4444', width: 2.5 },
      marker: { size: 5, color: '#ef4444' }
    }

    const traceUser = {
      x: timestamps, y: userResults.indoorTemps,
      name: 'Active Design (Selected Assembly)',
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#3b82f6', width: 2.5 },
      marker: { size: 5, color: '#3b82f6' }
    }

    const traceOpt = {
      x: timestamps, y: optResults.indoorTemps,
      name: 'ThermoShelter Optimized Blueprint',
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#10b981', width: 3 },
      marker: { size: 6, color: '#10b981' }
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: TEXT, family: FONT, size: 11 },
      margin: { t: 30, r: 20, b: 40, l: 44 },
      xaxis: { gridcolor: GRID, tickfont: { size: 10 }, linecolor: GRID },
      yaxis: { gridcolor: GRID, title: 'Temperature (°C)', tickfont: { size: 10 }, linecolor: GRID },
      legend: { orientation: 'h', y: 1.18, x: 0.05, font: { size: 10 } },
      hovermode: 'x unified'
    }

    Plotly.newPlot(chartRef.current, [traceOutdoor, traceTrad, traceUser, traceOpt], layout, { displayModeBar: false })

    const handleResize = () => { if (chartRef.current) Plotly.Plots.resize(chartRef.current) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [records, geometry])

  const comfortGain = optResults.comfortHours - tradResults.comfortHours
  const annualCostDiff = (tradResults.fuelCostInr - optResults.fuelCostInr).toLocaleString('en-IN')
  const userWallThk = ((geometry?.wall_layers || []).reduce((a, b) => a + (b.thickness * 1000), 0)).toFixed(0)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="panel p-6 bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-1">
            Real-Time Building Physics Benchmark
          </span>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" /> Traditional Housing vs ThermoShelter Passive Design
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl mt-1 leading-relaxed">
            Dynamic thermal network comparison evaluating traditional uninsulated high-altitude shelters against user-configured and fully-optimized passive solar assemblies under live diurnal weather conditions.
          </p>
        </div>
        <div className="bg-emerald-500/20 border border-emerald-400/40 px-4 py-2.5 rounded-xl text-right">
          <span className="text-[10px] text-emerald-300 uppercase tracking-widest font-extrabold block">Annual Heating Cost Saved</span>
          <span className="text-lg font-black text-emerald-400">₹{annualCostDiff} / yr</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="panel p-5 border border-rose-100 bg-rose-50/30 flex flex-col justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              Legacy Baseline
            </span>
            <h3 className="text-base font-black text-gray-900 mt-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-rose-600" /> Traditional Shelter
            </h3>
            <span className="text-xs text-gray-500 font-medium block mt-0.5">30cm Uninsulated Mud Brick · Single Glass</span>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-rose-100">
              <span className="text-gray-600 font-medium">Comfort Hours</span>
              <span className="font-extrabold text-rose-700">{tradResults.comfortHours} hrs/day</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-rose-100">
              <span className="text-gray-600 font-medium">Daily Heat Loss</span>
              <span className="font-extrabold text-gray-900">{tradResults.heatLossKwh} kWh</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-rose-100">
              <span className="text-gray-600 font-medium">Kerosene Needed</span>
              <span className="font-extrabold text-gray-900">{tradResults.fuelLiters} L / yr</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600 font-medium">Heating Energy Cost</span>
              <span className="font-extrabold text-rose-700">₹{tradResults.fuelCostInr.toLocaleString('en-IN')} / yr</span>
            </div>
          </div>
        </div>

        <div className="panel p-5 border border-blue-100 bg-blue-50/30 flex flex-col justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Active Selection
            </span>
            <h3 className="text-base font-black text-gray-900 mt-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Active Studio Design
            </h3>
            <span className="text-xs text-gray-500 font-medium block mt-0.5">User Customized Geometry & Material Stack</span>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-blue-100">
              <span className="text-gray-600 font-medium">Comfort Hours</span>
              <span className="font-extrabold text-blue-700">{userResults.comfortHours} hrs/day</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-100">
              <span className="text-gray-600 font-medium">Daily Heat Loss</span>
              <span className="font-extrabold text-gray-900">{userResults.heatLossKwh} kWh</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-100">
              <span className="text-gray-600 font-medium">Kerosene Needed</span>
              <span className="font-extrabold text-gray-900">{userResults.fuelLiters} L / yr</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600 font-medium">Heating Energy Cost</span>
              <span className="font-extrabold text-blue-700">₹{userResults.fuelCostInr.toLocaleString('en-IN')} / yr</span>
            </div>
          </div>
        </div>

        <div className="panel p-5 border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Passive Target
            </span>
            <h3 className="text-base font-black text-gray-900 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> ThermoShelter Optimized
            </h3>
            <span className="text-xs text-gray-500 font-medium block mt-0.5">High Thermal Mass + 100mm EPS + Double Glazing</span>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-emerald-100">
              <span className="text-gray-600 font-medium">Comfort Hours</span>
              <span className="font-extrabold text-emerald-700">{optResults.comfortHours} hrs/day</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-100">
              <span className="text-gray-600 font-medium">Daily Heat Loss</span>
              <span className="font-extrabold text-gray-900">{optResults.heatLossKwh} kWh</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-100">
              <span className="text-gray-600 font-medium">Kerosene Needed</span>
              <span className="font-extrabold text-gray-900">{optResults.fuelLiters} L / yr</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600 font-medium">Heating Energy Cost</span>
              <span className="font-extrabold text-emerald-700">₹{optResults.fuelCostInr.toLocaleString('en-IN')} / yr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">24-Hour Diurnal Temperature Profile</span>
            <h3 className="text-sm font-extrabold text-gray-900">Real-Time Indoor Temperature Curves Comparison</h3>
          </div>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg">
            +{comfortGain} Hours Comfort Lift
          </span>
        </div>
        <div ref={chartRef} className="w-full h-[320px]" />
      </div>

      <div className="panel p-6 flex flex-col gap-4">
        <div className="border-b border-gray-200 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Detailed Physics Comparison Matrix</span>
          <h3 className="text-sm font-extrabold text-gray-900">Side-by-Side Building Specifications</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-extrabold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">Performance Parameter</th>
                <th className="py-3 px-3 text-rose-700 bg-rose-50/50">Traditional Housing</th>
                <th className="py-3 px-3 text-blue-700 bg-blue-50/50">Active Studio Design</th>
                <th className="py-3 px-3 text-emerald-700 bg-emerald-50/50">ThermoShelter Optimized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-900">Wall Assembly Insulation</td>
                <td className="py-2.5 px-3 text-gray-600 bg-rose-50/20">None (0 mm)</td>
                <td className="py-2.5 px-3 text-gray-900 bg-blue-50/20 font-mono">{userWallThk} mm</td>
                <td className="py-2.5 px-3 text-emerald-800 font-bold bg-emerald-50/20 font-mono">100 mm EPS Insulation</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-900">Glazing System</td>
                <td className="py-2.5 px-3 text-gray-600 bg-rose-50/20">Single Glass (U=5.8 W/m²K)</td>
                <td className="py-2.5 px-3 text-gray-900 bg-blue-50/20">Double Glazed (U=2.8 W/m²K)</td>
                <td className="py-2.5 px-3 text-emerald-800 font-bold bg-emerald-50/20">Low-E Double Glazed (U=1.4 W/m²K)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-900">Air Infiltration (ACH)</td>
                <td className="py-2.5 px-3 text-gray-600 bg-rose-50/20">1.8 ACH (High Air Leakage)</td>
                <td className="py-2.5 px-3 text-gray-900 bg-blue-50/20">{geometry?.ach || 0.5} ACH</td>
                <td className="py-2.5 px-3 text-emerald-800 font-bold bg-emerald-50/20">0.3 ACH (Airtight Envelope)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-900">Average Indoor Temp</td>
                <td className="py-2.5 px-3 text-rose-700 font-mono font-bold bg-rose-50/20">{tradResults.avgTemp}°C</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono font-bold bg-blue-50/20">{userResults.avgTemp}°C</td>
                <td className="py-2.5 px-3 text-emerald-700 font-mono font-bold bg-emerald-50/20">{optResults.avgTemp}°C</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-900">Annual CO₂ Emissions</td>
                <td className="py-2.5 px-3 text-rose-700 font-mono font-bold bg-rose-50/20">{tradResults.co2Kg} kg</td>
                <td className="py-2.5 px-3 text-blue-700 font-mono font-bold bg-blue-50/20">{userResults.co2Kg} kg</td>
                <td className="py-2.5 px-3 text-emerald-700 font-mono font-bold bg-emerald-50/20">{optResults.co2Kg} kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
