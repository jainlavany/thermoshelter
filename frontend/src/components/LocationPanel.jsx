import React from 'react'
import { MapPin, Sun, Moon, Wind, Droplets, ChevronDown, Compass } from 'lucide-react'

const CLIMATE_TYPE_COLORS = {
  'Cold & Arid': 'bg-blue-50 text-blue-700 border-blue-200',
  'Composite':   'bg-amber-50 text-amber-700 border-amber-200',
  'Hot & Humid': 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function LocationPanel({ weather, locations = [], selectedKey, onSelectLocation }) {
  if (!weather || !weather.records || weather.records.length === 0) return null

  const locationName = weather.location?.name || 'Leh, Ladakh'
  const midDayRecord = weather.records[12] || weather.records[0] // 12:00 PM
  const nightRecord  = weather.records[3]  || weather.records[0] // 03:00 AM

  const currentMeta = locations.find(l => l.key === selectedKey)
  const climateType = currentMeta?.climate_type || 'Cold & Arid'
  const badgeClass = CLIMATE_TYPE_COLORS[climateType] || 'bg-gray-100 text-gray-700 border-gray-200'

  const stats = [
    { icon: Sun,      label: 'Mid-Day Temp', value: `${midDayRecord.ambient_temp_C}°C`, highlight: 'text-amber-600 bg-amber-50/80' },
    { icon: Moon,     label: 'Night Temp',   value: `${nightRecord.ambient_temp_C}°C`, highlight: 'text-indigo-600 bg-indigo-50/80' },
    { icon: Sun,      label: 'Solar Irrad.', value: `${midDayRecord.solar_irradiance_W_m2} W/m²`, highlight: 'text-yellow-600 bg-yellow-50/80' },
    { icon: Wind,     label: 'Wind Speed',   value: `${midDayRecord.wind_speed_m_s} m/s`, highlight: 'text-cyan-600 bg-cyan-50/80' },
    { icon: Droplets, label: 'Humidity',     value: `${midDayRecord.relative_humidity_pct}%`, highlight: 'text-blue-600 bg-blue-50/80' },
  ]

  const isLive = weather.is_real_time || (weather.source && weather.source.includes('Open-Meteo'))

  return (
    <div className="panel p-5 grid grid-cols-1 lg:grid-cols-7 gap-5 items-center">

      {/* Location selector */}
      <div className="lg:col-span-2 flex flex-col gap-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
          <Compass className="w-3 h-3 text-gray-500" /> Active Climate Microclimate
        </span>
        <div className="relative group">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800 pointer-events-none group-hover:scale-110 transition-transform" />
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={selectedKey}
            onChange={e => onSelectLocation(e.target.value)}
            style={{ paddingLeft: '2.75rem', paddingRight: '2.25rem' }}
            className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-black text-gray-900 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black shadow-2xs transition-all"
          >
            {locations.length > 0
              ? locations.map(loc => (
                  <option key={loc.key} value={loc.key}>{loc.name}</option>
                ))
              : (
                <>
                  <option value="leh">Leh, Ladakh</option>
                  <option value="delhi">New Delhi</option>
                  <option value="mumbai">Mumbai</option>
                </>
              )
            }
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
            {climateType}
          </span>
          {isLive ? (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE METEO API
            </span>
          ) : (
            <span className="text-[10px] text-gray-500 font-medium px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50">
              Offline Dataset
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:col-span-5 gap-3 text-xs">
        {stats.map(({ icon: Icon, label, value, highlight }) => (
          <div key={label} className="panel-raised p-3.5 flex items-center gap-3 interactive-card cursor-default">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${highlight}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-gray-400 text-[10px] block uppercase tracking-widest font-bold">{label}</span>
              <span className="text-gray-900 font-black text-xs block mt-0.5">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
