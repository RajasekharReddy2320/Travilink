import { useMemo, useRef } from "react";
import { Sphere, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import earthDay from "@/assets/earth/earth_day.jpg";
import earthNormal from "@/assets/earth/earth_normal.jpg";
import earthSpecular from "@/assets/earth/earth_specular.jpg";
import earthClouds from "@/assets/earth/earth_clouds.png";

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specMap, cloudsMap] = useTexture([
    earthDay,
    earthNormal,
    earthSpecular,
    earthClouds,
  ]);

  useMemo(() => {
    [dayMap, normalMap, specMap, cloudsMap].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
    });
  }, [dayMap, normalMap, specMap, cloudsMap]);

  useFrame((_, delta) => {
    // slow rotation (feels like "every second slowly")
    const step = delta * 0.18;
    if (earthRef.current) earthRef.current.rotation.y += step;
    if (cloudsRef.current) cloudsRef.current.rotation.y += step * 1.25;
  });

  return (
    <group>
      {/* Atmosphere glow */}
      <Sphere args={[2.15, 96, 96]}>
        <meshBasicMaterial
          color={new THREE.Color("#6fd2ff")}
          transparent
          opacity={0.14}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Earth */}
      <Sphere ref={earthRef} args={[2, 96, 96]}>
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specMap}
          specular={new THREE.Color("#9fd7ff")}
          shininess={12}
        />
      </Sphere>

      {/* Clouds */}
      <Sphere ref={cloudsRef} args={[2.03, 96, 96]}>
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
}
