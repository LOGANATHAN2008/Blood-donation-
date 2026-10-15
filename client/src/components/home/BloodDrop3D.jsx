import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree, Canvas } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// Procedurally modeled liquid teardrop
function useDropGeometry() {
  return useMemo(() => {
    const points = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 (bottom) to 1 (top tip)
      // Teardrop profile equation
      const radius = Math.sin(Math.PI * t) * Math.pow(1 - t, 0.42) * 1.55;
      const height = (t - 0.45) * 3.6;
      points.push(new THREE.Vector2(Math.max(0.001, radius), height));
    }
    const geo = new THREE.LatheGeometry(points, 64);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

// Biconcave Red Blood Cell (Erythrocyte) Geometry
function useCellGeometry() {
  return useMemo(() => {
    const points = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 to 1
      const rad = t * 0.45;
      // Biconcave indentation formula
      const thickness = 0.22 * (0.8 + 1.2 * t * t - 1.1 * t * t * t * t);
      points.push(new THREE.Vector2(rad, thickness));
    }
    const geo = new THREE.LatheGeometry(points, 32);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

// Micro floating blood cells
function FloatingCells({ cellGeo }) {
  const groupRef = useRef();
  
  const cells = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      pos: [
        (Math.sin(i * 1.3) * 2.2) + (i % 2 === 0 ? 0.3 : -0.3),
        (Math.cos(i * 0.9) * 2.0) - 0.2,
        (Math.sin(i * 2.1) * 1.2) - 0.5,
      ],
      rotSpeed: [(Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 0.8],
      scale: 0.55 + Math.random() * 0.35,
      phase: i * 0.8,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const data = cells[i];
      if (!data) return;
      child.rotation.x += data.rotSpeed[0] * 0.015;
      child.rotation.y += data.rotSpeed[1] * 0.015;
      child.position.y = data.pos[1] + Math.sin(t * 1.5 + data.phase) * 0.18;
    });
  });

  return (
    <group ref={groupRef}>
      {cells.map((c, i) => (
        <mesh key={i} position={c.pos} geometry={cellGeo} scale={c.scale}>
          <meshPhysicalMaterial 
            color="#E11D48"
            emissive="#9F1239"
            emissiveIntensity={0.5}
            roughness={0.15}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function BloodDropScene({ activeGroup, onClick }) {
  const outerDropRef = useRef();
  const innerCoreRef = useRef();
  const { pointer } = useThree();
  const [pulseClick, setPulseClick] = useState(0);

  const dropGeo = useDropGeometry();
  const cellGeo = useCellGeometry();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setPulseClick(Date.now());
    onClick?.();
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (!outerDropRef.current) return;

    // Organic floating + mouse tracking
    const targetRotX = pointer.y * 0.35;
    const targetRotY = pointer.x * 0.45 + Math.sin(t * 0.6) * 0.2;

    outerDropRef.current.rotation.x = THREE.MathUtils.damp(outerDropRef.current.rotation.x, targetRotX, 4, delta);
    outerDropRef.current.rotation.y = THREE.MathUtils.damp(outerDropRef.current.rotation.y, targetRotY, 4, delta);

    // Heartbeat pulsation effect
    const heartBeat = Math.pow(Math.max(0, Math.sin(t * 3.5)), 16) * 0.07;

    // Click elastic squeeze
    let clickEffect = 0;
    if (pulseClick > 0) {
      const elapsed = (Date.now() - pulseClick) / 1000;
      if (elapsed < 0.6) {
        clickEffect = Math.sin(elapsed * Math.PI * 4) * Math.exp(-elapsed * 6) * 0.25;
      }
    }

    const currentScale = 1 + heartBeat + clickEffect;
    outerDropRef.current.scale.set(currentScale * 1.05, currentScale * 0.98, currentScale * 1.05);

    // Inner glowing core gentle breathing
    if (innerCoreRef.current) {
      const coreScale = 0.82 + Math.sin(t * 2.5) * 0.04 + heartBeat * 0.8;
      innerCoreRef.current.scale.set(coreScale, coreScale, coreScale);
      innerCoreRef.current.rotation.y -= delta * 0.4;
    }
  });

  return (
    <>
      {/* Dynamic Lighting for Translucent Ruby Shimmer */}
      <ambientLight intensity={1.2} color="#FFF1F2" />
      <directionalLight position={[4, 8, 6]} intensity={3.0} color="#FFFFFF" />
      <pointLight position={[-4, -2, 3]} intensity={4.5} color="#FF0055" />
      <pointLight position={[3, -4, -3]} intensity={3.5} color="#E11D48" />
      <pointLight position={[0, 5, -4]} intensity={2.5} color="#FF4D6D" />

      {/* Main Interactive Floating Drop */}
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <group onPointerDown={handlePointerDown} className="cursor-pointer">
          
          {/* Outer Glossy Ruby Blood Shell */}
          <mesh ref={outerDropRef} geometry={dropGeo}>
            <meshPhysicalMaterial 
              color="#E11D48"
              emissive="#880825"
              emissiveIntensity={0.35}
              roughness={0.06}
              metalness={0.12}
              transmission={0.5}
              ior={1.42}
              thickness={1.8}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              reflectivity={0.9}
            />

            {/* Glowing Interactive Blood Group Pill */}
            <Html position={[0, -0.15, 1.35]} center className="pointer-events-none select-none">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 dark:bg-gray-900/95 shadow-2xl border-2 border-brand-500/80 backdrop-blur-md transform transition-all duration-300 hover:scale-110">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse shadow-sm shadow-brand-500" />
                <span className="text-brand-600 dark:text-brand-400 font-black text-base sm:text-lg tracking-wider">
                  {activeGroup}
                </span>
              </div>
            </Html>
          </mesh>

          {/* Inner Glowing Core (Radiant Heartbeat) */}
          <mesh ref={innerCoreRef} geometry={dropGeo} scale={0.82}>
            <meshStandardMaterial 
              color="#FF0040"
              emissive="#FF1744"
              emissiveIntensity={1.2}
              roughness={0.25}
            />
          </mesh>

        </group>
      </Float>

      {/* Floating Micro Red Blood Cells */}
      <FloatingCells cellGeo={cellGeo} />
    </>
  );
}

export default function BloodDrop3D({ inView = true, ...props }) {
  return (
    <Canvas 
      frameloop={inView ? 'always' : 'demand'}
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      className="w-full h-full"
      style={{ pointerEvents: 'auto' }}
    >
      <BloodDropScene {...props} />
    </Canvas>
  );
}
