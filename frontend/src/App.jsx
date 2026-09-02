import React, { useState, useEffect } from 'react'
import logoImg from './assets/THERMOSHELTER.png'
import { Home, Globe, Sliders, Layers, Leaf, Scale } from 'lucide-react'
import LocationPanel from './components/LocationPanel'
import ShelterDesigner from './components/ShelterDesigner'
import SimulationPanel from './components/SimulationPanel'
import ClimateStudio from './components/ClimateStudio'
import OptimizationPanel from './components/OptimizationPanel'
import MaterialLibrary from './components/MaterialLibrary'
import CarbonCalculator from './components/CarbonCalculator'
import HousingComparison from './components/HousingComparison'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [materials, setMaterials] = useState([])
  const [weather, setWeather] = useState(null)
  const [locations, setLocations] = useState([])
  const [selectedLocationKey, setSelectedLocationKey] = useState('leh')

  const [geometry, setGeometry] = useState({
    length: 5.0,
    width: 4.0,
    height: 3.0,
    floors: 1,
    orientation: 15.0,
    window_ratio: 0.08,
    ach: 0.5,
    wall_layers: [
      { material: 'Common Clay Brick', thickness: 0.23 },
      { material: 'Expanded Polystyrene (EPS)', thickness: 0.05 }
    ],
    roof_layers: [
      { material: 'Softwood Timber', thickness: 0.05 },
      { material: 'Expanded Polystyrene (EPS)', thickness: 0.05 }
    ],
    floor_layers: [
      { material: 'Dense Concrete', thickness: 0.10 }
    ]
  })

  const [simulationResults, setSimulationResults] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/materials`)
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error(err))

    fetch(`${API_BASE}/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/climate/${selectedLocationKey}`)
      .then(res => res.json())
      .then(data => {
        setWeather(data)
        runQuickSimulation(geometry, data)
      })
      .catch(err => console.error(err))
  }, [selectedLocationKey])

  useEffect(() => {
    if (weather) {
      const timer = setTimeout(() => {
        runQuickSimulation(geometry, weather)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [
    geometry.length,
    geometry.width,
    geometry.height,
    geometry.floors,
    geometry.orientation,
    geometry.window_ratio,
    geometry.ach,
    JSON.stringify(geometry.wall_layers),
    JSON.stringify(geometry.roof_layers),
    JSON.stringify(geometry.floor_layers),
    selectedLocationKey,
    weather
  ])

  const runQuickSimulation = async (geom, wData) => {
    if (!wData) return
    setIsSimulating(true)
    try {
      const res = await fetch(`${API_BASE}/simulations/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geom,
          weather_key: selectedLocationKey,
          initial_temp: 18.0
        })
      })
      if (res.ok) {
        const result = await res.json()
        setSimulationResults(result)
      } else {
        const err = await res.json().catch(() => ({}))
        console.error('Simulation error:', err)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleSimulate = () => {
    runQuickSimulation(geometry, weather)
  }

  const handleAnsysRun = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulations/ansys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry,
          weather_key: selectedLocationKey,
          initial_temp: 18.0
        })
      })
      const data = await res.json()
      return data.job_id
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const handleAnsysStatus = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/simulations/ansys/status/${jobId}`)
      return await res.json()
    } catch (e) {
      console.error(e)
      return { status: 'FAILED' }
    }
  }

  const handleOptimize = async (constraints) => {
    const res = await fetch(`${API_BASE}/optimization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...constraints, location_key: selectedLocationKey })
    })
    return await res.json()
  }

  const tabs = [
    { id: 'dashboard',  label: 'Shelter Studio', icon: Home },
    { id: 'comparison', label: 'Housing Comparison', icon: Scale },
    { id: 'climate',    label: 'Climate Dynamics', icon: Globe },
    { id: 'optimize',   label: 'Passive Optimizer', icon: Sliders },
    { id: 'materials',  label: 'Thermal Materials', icon: Layers },
    { id: 'carbon',     label: 'Carbon Analytics', icon: Leaf },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 flex flex-col" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="ThermoShelter Logo"
            className="w-10 h-10 object-contain rounded-xl transition-transform hover:scale-105"
          />
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-black">
              ThermoShelter
            </h1>
            <span className="text-[10px] text-gray-500 block tracking-wider font-semibold">High-Altitude Passive Solar Simulator</span>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/80 text-xs shadow-inner">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200 font-bold interactive-btn ${
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {weather && (
          <LocationPanel
            weather={weather}
            locations={locations}
            selectedKey={selectedLocationKey}
            onSelectLocation={setSelectedLocationKey}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            <div className="lg:col-span-1">
              <ShelterDesigner
                geometry={geometry}
                setGeometry={setGeometry}
                materials={materials}
                onSimulate={handleSimulate}
                isSimulating={isSimulating}
              />
            </div>
            <div className="lg:col-span-3">
              <SimulationPanel
                results={simulationResults}
                onAnsysRun={handleAnsysRun}
                onAnsysStatus={handleAnsysStatus}
                geometry={geometry}
              />
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="animate-fade-in">
            <HousingComparison
              weather={weather}
              geometry={geometry}
              materials={materials}
            />
          </div>
        )}

        {activeTab === 'climate' && (
          <div className="animate-fade-in">
            <ClimateStudio
              weather={weather}
              selectedKey={selectedLocationKey}
              onSelectLocation={setSelectedLocationKey}
            />
          </div>
        )}

        {activeTab === 'optimize' && (
          <div className="animate-fade-in">
            <OptimizationPanel
              materials={materials}
              onOptimize={handleOptimize}
              locationKey={selectedLocationKey}
              locationName={weather?.location?.name || 'Leh, Ladakh'}
            />
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="animate-fade-in">
            <MaterialLibrary materials={materials} />
          </div>
        )}

        {activeTab === 'carbon' && (
          <div className="animate-fade-in">
            <CarbonCalculator carbonOffset={simulationResults?.carbon_offset} />
          </div>
        )}
      </main>
    </div>
  )
}
