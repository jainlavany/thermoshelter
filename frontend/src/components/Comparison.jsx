import React from 'react'
import { Check } from 'lucide-react'

export default function Comparison({ candidates }) {
  if (!candidates || candidates.length === 0) return null

  return (
    <div className="panel p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <span className="w-2 h-2 bg-gray-900 rounded-full inline-block" />
        Multi-Design Space Exploration
      </h3>
      <p className="text-xs text-gray-400 mb-5">All evaluated design configurations ranked by composite performance score.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-widest">
              <th className="py-3 px-3 font-medium">Configuration</th>
              <th className="py-3 px-3 font-medium text-center">Comfort Hours</th>
              <th className="py-3 px-3 font-medium text-center">Solar Gain (kWh)</th>
              <th className="py-3 px-3 font-medium text-center">Heat Loss (kWh)</th>
              <th className="py-3 px-3 font-medium text-center">Score</th>
              <th className="py-3 px-3 font-medium text-center">Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {candidates.map((cand, idx) => {
              const isBest = idx === 0
              return (
                <tr key={idx} className={`transition-colors ${isBest ? 'bg-gray-50 border-l-2 border-l-gray-900' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-3 font-medium text-gray-900">{cand.description}</td>
                  <td className="py-3 px-3 text-center font-mono">{(cand.comfort_pct * 24).toFixed(1)} hrs</td>
                  <td className="py-3 px-3 text-center font-mono">{cand.heat_loss_kwh.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center font-mono">{cand.solar_gain_kwh.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center font-bold">{cand.score.toFixed(1)}</td>
                  <td className="py-3 px-3 text-center">
                    {isBest ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-900 bg-gray-200 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                        <Check className="w-3 h-3" /> Best
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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
