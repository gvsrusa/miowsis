'use client'

import { useRef, useState, useMemo } from 'react'

import { OrbitControls, Text, Html, PerspectiveCamera, Line } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Info, Maximize2, Eye, EyeOff } from 'lucide-react'


import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type * as THREE from 'three'

interface AssetNode {
  id: string
  symbol: string
  name: string
  value: number
  percentage: number
  esgScore: number
  color: string
  position: [number, number, number]
  scale: number
}

interface Portfolio3DVisualizationProps {
  holdings: Array<{
    asset_id: string
    symbol: string
    name: string
    quantity: number
    current_value: number
    esg_score?: number
  }>
  totalValue: number
}

function AssetSphere({ 
  node, 
  isHovered, 
  onHover 
}: { 
  node: AssetNode
  isHovered: boolean
  onHover: (id: string | null) => void 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [spring, setSpring] = useState(1)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    // Floating animation
    meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.id.charCodeAt(0)) * 0.1
    
    // Scale animation on hover
    const targetScale = isHovered ? node.scale * 1.2 : node.scale
    meshRef.current.scale.setScalar(targetScale * spring)
    
    // Rotate on hover
    if (isHovered) {
      meshRef.current.rotation.y += 0.02
    }
  })
  
  return (
    <group position={node.position}>
      <mesh 
        ref={meshRef}
        onPointerOver={() => {
          onHover(node.id)
          setSpring(1.1)
        }}
        onPointerOut={() => {
          onHover(null)
          setSpring(1)
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={node.color} 
          emissive={node.color}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.symbol}
      </Text>
      
      {isHovered && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-black/80 text-white p-2 rounded-lg text-xs whitespace-nowrap">
            <div className="font-semibold">{node.name}</div>
            <div>Value: ${node.value.toLocaleString()}</div>
            <div>Weight: {node.percentage.toFixed(1)}%</div>
            <div>ESG Score: {node.esgScore}/100</div>
          </div>
        </Html>
      )}
    </group>
  )
}

function PortfolioScene({ nodes }: { nodes: AssetNode[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  useThree()
  
  // Create connections between nodes
  const connections = useMemo(() => {
    const lines: Array<[AssetNode, AssetNode]> = []
    // Connect nodes with similar ESG scores
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach(otherNode => {
        if (Math.abs(node.esgScore - otherNode.esgScore) < 10) {
          lines.push([node, otherNode])
        }
      })
    })
    return lines
  }, [nodes])
  
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Asset spheres */}
      {nodes.map(node => (
        <AssetSphere
          key={node.id}
          node={node}
          isHovered={hoveredId === node.id}
          onHover={setHoveredId}
        />
      ))}
      
      {/* Connections */}
      {connections.map(([nodeA, nodeB], index) => {
        const isVisible = !hoveredId || hoveredId === nodeA.id || hoveredId === nodeB.id
        if (!isVisible) return null
        
        const points = [nodeA.position, nodeB.position]
        
        return (
          <Line
            key={index}
            points={points}
            color="#4a5568"
            lineWidth={1}
            opacity={hoveredId && (hoveredId === nodeA.id || hoveredId === nodeB.id) ? 0.8 : 0.2}
            transparent
          />
        )
      })}
      
      {/* Portfolio center indicator */}
      <mesh position={[0, 0, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color="#10b981" 
          emissive="#10b981"
          emissiveIntensity={0.5}
          metalness={1}
          roughness={0}
        />
      </mesh>
      
      <OrbitControls 
        enablePan
        enableZoom
        enableRotate
        autoRotate={!hoveredId}
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export function Portfolio3DVisualization({ holdings, totalValue }: Portfolio3DVisualizationProps) {
  const [showLabels, setShowLabels] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Generate node positions in a sphere layout
  const nodes = useMemo<AssetNode[]>(() => {
    return holdings.map((holding, index) => {
      const percentage = (holding.current_value / totalValue) * 100
      const phi = Math.acos(1 - 2 * (index + 0.5) / holdings.length)
      const theta = Math.PI * (1 + Math.sqrt(5)) * index
      
      const radius = 5 + (percentage / 10) // Larger holdings are further out
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      
      // Color based on ESG score
      const esgScore = holding.esg_score || 50
      const hue = (esgScore / 100) * 120 // 0 = red, 120 = green
      const color = `hsl(${hue}, 70%, 50%)`
      
      return {
        id: holding.asset_id,
        symbol: holding.symbol,
        name: holding.name,
        value: holding.current_value,
        percentage,
        esgScore,
        color,
        position: [x, y, z],
        scale: 0.5 + (percentage / 20), // Scale based on value
      }
    })
  }, [holdings, totalValue])
  
  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Portfolio 3D Visualization</CardTitle>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[600px]'}>
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 20]} />
            <PortfolioScene nodes={nodes} />
          </Canvas>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Low ESG</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium ESG</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>High ESG</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>Sphere size indicates holding value</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}