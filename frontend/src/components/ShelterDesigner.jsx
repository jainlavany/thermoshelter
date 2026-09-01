import React from 'react'
import { Ruler, SunMedium, Layers, Plus, Trash2, Play, RefreshCw, Compass, Maximize2, ShieldCheck } from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3.5 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-gray-800" /> {title}
      </h3>
      {children}
    </div>
  )
}

function Slider({ label, value, display, min, max, step, onChange }) {
  const percentage = ((value - min) / (max - min)) * 100
  return (
    <div className="group">
      <div className="flex justify-between mb-1.5 text-xs">
        <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{label}</span>
        <span className="font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 shadow-2xs">{display}</span>
      </div>
      <div className="relative flex items-center">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-lg bg-gray-200 appearance-none cursor-pointer"
          style={{ accentColor: '#111' }}
        />
      </div>
    </div>
  )
}

export default function ShelterDesigner({ geometry, setGeometry, materials, onSimulate, isSimulating }) {
  const structural = materials.filter(m => m.category === 'structural')
  const insulation = materials.filter(m => m.category === 'insulation')

  const handleChange = (field, val) => setGeometry(prev => ({ ...prev, [field]: val }))

  const handleLayerChange = (layerType, index, field, value) => {
    const layers = [...geometry[layerType]]
    layers[index] = { ...layers[index], [field]: value }
    handleChange(layerType, layers)
  }

  const addLayer = (layerType) => {
    const defaultMat = layerType === 'wall_layers' ? structural[0]?.name : insulation[0]?.name
    handleChange(layerType, [...geometry[layerType], { material: defaultMat, thickness: 0.05 }])
  }

  const removeLayer = (layerType, index) => {
    handleChange(layerType, geometry[layerType].filter((_, i) => i !== index))
  }

  // Calculated spatial metrics
  const currentFloors = geometry.floors || 1
  const floorArea = (geometry.length * geometry.width * currentFloors).toFixed(1)
  const volume = (geometry.length * geometry.width * geometry.height * currentFloors).toFixed(1)
  const totalThickness = geometry.wall_layers.reduce((acc, l) => acc + (l.thickness * 1000), 0).toFixed(0)

  return (
    <div className="panel p-5 flex flex-col gap-5 animate-slide-up">

      {/* Quick Geometry Metrics Badge */}
      <div className="p-3.5 rounded-xl flex justify-between items-center text-xs border border-blue-100 bg-blue-50/40 shadow-2xs">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-blue-700 shrink-0" />
          <div>
            <span className="text-[10px] text-blue-600 block uppercase tracking-wider font-semibold">Total Floor Area</span>
            <span className="font-extrabold text-gray-900 text-xs">{floorArea} m²</span>
          </div>
        </div>
        <div className="h-6 w-px bg-blue-200/60" />
        <div>
          <span className="text-[10px] text-blue-600 block uppercase tracking-wider font-semibold">Enclosed Vol.</span>
          <span className="font-extrabold text-gray-900 text-xs">{volume} m³</span>
        </div>
        <div className="h-6 w-px bg-blue-200/60" />
        <div>
          <span className="text-[10px] text-blue-600 block uppercase tracking-wider font-semibold">Stories</span>
          <span className="font-extrabold text-gray-900 text-xs">{currentFloors === 2 ? 'G + 1st' : 'Ground'}</span>
        </div>
      </div>

      <Section icon={Ruler} title="Shelter Dimensions">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Building Configuration</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                onClick={() => handleChange('floors', 1)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  currentFloors === 1
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                🏢 Ground Floor
              </button>
              <button
                onClick={() => handleChange('floors', 2)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  currentFloors === 2
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                🏢 G + 1st Floor
              </button>
            </div>
          </div>

          <Slider
            label="Building Stories Slider"
            value={currentFloors}
            display={currentFloors === 2 ? 'G + 1st Floor (2 Stories)' : 'Ground Floor Only (1 Story)'}
            min={1} max={2} step={1}
            onChange={v => handleChange('floors', Math.round(v))}
          />
          <Slider label="Length (m)" value={geometry.length} display={`${geometry.length.toFixed(1)} m`} min={3} max={10} step={0.5} onChange={v => handleChange('length', v)} />
          <Slider label="Width (m)"  value={geometry.width}  display={`${geometry.width.toFixed(1)} m`}  min={3} max={10} step={0.5} onChange={v => handleChange('width', v)} />
          <Slider label="Story Height (m)" value={geometry.height} display={`${geometry.height.toFixed(1)} m / story`} min={2.4} max={4.5} step={0.1} onChange={v => handleChange('height', v)} />
        </div>
      </Section>

      <Section icon={SunMedium} title="Orientation & Glazing">
        <div className="flex flex-col gap-3.5">
          <Slider label="Solar Orientation Angle" value={geometry.orientation} display={`${geometry.orientation}° E of S`} min={0} max={360} step={5} onChange={v => handleChange('orientation', v)} />
          <Slider label="South Window Area Ratio" value={geometry.window_ratio} display={`${(geometry.window_ratio * 100).toFixed(0)}%`} min={0} max={0.30} step={0.01} onChange={v => handleChange('window_ratio', v)} />
          <Slider label="Air Changes Rate (ACH)" value={geometry.ach} display={`${geometry.ach} hr⁻¹`} min={0.1} max={3.0} step={0.1} onChange={v => handleChange('ach', v)} />
        </div>
      </Section>

      <Section icon={Layers} title="Envelope Wall Assembly">
        <div className="flex flex-col gap-2.5 max-h-[240px] overflow-y-auto pr-1">
          {geometry.wall_layers.map((layer, idx) => (
            <div key={idx} className="panel-raised p-3 rounded-xl flex flex-col gap-2 border border-gray-200 hover:border-gray-900 transition-all interactive-card">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  Layer {idx + 1}
                </span>
                <button
                  onClick={() => removeLayer('wall_layers', idx)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Remove layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={layer.material}
                  onChange={e => handleLayerChange('wall_layers', idx, 'material', e.target.value)}
                  className="flex-1 text-xs font-semibold"
                >
                  {structural.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                  {insulation.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
                <div className="flex items-center gap-1 w-20">
                  <input
                    type="number"
                    value={layer.thickness * 1000}
                    onChange={e => handleLayerChange('wall_layers', idx, 'thickness', parseFloat(e.target.value) / 1000)}
                    className="w-full text-center text-xs font-bold"
                  />
                  <span className="text-[10px] text-gray-400 font-medium">mm</span>
                </div>
              </div>

              {/* Visual Thickness Progress Indicator */}
              <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${Math.min(100, (layer.thickness * 1000 / 300) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => addLayer('wall_layers')}
            className="border border-dashed border-gray-300 hover:border-gray-900 hover:bg-gray-50 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 transition-all flex items-center justify-center gap-1.5 interactive-btn"
          >
            <Plus className="w-3.5 h-3.5" /> Add Wall Layer
          </button>
        </div>
      </Section>

      <button
        onClick={onSimulate}
        disabled={isSimulating}
        className="w-full py-3 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all interactive-btn flex items-center justify-center gap-2 shadow-sm"
      >
        {isSimulating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" /> Solving Thermal ODE…
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" /> Run Thermal Simulation
          </>
        )}
      </button>
    </div>
  )
}
