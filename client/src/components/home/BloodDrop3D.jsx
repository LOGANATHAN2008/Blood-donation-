import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree, Canvas } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Lightformer, Html, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

// Procedural drop geometry using LatheGeometry
const DropGeometry = () => {
  return useMemo(() => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64; // 0 to 1
      const x = Math.sin(Math.PI * t) * Math.pow(1 - t, 0.6) * 1.5;
      const y = (t - 0.5) * 4;
      points.push(new THREE.Vector2(x, y));
    }
    const geo = new THREE.LatheGeometry(points, 64);
    geo.scale(1, 1, 0.85); // Squash slightly on Z for a natural look
    geo.translate(0, 0.2, 0); // Lift up to center it better
    geo.computeVertexNormals();
    return geo;
  }, []);
};

function BloodCells() {
  const meshRefs = useRef([]);
  const count = 5;
  
  const positions = useMemo(() => {
    return Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      -3 - Math.random() * 3
    ]);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y += Math.sin(t * 0.5 + i) * 0.005;
      mesh.rotation.x += delta * 0.2;
      mesh.rotation.y += delta * 0.3;
      mesh.position.x += Math.cos(t * 0.2 + i) * 0.005;
    });
  });

  return (
    <>
      {positions.map((pos, i) => (
        <mesh 
          key={i} 
          position={pos} 
          ref={el => meshRefs.current[i] = el}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
          scale={[1, 1, 0.5]}
        >
          <torusGeometry args={[0.3, 0.12, 16, 32]} />
          <meshStandardMaterial color="#B3122B" roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

function BloodDropScene({ activeGroup, onClick }) {
  const meshRef = useRef();
  const innerRef = useRef();
  const [dpr, setDpr] = useState(1.5);
  const { pointer } = useThree();
  const [hasEntered, setHasEntered] = useState(false);
  const [ripple, setRipple] = useState(0); // time of last click
  const rippleRef = useRef();

  const geometry = DropGeometry();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setRipple(state => state === 0 ? 0.01 : 0); // trigger reset
    setTimeout(() => setRipple(Date.now()), 10);
    onClick?.();
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    let bounceY = 0;
    let scaleY = 1;
    let scaleXZ = 1;

    // Entry animation (0 to 1.5 seconds)
    if (time < 1.5) {
      // Simple elastic drop
      const t = Math.min(time / 1.5, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      bounceY = (1 - ease) * 5; // Starts 5 units high
      
      // Squash and stretch
      if (t < 0.5) {
        scaleY = 1 + (1 - t*2) * 0.5; // Stretches as it falls
        scaleXZ = 1 - (1 - t*2) * 0.2;
      } else {
        const bounce = Math.sin((t - 0.5) * Math.PI * 4) * Math.exp(-(t - 0.5) * 5);
        scaleY = 1 - bounce * 0.3; // Squash on impact
        scaleXZ = 1 + bounce * 0.3;
      }
    } else if (!hasEntered) {
      setHasEntered(true);
    }

    // Ripple logic
    if (ripple > 0 && rippleRef.current) {
      const rTime = (Date.now() - ripple) / 1000;
      if (rTime < 1) {
        const rippleScale = 1 + rTime * 5;
        const rippleOpacity = 1 - rTime;
        rippleRef.current.scale.setScalar(rippleScale);
        rippleRef.current.material.opacity = rippleOpacity;
      }
    }
    
    // Heartbeat pulse every 1.2s (sync with ECG if possible)
    const pulse = Math.pow(Math.sin(time * Math.PI * 2 / 1.2), 32);
    const pulseScale = 1 + pulse * 0.04;
    
    meshRef.current.scale.set(scaleXZ * pulseScale, scaleY * pulseScale, scaleXZ * pulseScale);
    meshRef.current.position.y = bounceY;
    
    // Tilt toward pointer with smooth damping
    const targetRotationX = pointer.y * 0.5;
    const targetRotationY = pointer.x * 0.5;
    
    meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotationX, 4, delta);
    meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotationY, 4, delta);
    
    // Inner liquid slosh logic
    if (innerRef.current) {
      innerRef.current.rotation.x = THREE.MathUtils.damp(innerRef.current.rotation.x, targetRotationX * 1.2, 3, delta);
      innerRef.current.rotation.y = THREE.MathUtils.damp(innerRef.current.rotation.y, targetRotationY * 1.2, 3, delta);
      
      // Slight vertical breathing and subtle liquid sine wave
      innerRef.current.position.y = Math.sin(time * 2) * 0.1 - 0.2; 
    }
  });

  return (
    <>
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      
      <group onPointerDown={handlePointerDown} className="cursor-pointer">
        {/* Main Glass Drop */}
        <mesh ref={meshRef} geometry={geometry}>
          <MeshTransmissionMaterial 
            color="#A3122B"
            thickness={2.5}
            roughness={0.05}
            transmission={0.9}
            ior={1.3}
            chromaticAberration={0.03}
            clearcoat={1}
            resolution={dpr > 1 ? 512 : 256} // Lower res for perf on decline
            samples={dpr > 1 ? 6 : 4}
          />
          
          {/* Centered Html Text Pill */}
          <Html position={[0, 0, 1.2]} center className="pointer-events-none">
            <div className="bg-white/90 backdrop-blur dark:bg-brand-900/90 text-brand-700 dark:text-brand-300 px-4 py-1.5 rounded-full font-black shadow-lg text-lg border border-brand-100 dark:border-brand-800 transition-colors">
              {activeGroup}
            </div>
          </Html>
        </mesh>
        
        {/* Inner Dark Liquid */}
        <mesh ref={innerRef} geometry={geometry} scale={0.92}>
          <meshPhysicalMaterial 
            color="#3B0610"
            metalness={0.1}
            roughness={0.4}
            transmission={0}
          />
        </mesh>
      </group>

      {/* Studio Lighting using Lightformers */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 4, -0.3, 0]}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} />
          <Lightformer type="ring" intensity={2} rotation-y={Math.PI / 2} position={[-0.1, -1, -5]} scale={10} />
        </group>
      </Environment>
      
      {/* Soft volumetric glow behind the drop */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[15, 15]} />
        <meshBasicMaterial color="#7A0C1F" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Click Ripple */}
      {ripple > 0 && (
        <mesh position={[0, 0, -1]} ref={rippleRef}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial color="#ff4d64" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      <BloodCells />
    </>
  );
}

export default function BloodDrop3D({ inView = true, ...props }) {
  return (
    <Canvas 
      frameloop={inView ? 'always' : 'demand'}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      className="pointer-events-none"
      style={{ pointerEvents: 'auto' }} // Allow clicks on the canvas
    >
      <BloodDropScene {...props} />
    </Canvas>
  );
}
