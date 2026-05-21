import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles, Environment, MeshTransmissionMaterial } from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import { Mesh, Vector3 } from 'three'
import { damp3 } from 'maath/easing'

function FloatingProduct() {
  const bottleRef = useRef<Mesh | null>(null)
  const orbRef = useRef<Mesh | null>(null)
  const cursorTarget = useMemo(() => new Vector3(0, 0, 0), [])

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime()
    if (bottleRef.current) {
      bottleRef.current.rotation.y = Math.sin(t * 0.35) * 0.35
      bottleRef.current.rotation.x = Math.cos(t * 0.18) * 0.08
      cursorTarget.set(mouse.x * 0.75, mouse.y * 0.35, 0)
      damp3(bottleRef.current.position, cursorTarget.toArray() as [number, number, number], 0.12, 0.08)
    }

    if (orbRef.current) {
      orbRef.current.position.x = mouse.x * 2.2
      orbRef.current.position.y = mouse.y * 1.2
      orbRef.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08)
    }
  })

  return (
    <>
      <Float speed={1.25} rotationIntensity={0.35} floatIntensity={0.7}>
        <group ref={bottleRef} position={[0, 0.15, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.62, 0.62, 1.7, 64]} />
            <MeshTransmissionMaterial
              thickness={0.65}
              roughness={0.12}
              transmission={1}
              ior={1.35}
              chromaticAberration={0.03}
              backside
              color="#fff7f5"
            />
          </mesh>

          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.58, 0.34, 64]} />
            <meshStandardMaterial color="#f7d7db" metalness={0.9} roughness={0.18} />
          </mesh>

          <mesh position={[0, 0, 0.35]}>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial color="#fff" emissive="#ffd6de" emissiveIntensity={2} />
          </mesh>
        </group>
      </Float>

      <mesh ref={orbRef} position={[0, 0, -0.9]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color="#ffd8e2" emissive="#ff8fab" emissiveIntensity={1.2} transparent opacity={0.38} />
      </mesh>

      <Sparkles count={90} scale={[8, 5, 5]} speed={0.3} size={2} color="#fff0f3" />
      <Environment preset="sunset" />
    </>
  )
}

export default function SceneCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 35 }} shadows dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 7]} intensity={2} castShadow color="#ffe7eb" />
      <pointLight position={[-3, 1, 3]} intensity={18} color="#f5d0dc" />
      <pointLight position={[2, -1, 4]} intensity={10} color="#fff8f6" />
      <Suspense>
        <FloatingProduct />
      </Suspense>
    </Canvas>
  )
}
