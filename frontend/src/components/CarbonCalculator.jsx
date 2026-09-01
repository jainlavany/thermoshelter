import React from 'react'
import { Leaf, IndianRupee, ShieldCheck, Flame, TrendingUp } from 'lucide-react'

export default function CarbonCalculator({ carbonOffset = {} }) {
  const fuelSaved = carbonOffset.annual_fuel_saved_L || 420.5
  const co2Saved = carbonOffset.annual_co2_saved_kg || 1126.9
  const inrSaved = carbonOffset.annual_financial_saved_inr || 39948

  const tenYearCo2 = (co2Saved * 10 / 1000).toFixed(1)
  const tenYearInr = (inrSaved * 10).toLocaleString('en-IN')

  return (
    <div className="panel p-6 flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-start border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">
            Fossil Fuel Replacement & Carbon Analytics
          </span>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" /> Environmental & Economic Impact Calculator
          </h2>
        </div>
        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
          Passive Heating Offset
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel-raised p-4 flex flex-col gap-2 interactive-card border border-emerald-100 bg-emerald-50/30">
          <div className="flex justify-between items-center text-emerald-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Annual Fuel Replaced</span>
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-gray-900">{fuelSaved} <span className="text-xs font-bold text-gray-500">Liters / yr</span></span>
          <span className="text-[11px] text-gray-600 font-medium">Replaces traditional high-altitude kerosene heaters.</span>
        </div>

        <div className="panel-raised p-4 flex flex-col gap-2 interactive-card border border-blue-100 bg-blue-50/30">
          <div className="flex justify-between items-center text-blue-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">CO₂ Emission Avoided</span>
            <Leaf className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-gray-900">{co2Saved} <span className="text-xs font-bold text-gray-500">kg / yr</span></span>
          <span className="text-[11px] text-gray-600 font-medium">Direct carbon footprint mitigation in Ladakh ecosystem.</span>
        </div>

        <div className="panel-raised p-4 flex flex-col gap-2 interactive-card border border-amber-100 bg-amber-50/30">
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Financial Fuel Savings</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-gray-900">₹{inrSaved.toLocaleString('en-IN')} <span className="text-xs font-bold text-gray-500">/ yr</span></span>
          <span className="text-[11px] text-gray-600 font-medium">Based on ₹95/L subsidized high-altitude fuel cost.</span>
        </div>
      </div>

      <div className="panel-raised p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">10-Year Cumulative Offset Projection</span>
            <span className="text-sm font-black text-white">
              Avoids {tenYearCo2} Tonnes of CO₂ & saves ₹{tenYearInr} in heating costs
            </span>
          </div>
        </div>
        <div className="text-xs font-bold bg-white text-gray-900 px-4 py-2 rounded-xl shadow-sm">
          Payback Horizon: ~2.4 Years
        </div>
      </div>
    </div>
  )
}
