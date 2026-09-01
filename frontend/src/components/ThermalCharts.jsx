import React, { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-basic-dist'

const FONT = "'Roboto', sans-serif"
const GRID = 'rgba(0,0,0,0.06)'
const TEXT = '#555555'

export function TempPlot({ indoor, outdoor, timestamps }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current || !indoor || !outdoor || !timestamps) return

    const trace1 = {
      x: timestamps, y: indoor,
      name: 'Indoor Temp',
      type: 'scatter', mode: 'lines+markers',
      line: { color: '#111111', width: 2.5 },
      marker: { size: 5, color: '#111111' }
    }

    const trace2 = {
      x: timestamps, y: outdoor,
      name: 'Outdoor Temp',
      type: 'scatter', mode: 'lines',
      line: { color: '#999999', width: 2, dash: 'dash' }
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: TEXT, family: FONT, size: 11 },
      margin: { t: 30, r: 20, b: 40, l: 44 },
      xaxis: { gridcolor: GRID, tickfont: { size: 10 }, linecolor: GRID },
      yaxis: { gridcolor: GRID, title: 'Temperature (°C)', tickfont: { size: 10 }, linecolor: GRID },
      legend: { orientation: 'h', y: 1.15, x: 0.1, font: { size: 11 } },
      hovermode: 'x unified'
    }

    Plotly.newPlot(containerRef.current, [trace1, trace2], layout, { displayModeBar: false })

    const handleResize = () => { if (containerRef.current) Plotly.Plots.resize(containerRef.current) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [indoor, outdoor, timestamps])

  return <div ref={containerRef} className="w-full h-[280px]" />
}

export function HeatLossPlot({ breakdown }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current || !breakdown) return

    const keys = Object.keys(breakdown)
    const labels = keys.map(k => k.toUpperCase())
    const values = Object.values(breakdown)

    const colorMap = {
      WALLS: '#EF4444',
      ROOF: '#F97316',
      FLOOR: '#8B5CF6',
      WINDOWS: '#3B82F6',
      VENTILATION: '#10B981'
    }

    const colors = labels.map((lbl, idx) => colorMap[lbl] || ['#EF4444', '#F97316', '#8B5CF6', '#3B82F6', '#10B981'][idx % 5])

    const data = [{
      values, labels,
      type: 'pie', hole: 0.6,
      marker: { colors },
      textinfo: 'percent',
      textposition: 'inside',
      hoverinfo: 'label+value+percent',
      textfont: { color: '#ffffff', size: 10, family: FONT, weight: 'bold' }
    }]

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: TEXT, family: FONT, size: 11 },
      margin: { t: 20, r: 10, b: 20, l: 10 },
      showlegend: true,
      legend: { orientation: 'v', x: 1.0, y: 0.5, font: { size: 10 } },
      annotations: [{
        font: { size: 11, color: '#111111', family: FONT, weight: 800 },
        showarrow: false,
        text: 'HEAT<br>LOSS',
        x: 0.5, y: 0.5
      }]
    }

    Plotly.newPlot(containerRef.current, data, layout, { displayModeBar: false })

    const handleResize = () => { if (containerRef.current) Plotly.Plots.resize(containerRef.current) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakdown])

  return <div ref={containerRef} className="w-full h-[250px]" />
}
