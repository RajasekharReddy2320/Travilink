import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { Earth } from "@/components/globe/Earth";

const RealisticGlobe = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[6, 3, 6]} intensity={1.35} color="#fff4d6" />
        <directionalLight position={[-6, -3, -6]} intensity={0.55} color="#7fd8ff" />
        <pointLight position={[10, 10, 10]} intensity={0.45} />

        <Earth />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.35}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};

export default RealisticGlobe;

