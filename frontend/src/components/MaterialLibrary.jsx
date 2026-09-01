import React, { useState } from 'react'
import { Layers, Search, ExternalLink } from 'lucide-react'

export default function MaterialLibrary({ materials = [] }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'structural', 'insulation', 'thermal_mass', 'glazing', 'finish']

  const filtered = materials.filter(mat => {
    const matchesCat = selectedCategory === 'all' || mat.category === selectedCategory
    const matchesSearch = mat.name.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="panel p-6 flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
            Verified Physical Property Database ({materials.length} Materials)
          </span>
          <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-800" /> Building Materials Engineering Catalog
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all interactive-btn ${
                  selectedCategory === cat
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/80'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search 40+ materials…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
              <th className="py-3 px-3">Material Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Conductivity (k)</th>
              <th className="py-3 px-3">Density (ρ)</th>
              <th className="py-3 px-3">Specific Heat (Cp)</th>
              <th className="py-3 px-3">Absorptivity</th>
              <th className="py-3 px-3">Citation Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((mat, idx) => {
              const k   = mat.thermal_conductivity?.value ?? mat.thermal_conductivity ?? 0
              const rho = mat.density?.value ?? mat.density ?? 0
              const cp  = mat.specific_heat?.value ?? mat.specific_heat ?? 0
              const categoryColor = {
                structural: 'bg-amber-50 text-amber-800 border-amber-200',
                insulation: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                thermal_mass: 'bg-purple-50 text-purple-800 border-purple-200',
                glazing: 'bg-blue-50 text-blue-800 border-blue-200',
                finish: 'bg-gray-100 text-gray-800 border-gray-200',
              }[mat.category] || 'bg-gray-50 text-gray-700 border-gray-200'

              return (
                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-gray-900">{mat.name}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${categoryColor}`}>
                      {mat.category ? mat.category.replace('_', ' ') : 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-gray-900">{k.toFixed(3)} W/m·K</td>
                  <td className="py-3 px-3 font-mono text-gray-700">{rho.toFixed(0)} kg/m³</td>
                  <td className="py-3 px-3 font-mono text-gray-700">{cp.toFixed(0)} J/kg·K</td>
                  <td className="py-3 px-3 font-mono text-gray-600">{mat.solar_absorptivity ?? 'N/A'}</td>
                  <td className="py-3 px-3">
                    <a
                      href={mat.source?.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-black font-medium transition-colors"
                    >
                      {mat.source?.name || mat.source} <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
