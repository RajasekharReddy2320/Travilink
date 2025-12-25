import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Earth = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0025;
    }
  });

  // Create Earth texture with continents
  const createEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ocean base - deep blue gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGradient.addColorStop(0, '#1a4b7c');
    oceanGradient.addColorStop(0.3, '#0d3a6e');
    oceanGradient.addColorStop(0.5, '#0a2d5c');
    oceanGradient.addColorStop(0.7, '#0d3a6e');
    oceanGradient.addColorStop(1, '#1a4b7c');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 1024, 512);

    // Draw continents with realistic shapes
    ctx.fillStyle = '#2d5a3d';
    
    // North America
    ctx.beginPath();
    ctx.moveTo(100, 120);
    ctx.bezierCurveTo(120, 100, 180, 80, 220, 100);
    ctx.bezierCurveTo(260, 120, 280, 140, 290, 180);
    ctx.bezierCurveTo(300, 220, 280, 260, 250, 280);
    ctx.bezierCurveTo(220, 300, 180, 290, 150, 260);
    ctx.bezierCurveTo(120, 230, 100, 200, 90, 160);
    ctx.bezierCurveTo(80, 130, 90, 130, 100, 120);
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.moveTo(240, 290);
    ctx.bezierCurveTo(260, 280, 290, 300, 300, 340);
    ctx.bezierCurveTo(310, 380, 300, 420, 280, 450);
    ctx.bezierCurveTo(260, 480, 240, 470, 230, 440);
    ctx.bezierCurveTo(220, 410, 220, 370, 230, 330);
    ctx.bezierCurveTo(235, 310, 235, 295, 240, 290);
    ctx.fill();

    // Europe
    ctx.beginPath();
    ctx.moveTo(460, 100);
    ctx.bezierCurveTo(500, 90, 540, 100, 560, 120);
    ctx.bezierCurveTo(580, 140, 590, 170, 570, 200);
    ctx.bezierCurveTo(550, 220, 510, 210, 480, 190);
    ctx.bezierCurveTo(450, 170, 440, 140, 450, 110);
    ctx.bezierCurveTo(455, 100, 458, 100, 460, 100);
    ctx.fill();

    // Africa
    ctx.beginPath();
    ctx.moveTo(480, 220);
    ctx.bezierCurveTo(520, 210, 560, 230, 580, 280);
    ctx.bezierCurveTo(600, 330, 590, 390, 560, 430);
    ctx.bezierCurveTo(530, 470, 490, 460, 470, 420);
    ctx.bezierCurveTo(450, 380, 450, 330, 460, 280);
    ctx.bezierCurveTo(465, 250, 470, 225, 480, 220);
    ctx.fill();

    // Asia
    ctx.beginPath();
    ctx.moveTo(600, 100);
    ctx.bezierCurveTo(680, 80, 780, 90, 850, 120);
    ctx.bezierCurveTo(920, 150, 950, 200, 930, 250);
    ctx.bezierCurveTo(910, 300, 850, 320, 780, 310);
    ctx.bezierCurveTo(710, 300, 660, 270, 630, 220);
    ctx.bezierCurveTo(600, 170, 580, 130, 600, 100);
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.moveTo(800, 340);
    ctx.bezierCurveTo(850, 330, 900, 350, 920, 390);
    ctx.bezierCurveTo(940, 430, 920, 470, 880, 480);
    ctx.bezierCurveTo(840, 490, 790, 470, 770, 430);
    ctx.bezierCurveTo(750, 390, 760, 350, 800, 340);
    ctx.fill();

    // Add some green variation
    ctx.fillStyle = '#3d7a4d';
    ctx.globalAlpha = 0.5;
    
    // Forests/jungles
    ctx.beginPath();
    ctx.ellipse(500, 320, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(260, 350, 20, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(820, 180, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Add ice caps
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(512, 30, 400, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(512, 485, 300, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  };

  // Create cloud texture
  const createCloudTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 1024, 512);

    // Draw scattered clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radiusX = 20 + Math.random() * 60;
      const radiusY = 10 + Math.random() * 30;
      ctx.beginPath();
      ctx.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  };

  const earthTexture = createEarthTexture();
  const cloudTexture = createCloudTexture();

  return (
    <group>
      {/* Atmosphere glow */}
      <Sphere ref={atmosphereRef} args={[2.15, 64, 64]}>
        <meshBasicMaterial
          color="#4da6ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Earth */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>

      {/* Clouds layer */}
      <Sphere ref={cloudsRef} args={[2.02, 64, 64]}>
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
};

const RealisticGlobe = () => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} color="#fff9e6" />
        <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#4da6ff" />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <Earth />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};

export default RealisticGlobe;
