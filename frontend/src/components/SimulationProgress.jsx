import React from 'react'
import { Loader2, CheckCircle, Circle } from 'lucide-react'

export default function SimulationProgress({ steps }) {
  return (
    <div className="flex flex-col gap-3 text-xs">
      {steps.map((step, idx) => (
        <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
          step.status === 'active' ? 'border-gray-400 bg-gray-50' :
          step.status === 'done'   ? 'border-gray-200 bg-white' :
                                     'border-gray-100 bg-white'
        }`}>
          {step.status === 'done'   && <CheckCircle className="w-4 h-4 text-gray-700 shrink-0" />}
          {step.status === 'active' && <Loader2    className="w-4 h-4 text-gray-900 animate-spin shrink-0" />}
          {step.status === 'todo'   && <Circle      className="w-4 h-4 text-gray-300 shrink-0" />}

          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${
                step.status === 'active' ? 'text-gray-900' :
                step.status === 'done'   ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {step.label}
              </span>
              {step.status === 'done'   && <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide font-medium">Done</span>}
              {step.status === 'active' && <span className="text-[10px] text-gray-900 bg-gray-200 px-2 py-0.5 rounded uppercase tracking-wide font-semibold animate-pulse">Running</span>}
            </div>
            {step.desc && <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
