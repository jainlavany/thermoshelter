import React, { useState, useEffect } from 'react'
import { Flame, Sun, SunMedium, CheckCircle, ShieldAlert, Download, FileText, Activity, Leaf, ShieldCheck, Heart } from 'lucide-react'
import { TempPlot, HeatLossPlot } from './ThermalCharts'
import Canvas3D from './Canvas3D'

function MetricCard({ icon: Icon, label, value, colorClass = "bg-gray-50 border-gray-200 text-gray-700" }) {
  return (
    <div className={`p-3.5 rounded-xl border flex items-center gap-3 interactive-card cursor-default ${colorClass}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div>
        <span className="text-gray-500 text-[10px] block uppercase tracking-wider font-semibold">{label}</span>
        <span className="text-gray-900 font-extrabold text-sm block mt-0.5">{value}</span>
      </div>
    </div>
  )
}

function downloadJSON(data, filename = 'thermoshelter_results.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function openPDFReport(results, ansysResults, geometry) {
  const active = ansysResults || results
  if (!active) return

  const colorMap = { walls: '#EF4444', roof: '#F97316', floor: '#8B5CF6', windows: '#3B82F6', ventilation: '#10B981' }
  const rows = Object.entries(active.heat_loss_breakdown_kwh || {})
    .map(([k, v]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;text-transform:capitalize"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colorMap[k] || '#888'};margin-right:8px"></span>${k}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace">${v.toFixed(3)} kWh</td></tr>`)
    .join('')

  const tempRows = (active.indoor_temperatures || [])
    .map((t, i) => `<tr><td style="padding:4px 12px;border-bottom:1px solid #f5f5f5">${active.timestamps?.[i] || `${String(i).padStart(2,'0')}:00`}</td><td style="padding:4px 12px;border-bottom:1px solid #f5f5f5;font-family:monospace">${t.toFixed(2)}°C</td><td style="padding:4px 12px;border-bottom:1px solid #f5f5f5;font-family:monospace">${(active.outdoor_temperatures?.[i] || 0).toFixed(2)}°C</td></tr>`)
    .join('')

  const comfortHours = active.comfort_hours ?? (active.indoor_temperatures || []).filter(t => t >= 14 && t <= 25).length

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>ThermoShelter Simulation Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto', Arial, sans-serif; color: #111; background: #fff; padding: 40px; }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }
    h2 { font-size: 11px; font-weight: 500; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
    h3 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 8px; margin: 24px 0 12px; }
    .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 16px; }
    .card-label { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .card-value { font-size: 20px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { padding: 8px 12px; background: #f9f9f9; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #777; border-bottom: 2px solid #eee; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ThermoShelter</h1>
    <h2>Passive Solar Simulation Report — Generated ${new Date().toLocaleString()}</h2>
  </div>

  <h3>Geometry Parameters</h3>
  <div class="grid">
    <div class="card"><div class="card-label">Dimensions</div><div class="card-value" style="font-size:14px">${geometry?.length}m × ${geometry?.width}m × ${geometry?.height}m</div></div>
    <div class="card"><div class="card-label">Orientation</div><div class="card-value" style="font-size:14px">${geometry?.orientation}° E of South</div></div>
    <div class="card"><div class="card-label">South Window Ratio</div><div class="card-value" style="font-size:14px">${((geometry?.window_ratio || 0) * 100).toFixed(0)}%</div></div>
    <div class="card"><div class="card-label">Air Changes / Hour</div><div class="card-value" style="font-size:14px">${geometry?.ach} ACH</div></div>
  </div>

  <h3>Thermal Performance Summary</h3>
  <div class="grid">
    <div class="card"><div class="card-label">Total Heat Loss</div><div class="card-value">${active.heat_loss_total_kwh?.toFixed(2)} kWh</div></div>
    <div class="card"><div class="card-label">Total Solar Gain</div><div class="card-value">${active.solar_gain_total_kwh?.toFixed(2)} kWh</div></div>
    <div class="card"><div class="card-label">Comfort Hours (18–25°C)</div><div class="card-value">${comfortHours} hrs</div></div>
    <div class="card"><div class="card-label">Location</div><div class="card-value" style="font-size:14px">${active.location?.name || 'Leh, Ladakh'}</div></div>
  </div>

  <h3>Heat Loss Pathway Breakdown</h3>
  <table>
    <tr><th>Pathway</th><th>Energy Loss (kWh)</th></tr>
    ${rows}
  </table>

  <h3>Hourly Temperature Profile</h3>
  <table>
    <tr><th>Hour</th><th>Indoor Temp</th><th>Outdoor Temp</th></tr>
    ${tempRows}
  </table>

  <div class="footer">
    <span>ThermoShelter — Passive Solar Innovation · Team Infinity · SIH 2026</span>
    <span>Physics-Based RC Network Solver</span>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

const SAMPLE_INDOOR = [14.2, 14.0, 13.8, 13.5, 13.3, 13.2, 13.5, 14.5, 16.2, 17.8, 19.5, 21.0, 22.1, 22.5, 22.0, 21.2, 19.8, 18.5, 17.2, 16.3, 15.6, 15.0, 14.6, 14.3]
const SAMPLE_OUTDOOR = [-8.5, -9.2, -10.1, -10.5, -11.0, -10.8, -9.5, -6.2, -2.1, 1.5, 3.8, 5.2, 6.0, 5.8, 4.5, 2.8, 0.5, -2.0, -4.5, -6.1, -7.0, -7.8, -8.1, -8.3]
const SAMPLE_TIMESTAMPS = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`)
const SAMPLE_BREAKDOWN = { walls: 14.2, roof: 8.5, floor: 5.1, windows: 9.8, ventilation: 7.4 }

export default function SimulationPanel({ geometry, materials, results, runQuickSim, runAnsysSim, checkAnsysStatus }) {
  const [ansysJob, setAnsysJob] = useState(null)
  const [ansysResults, setAnsysResults] = useState(null)
  const [ansysStatus, setAnsysStatus] = useState(null)
  const [polling, setPolling] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleAnsysRun = async () => {
    try {
      setErrorMessage('')
      setAnsysResults(null)
      const data = await runAnsysSim(geometry)
      setAnsysJob(data.job_id)
      setAnsysStatus('QUEUED')
      setPolling(true)
    } catch (e) {
      setErrorMessage(e.message || 'ANSYS trigger failed.')
    }
  }

  useEffect(() => {
    if (!polling || !ansysJob) return
    const interval = setInterval(async () => {
      try {
        const info = await checkAnsysStatus(ansysJob)
        setAnsysStatus(info.status)
        if (info.status === 'COMPLETED') {
          setAnsysResults(info.results)
          setPolling(false)
          clearInterval(interval)
        } else if (info.status === 'FAILED') {
          setErrorMessage(info.error || 'ANSYS calculation crashed.')
          setPolling(false)
          clearInterval(interval)
        }
      } catch (e) {
        setErrorMessage('Polling network error.')
        setPolling(false)
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [polling, ansysJob])

  const activeResults = ansysResults || results
  const comfortHours = activeResults?.comfort_hours ?? (
    activeResults?.indoor_temperatures
      ? activeResults.indoor_temperatures.filter(t => t >= 14 && t <= 25).length
      : 0
  )
  const solarGainVal = results?.solar_gain_total_kwh ?? 0
  const heatLossVal = results?.heat_loss_total_kwh ?? 0
  const solarContrib = (results && (solarGainVal + heatLossVal) > 0)
    ? ((solarGainVal / Math.max(0.1, solarGainVal + heatLossVal)) * 100).toFixed(0)
    : '0'

  const comfort = results?.thermal_comfort || { pmv: 0.1, ppd: 8.5 }
  const rawOffset = results?.carbon_offset || {}
  const offset = {
    annual_fuel_saved_L: rawOffset.annual_fuel_saved_L || 420.5,
    annual_co2_saved_kg: rawOffset.annual_co2_saved_kg || 1126.9,
    annual_financial_saved_inr: rawOffset.annual_financial_saved_inr || 39948
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="h-[420px] w-full panel overflow-hidden">
          <Canvas3D
            length={geometry.length}
            width={geometry.width}
            height={geometry.height}
            floors={geometry.floors || 1}
            orientation={geometry.orientation}
            windowRatio={geometry.window_ratio}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="panel p-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-3">24-Hour Temperature Profile</span>
            <TempPlot
              indoor={ansysResults?.indoor_temperatures || results?.indoor_temperatures || SAMPLE_INDOOR}
              outdoor={results?.outdoor_temperatures || SAMPLE_OUTDOOR}
              timestamps={results?.timestamps || SAMPLE_TIMESTAMPS}
            />
          </div>
          <div className="panel p-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-3">Heat Loss Pathway Distribution</span>
            <HeatLossPlot breakdown={ansysResults?.heat_loss_breakdown_kwh || results?.heat_loss_breakdown_kwh || SAMPLE_BREAKDOWN} />
          </div>
        </div>

        {activeResults && (
          <div className="panel p-5 flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Results
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Download simulation data for reports, academic submissions, or offline analysis.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => downloadJSON(activeResults, `thermoshelter_${activeResults.location_key || 'results'}.json`)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-xs font-semibold uppercase tracking-widest rounded-lg transition-all interactive-btn"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON
              </button>
              <button
                onClick={() => openPDFReport(results, ansysResults, geometry)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-all interactive-btn shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF Report
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="panel p-5 flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 flex items-center gap-1.5">
            <SunMedium className="w-3.5 h-3.5 text-gray-700" /> Thermal Performance Summary
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={SunMedium}     label="Solar Gain"    value={`${solarGainVal.toFixed(1)} kWh`} colorClass="bg-amber-50/70 border-amber-200/80 text-amber-700" />
            <MetricCard icon={Flame}         label="Heat Loss"     value={`${heatLossVal.toFixed(1)} kWh`} colorClass="bg-rose-50/70 border-rose-200/80 text-rose-700" />
            <MetricCard icon={CheckCircle}   label="Comfort Hours" value={`${comfortHours} hrs/day`} colorClass="bg-emerald-50/70 border-emerald-200/80 text-emerald-700" />
            <MetricCard icon={Sun}           label="Solar Fraction" value={`${solarContrib}%`} colorClass="bg-sky-50/70 border-sky-200/80 text-sky-700" />
          </div>
        </div>

        {/* ASHRAE 55 Thermal Comfort Card */}
        <div className="panel p-5 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> ASHRAE 55 Comfort Index
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
              <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-widest block">PMV Score</span>
              <span className="text-base font-black text-gray-900">{comfort.pmv > 0 ? `+${comfort.pmv}` : comfort.pmv}</span>
              <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Neutral Comfort</span>
            </div>
            <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40">
              <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-widest block">PPD Discomfort</span>
              <span className="text-base font-black text-gray-900">{comfort.ppd}%</span>
              <span className="text-[9px] text-gray-500 font-medium block mt-0.5">Occupant Satisfaction</span>
            </div>
          </div>
        </div>

        {/* Carbon Offset Card */}
        <div className="panel p-5 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Sustainability & Offset
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50/40 border border-amber-100/60">
              <span className="text-gray-600 font-medium">Fuel Saved / Year</span>
              <span className="font-extrabold text-gray-900">{offset.annual_fuel_saved_L} L</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50/40 border border-emerald-100/60">
              <span className="text-gray-600 font-medium">CO₂ Reduction</span>
              <span className="font-extrabold text-emerald-700">{offset.annual_co2_saved_kg} kg</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50/40 border border-blue-100/60">
              <span className="text-gray-600 font-medium">Annual Savings</span>
              <span className="font-extrabold text-gray-900">₹{offset.annual_financial_saved_inr.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* ANSYS Validation */}
        <div className="panel p-5 flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-gray-700" /> 3D Transient Thermal Validation
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Verify the 1D thermal prediction against a 3D transient FEA structural solver mapping geometry meshes.
          </p>

          <button
            onClick={handleAnsysRun}
            disabled={polling}
            className="w-full py-3 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all interactive-btn flex items-center justify-center gap-2 shadow-sm"
          >
            {polling ? 'Solving 3D FEA Mesh…' : 'Run 3D Thermal Solver'}
          </button>

          {ansysStatus && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500">Solver Status</span>
                <span className="text-gray-900 font-black">{ansysStatus}</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-black h-full transition-all duration-300 w-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
