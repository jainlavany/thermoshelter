import React, { useState } from 'react'
import { Sliders, Play, ShieldAlert, Download, FileText, MapPin } from 'lucide-react'
import SimulationProgress from './SimulationProgress'
import RecommendationCard from './RecommendationCard'
import Comparison from './Comparison'

function RangeField({ label, value, display, min, max, step, onChange }) {
  return (
    <div className="group">
      <div className="flex justify-between mb-1.5 text-xs">
        <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{label}</span>
        <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg bg-gray-200" style={{ accentColor: '#111' }}
      />
    </div>
  )
}

// ── Report helpers ─────────────────────────────────────────────────────────────
function downloadOptimizationJSON(result, locationName) {
  const filename = `thermoshelter_optimization_${locationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function openOptimizationReport(result, locationName, locationKey) {
  if (!result?.optimal_design) return
  const opt = result.optimal_design
  const candidates = result.comparison_runs || []

  const rows = candidates.map((c, i) => `
    <tr style="${i === 0 ? 'background:#f9f9f9;font-weight:600' : ''}">
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${c.description}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:center">${(c.comfort_pct * 24).toFixed(1)} hrs</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:center">${c.solar_gain_kwh.toFixed(2)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:center">${c.heat_loss_kwh.toFixed(2)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:center;font-weight:700">${c.score.toFixed(1)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${i === 0 ? '✅ BEST' : '—'}</td>
    </tr>`).join('')

  const wallLayers = (opt.geometry?.wall_layers || [])
    .map(l => `${l.material} (${(l.thickness * 1000).toFixed(0)} mm)`).join(', ')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>ThermoShelter Optimization Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Roboto', Arial, sans-serif; color: #111; background: #fff; padding: 40px; }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }
    h2 { font-size: 11px; font-weight: 500; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
    h3 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 8px; margin: 24px 0 12px; }
    .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 16px; }
    .card-label { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { padding: 8px 12px; background: #f0f0f0; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #ddd; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; display: flex; justify-content: space-between; }
    .badge { display: inline-block; background: #111; color: #fff; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; margin-left: 8px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ThermoShelter <span class="badge">Optimization Report</span></h1>
    <h2>Climate Zone: ${locationName} · Generated ${new Date().toLocaleString()}</h2>
  </div>

  <h3>Optimal Passive Design Configuration</h3>
  <p style="font-size:13px;font-weight:600;margin-bottom:16px;color:#333">${opt.description || 'N/A'}</p>
  <div class="grid">
    <div class="card"><div class="card-label">Comfort Hours / Day</div><div class="card-value">${(opt.comfort_pct * 24).toFixed(1)} hrs</div></div>
    <div class="card"><div class="card-label">Solar Gain</div><div class="card-value">${opt.solar_gain_kwh?.toFixed(2)} kWh</div></div>
    <div class="card"><div class="card-label">Heat Loss</div><div class="card-value">${opt.heat_loss_kwh?.toFixed(2)} kWh</div></div>
    <div class="card"><div class="card-label">Orientation</div><div class="card-value" style="font-size:14px">${opt.geometry?.orientation}° E of S</div></div>
    <div class="card"><div class="card-label">Window Ratio</div><div class="card-value" style="font-size:14px">${((opt.geometry?.window_ratio || 0) * 100).toFixed(0)}%</div></div>
    <div class="card"><div class="card-label">Composite Score</div><div class="card-value">${opt.score?.toFixed(1)}</div></div>
  </div>

  <h3>Optimal Wall Assembly</h3>
  <p style="font-size:12px;color:#444;margin-bottom:16px">${wallLayers || 'N/A'}</p>

  <h3>Design Space Exploration — Top ${candidates.length} Configurations</h3>
  <p style="font-size:11px;color:#888;margin-bottom:12px">Total configurations explored: <strong>${result.total_explored || 0}</strong></p>
  <table>
    <tr>
      <th>Configuration</th>
      <th style="text-align:center">Comfort (hrs)</th>
      <th style="text-align:center">Solar Gain (kWh)</th>
      <th style="text-align:center">Heat Loss (kWh)</th>
      <th style="text-align:center">Score</th>
      <th style="text-align:center">Rank</th>
    </tr>
    ${rows}
  </table>

  <div class="footer">
    <span>ThermoShelter — Passive Solar Innovation · Team Infinity · SIH 2026</span>
    <span>Physics-Based RC Parametric Solver</span>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
// ─────────────────────────────────────────────────────────────────────────────

export default function OptimizationPanel({ materials, onOptimize, locationKey = 'leh', locationName = 'Leh, Ladakh' }) {
  const [targetMin, setTargetMin] = useState(18)
  const [targetMax, setTargetMax] = useState(25)
  const [length, setLength] = useState(5)
  const [width, setWidth] = useState(4)
  const [height, setHeight] = useState(3)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progressSteps, setProgressSteps] = useState([])
  const [result, setResult] = useState(null)

  const handleStartOptimization = async () => {
    setIsOptimizing(true)
    setResult(null)

    const steps = [
      { label: 'Validating geometry dimensions…',       desc: 'Analysing constraints and boundary limits.',           status: 'active' },
      { label: 'Permuting composite material layers…',  desc: 'Analysing insulation thermal values.',                 status: 'todo' },
      { label: 'Executing Multi-Node RC ODE solver…',   desc: 'Calculating transient energy balances (240 configs).', status: 'todo' },
      { label: 'Filtering comfort-hours constraints…',  desc: 'Applying multi-objective scoring threshold.',          status: 'todo' }
    ]
    setProgressSteps(steps)

    const advance = (idx) => setProgressSteps(prev =>
      prev.map((s, i) =>
        i === idx - 1 ? { ...s, status: 'done' } :
        i === idx     ? { ...s, status: 'active' } : s
      )
    )

    await new Promise(r => setTimeout(r, 800))
    advance(1)
    await new Promise(r => setTimeout(r, 1000))
    advance(2)

    try {
      const data = await onOptimize({ length, width, height, target_min_temp: targetMin, target_max_temp: targetMax })
      await new Promise(r => setTimeout(r, 1000))
      advance(3)
      await new Promise(r => setTimeout(r, 600))
      setProgressSteps(prev => prev.map(s => ({ ...s, status: 'done' })))
      setResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Constraints */}
        <div className="panel p-5 flex flex-col gap-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-gray-700" /> Comfort & Boundary Targets
          </h3>

          {/* Active location badge */}
          <div className="flex items-center gap-2 text-xs text-gray-500 panel-raised px-3 py-2 rounded-lg">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-700" />
            <span>Target Climate Zone: <span className="font-semibold text-gray-900">{locationName}</span></span>
          </div>

          <div className="flex flex-col gap-4">
            <RangeField label="Target Minimum Temp" value={targetMin} display={`${targetMin}°C`} min={14} max={22} step={0.5} onChange={setTargetMin} />
            <RangeField label="Target Maximum Temp" value={targetMax} display={`${targetMax}°C`} min={22} max={28} step={0.5} onChange={setTargetMax} />

            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-3">
                {[['Length', length, setLength], ['Width', width, setWidth], ['Height', height, setHeight]].map(([label, val, setter]) => (
                  <div key={label} className="flex-1">
                    <span className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider font-medium">{label} (m)</span>
                    <input type="number" value={val} onChange={e => setter(parseFloat(e.target.value))} className="w-full text-center font-bold" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartOptimization}
            disabled={isOptimizing}
            className="w-full py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-all interactive-btn flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Find Optimal Design
          </button>
        </div>

        {/* Progress / Result */}
        <div className="panel p-5 min-h-[300px] flex flex-col justify-center">
          {isOptimizing ? (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Simulating Comfort-Optimal Design Matrix</span>
              <SimulationProgress steps={progressSteps} />
            </div>
          ) : result ? (
            <RecommendationCard optimal={result.optimal_design} />
          ) : (
            <div className="text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-gray-300" />
              <span>Configure boundary limits and click solve to launch the parametric design explorer.</span>
            </div>
          )}
        </div>
      </div>

      {result && <Comparison candidates={result.comparison_runs} />}

      {/* Optimization Report Export */}
      {result && (
        <div className="panel p-5 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Optimization Report
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Export the complete design-space exploration results for academic submissions, government reports, or institutional use.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => downloadOptimizationJSON(result, locationName)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-xs font-semibold uppercase tracking-widest rounded-lg transition-all interactive-btn"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
            <button
              onClick={() => openOptimizationReport(result, locationName, locationKey)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-all interactive-btn shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> Generate Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
