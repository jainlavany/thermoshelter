import React, { useState } from 'react'
import { MapPin, SunMedium, Moon, Wind, Droplets, Thermometer, ShieldCheck, ArrowUpRight } from 'lucide-react'

const CLIMATE_CARDS = [
  {
    key: 'leh',
    name: 'Leh, Ladakh',
    zone: 'Cold & Arid',
    altitude: '3,500 m',
    tempRange: '-15°C to 12°C',
    solarIrradiance: 'High (750 W/m²)',
    challenge: 'Sub-zero freezing risk, intense night radiative heat loss',
    color: 'border-blue-200 bg-blue-50/50 text-blue-900',
    badge: 'bg-blue-100 text-blue-800'
  },
  {
    key: 'delhi',
    name: 'New Delhi',
    zone: 'Composite Climate',
    altitude: '216 m',
    tempRange: '4°C to 42°C',
    solarIrradiance: 'Moderate (600 W/m²)',
    challenge: 'Extreme seasonal swings: severe winter cold & harsh summer heat',
    color: 'border-yellow-200 bg-yellow-50/50 text-yellow-900',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  {
    key: 'mumbai',
    name: 'Mumbai',
    zone: 'Hot & Humid',
    altitude: '14 m',
    tempRange: '20°C to 36°C',
    solarIrradiance: 'High Humidity (85%+)',
    challenge: 'High relative humidity, minimal diurnal drop, cooling demand',
    color: 'border-orange-200 bg-orange-50/50 text-orange-900',
    badge: 'bg-orange-100 text-orange-800'
  }
]

export default function ClimateStudio({ weather, selectedKey, onSelectLocation }) {
  const [comparing, setComparing] = useState(false)

  const activeCity = CLIMATE_CARDS.find(c => c.key === selectedKey) || CLIMATE_CARDS[0]
  const records = weather?.records || []
  const noonRecord = records[12] || {}
  const nightRecord = records[3] || {}

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header Banner */}
      <div className="panel p-6 bg-linear-to-r from-gray-900 to-gray-800 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
            Climate Dynamics Explorer
          </span>
          <h2 className="text-xl font-black text-white">Multi-Location Solar Microclimates</h2>
          <p className="text-xs text-gray-300 max-w-xl mt-1 leading-relaxed">
            Passive solar performance depends directly on local ambient thermal swings, solar position, and nocturnal heat retention. Select a climate zone below to evaluate your shelter geometry under real-world conditions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setComparing(!comparing)}
            className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all interactive-btn shadow-sm"
          >
            {comparing ? 'Single View' : 'Compare Climate Zones'}
          </button>
        </div>
      </div>

      {/* City Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CLIMATE_CARDS.map(city => {
          const isSelected = city.key === selectedKey
          return (
            <div
              key={city.key}
              onClick={() => onSelectLocation(city.key)}
              className={`panel p-5 cursor-pointer transition-all interactive-card flex flex-col justify-between gap-4 border-2 ${
                isSelected
                  ? 'border-black shadow-md bg-white'
                  : 'border-gray-200 hover:border-gray-400 bg-gray-50/50'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${city.badge}`}>
                    {city.zone}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-700" /> {city.name}
                </h3>
                <span className="text-xs text-gray-500 block font-medium mt-0.5">Elevation: {city.altitude}</span>
              </div>

              <div className="panel-raised p-3 rounded-xl flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center border-b border-gray-200/80 pb-1.5">
                  <span className="text-gray-500 font-medium">Temp Range</span>
                  <span className="font-extrabold text-gray-900">{city.tempRange}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Solar Irradiance</span>
                  <span className="font-bold text-gray-900">{city.solarIrradiance}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                <strong>Challenge:</strong> {city.challenge}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectLocation(city.key)
                }}
                className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-900 hover:text-white'
                }`}
              >
                {isSelected ? 'Simulating Selected Zone' : 'Switch to Climate'} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Live Hourly Weather Breakdown Table */}
      {records.length > 0 && (
        <div className="panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">24-Hour Diurnal Weather Feed</span>
              <h3 className="text-sm font-bold text-gray-900">{activeCity.name} Live Diurnal Breakdown</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-1.5"><SunMedium className="w-4 h-4 text-amber-500" /> Peak Solar: {noonRecord.solar_irradiance_W_m2 || 0} W/m²</span>
              <span className="flex items-center gap-1.5"><Moon className="w-4 h-4 text-indigo-500" /> Night Trough: {nightRecord.ambient_temp_C || 0}°C</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Hour</th>
                  <th className="py-2.5 px-3">Ambient Temp (°C)</th>
                  <th className="py-2.5 px-3">Solar Radiation (W/m²)</th>
                  <th className="py-2.5 px-3">Wind Speed (m/s)</th>
                  <th className="py-2.5 px-3">Humidity (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.slice(0, 24).map((r, i) => {
                  const isDay = r.solar_irradiance_W_m2 > 10
                  return (
                    <tr key={i} className={`hover:bg-gray-50/80 transition-colors ${i === 12 ? 'bg-amber-50/40 font-bold' : ''}`}>
                      <td className="py-2 px-3 font-semibold text-gray-800 flex items-center gap-2">
                        {isDay ? <SunMedium className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                        {r.timestamp}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-gray-900">{r.ambient_temp_C.toFixed(1)}°C</td>
                      <td className="py-2 px-3 font-mono text-gray-700">{r.solar_irradiance_W_m2.toFixed(0)} W/m²</td>
                      <td className="py-2 px-3 font-mono text-gray-700">{r.wind_speed_m_s.toFixed(1)} m/s</td>
                      <td className="py-2 px-3 font-mono text-gray-700">{r.relative_humidity_pct.toFixed(0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
