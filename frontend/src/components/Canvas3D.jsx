import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { Compass, Box, SunMedium } from 'lucide-react'

function ShelterModel({ length, width, height, floors = 1, orientation, windowRatio }) {
  const rad = (orientation * Math.PI) / 180
  const winHeight = height * 0.45
  const winWidth  = (length * windowRatio) / 0.45
  const totalHeight = height * floors

  return (
    <group rotation={[0, -rad, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshBasicMaterial color="#f1f5f9" opacity={0.6} transparent />
      </mesh>

      {/* Ground Floor Box */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial color="#c08552" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Ground Floor Window */}
      {windowRatio > 0 && (
        <mesh position={[0, height / 2, width / 2 + 0.01]}>
          <planeGeometry args={[Math.min(length - 0.4, winWidth), Math.min(height - 0.4, winHeight)]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.6} transparent opacity={0.75} />
        </mesh>
      )}

      {/* 1st Floor Box & Inter-Floor Divider */}
      {floors === 2 && (
        <>
          <mesh position={[0, height, 0]}>
            <boxGeometry args={[length + 0.1, 0.08, width + 0.1]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} />
          </mesh>
          <mesh position={[0, height + height / 2, 0]}>
            <boxGeometry args={[length, height, width]} />
            <meshStandardMaterial color="#d97706" roughness={0.6} metalness={0.05} />
          </mesh>
          {windowRatio > 0 && (
            <mesh position={[0, height + height / 2, width / 2 + 0.01]}>
              <planeGeometry args={[Math.min(length - 0.4, winWidth), Math.min(height - 0.4, winHeight)]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.6} transparent opacity={0.75} />
            </mesh>
          )}
        </>
      )}

      {/* Roof Assembly */}
      <mesh position={[0, totalHeight + 0.08, 0]}>
        <boxGeometry args={[length + 0.3, 0.16, width + 0.3]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Foundation Base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[length + 0.4, 0.1, width + 0.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function Canvas3D({ length = 5, width = 4, height = 3, floors = 1, orientation = 0, windowRatio = 0.08 }) {
  const [selectedHour, setSelectedHour] = useState(12)

  const hourAngle = ((selectedHour - 12) * 15 * Math.PI) / 180
  const sunX = 12 * Math.sin(hourAngle)
  const sunY = Math.max(1, 10 * Math.cos(hourAngle))
  const sunZ = 12 * Math.cos(hourAngle)

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-2xs group flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest text-gray-900 flex items-center gap-2 shadow-sm">
          <Box className="w-3.5 h-3.5 text-gray-800" />
          3D TRANSIENT ENVELOPE
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-700 flex items-center gap-1.5 shadow-sm">
        <Compass className="w-3.5 h-3.5 text-gray-800" />
        <span>{orientation}° E of S</span>
      </div>

      <div className="absolute bottom-16 left-4 z-10 bg-white/90 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-gray-600 flex items-center gap-3 shadow-sm">
        <span className="flex items-center gap-1">
          <Box className="w-3.5 h-3.5 text-gray-800" />
          {length}m × {width}m × {(height * floors).toFixed(1)}m ({floors === 2 ? 'G + 1st Floor' : 'Ground Floor Only'})
        </span>
        <span className="text-gray-300">|</span>
        <span>Glazing: {(windowRatio * 100).toFixed(0)}%</span>
      </div>

      <div className="absolute bottom-3 left-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
        <SunMedium className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-black text-gray-900 w-16">{String(selectedHour).padStart(2, '0')}:00 HRS</span>
        <input
          type="range"
          min={0}
          max={23}
          value={selectedHour}
          onChange={e => setSelectedHour(parseInt(e.target.value))}
          className="flex-1 h-1.5 rounded-lg bg-gray-200 appearance-none cursor-pointer"
        />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {selectedHour >= 6 && selectedHour <= 18 ? 'Solar Exposure' : 'Nocturnal Loss'}
        </span>
      </div>

      <Canvas
        camera={{ position: [8, 8, 11], fov: 42 }}
        gl={{ alpha: true }}
        style={{ background: '#fafafa' }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[sunX, sunY, sunZ]} intensity={2.2} castShadow />
        <directionalLight position={[-8, 5, -8]} intensity={0.5} />

        <ShelterModel
          length={length}
          width={width}
          height={height}
          floors={floors}
          orientation={orientation}
          windowRatio={windowRatio}
        />

        <Grid
          renderOrder={-1}
          position={[0, 0, 0]}
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#cbd5e1"
          sectionSize={5}
          sectionThickness={1.0}
          sectionColor="#94a3b8"
          fadeDistance={30}
        />

        <OrbitControls
          enableDamping
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={16}
        />
      </Canvas>
    </div>
  )
}
