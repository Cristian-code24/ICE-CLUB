"use client";

import { ContactShadows, Environment, Float, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Box3, Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type SceneProps = {
  flavorName: string;
  flavorColor: string;
  active: boolean;
  lowPower: boolean;
  showControls: boolean;
  viewAngle?: string;
  onReady: () => void;
};

function ProductPair({
  flavorName,
  flavorColor,
  lowPower,
  viewAngle,
  onReady,
}: Pick<SceneProps, "flavorName" | "flavorColor" | "lowPower" | "viewAngle" | "onReady">) {
  const { scene } = useGLTF("/models/ice-club.glb");
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const flavorStart = useRef(0);
  const currentFlavor = useRef(flavorName);
  const objects = useMemo(() => {
    const root = scene.clone(true);
    const copies = [root, root.clone(true)];
    copies.forEach((copy) => {
      copy.traverse((node) => {
        if (node instanceof Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = Array.isArray(node.material)
            ? node.material.map((material) => material.clone())
            : node.material.clone();
        }
      });
    });
    return copies;
  }, [scene]);

  const paintMaterials = useMemo(
    () =>
      objects.map((copy) => {
        const materials: MeshStandardMaterial[] = [];
        copy.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          (Array.isArray(node.material) ? node.material : [node.material]).forEach(
            (material) => {
              if (material instanceof MeshStandardMaterial && !material.map) {
                materials.push(material);
              }
            },
          );
        });
        return materials;
      }),
    [objects],
  );

  useEffect(() => {
    paintMaterials.forEach((materials, index) => {
      const tint = index === 0 ? flavorColor : "#e2faff";
      materials.forEach((material) => {
          material.userData.iceTargetColor = new Color(tint);
          if (lowPower) {
            material.roughness = 0.25;
          } else {
            const physical = material as MeshPhysicalMaterial;
            physical.roughness = 0.15;
            physical.transmission = 0.6;
            physical.thickness = 0.7;
            physical.ior = 1.3;
            physical.clearcoat = 1;
            physical.clearcoatRoughness = 0.08;
          }
      });
    });
    onReady();
  }, [flavorColor, lowPower, onReady, paintMaterials]);

  useEffect(() => {
    if (currentFlavor.current !== flavorName) {
      currentFlavor.current = flavorName;
      flavorStart.current = 0;
    }
  }, [flavorName]);

  useEffect(
    () => () => {
      objects.forEach((copy) =>
        copy.traverse((node) => {
          if (!(node instanceof Mesh)) return;
          (Array.isArray(node.material) ? node.material : [node.material]).forEach(
            (material) => material.dispose(),
          );
        }),
      );
    },
    [objects],
  );

  useEffect(() => {
    if (!group.current || !viewAngle) return;
    group.current.rotation.y =
      viewAngle === "Espalda" ? Math.PI : viewAngle === "Detalle" ? 0.72 : 0;
  }, [viewAngle]);

  useFrame((state, delta) => {
    if (!group.current) return;
    flavorStart.current = Math.min(0.7, flavorStart.current + delta);
    paintMaterials.forEach((materials) =>
      materials.forEach((material) => {
        const target = material.userData.iceTargetColor as Color | undefined;
        if (target) {
          const amount = 1 - Math.exp(-delta / 0.58);
          material.color.lerp(target, amount);
        }
      }),
    );
    const targetX = state.pointer.y * 0.11;
    const targetY = (viewAngle === "Espalda" ? Math.PI : viewAngle === "Detalle" ? 0.72 : 0) + state.pointer.x * 0.16;
    group.current.rotation.x += (targetX - group.current.rotation.x) * delta * 2;
    group.current.rotation.y += (targetY - group.current.rotation.y) * delta * 2;
    const transition = Math.min(1, flavorStart.current / 0.7);
    const jump = Math.sin(transition * Math.PI) * 0.06;
    const targetScale = (hovered ? 1.08 : 1) + jump;
    const scale = group.current.scale.x + (targetScale - group.current.scale.x) * delta * 5;
    group.current.scale.setScalar(scale);
  });

  const bounds = useMemo(() => {
    const box = new Vector3();
    const first = objects[0];
    first.updateMatrixWorld(true);
    const boundsBox = new Box3().setFromObject(first);
    boundsBox.getSize(box);
    const maxAxis = Math.max(box.x, box.y, box.z) || 1;
    return { center: boundsBox.getCenter(new Vector3()), scale: 2.45 / maxAxis };
  }, [objects]);

  return (
    <group scale={bounds.scale} position={[0, -0.15, 0]}>
      <group ref={group}>
        <group position={[-0.58 / bounds.scale, 0, 0]} rotation={[0.08, -0.32, -0.12]}>
          <primitive
            object={objects[0]}
            position={[-bounds.center.x, -bounds.center.y, -bounds.center.z]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          />
        </group>
        <group position={[0.58 / bounds.scale, 0, 0]} rotation={[-0.08, 0.42, 0.12]}>
          <primitive
            object={objects[1]}
            position={[-bounds.center.x, -bounds.center.y, -bounds.center.z]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          />
        </group>
      </group>
      <Html position={[0, -1.7 / bounds.scale, 0]} center>
        <span className="model-flavor-label">{flavorName}</span>
      </Html>
    </group>
  );
}

export default function IceScene(props: SceneProps) {
  const [autoRotate, setAutoRotate] = useState(!props.showControls);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAutoRotate(!props.showControls);
  }, [props.showControls]);

  const stopAutoRotate = () => {
    setAutoRotate(false);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const resumeAutoRotate = () => {
    if (props.showControls) return;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setAutoRotate(true), 2000);
  };

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  return (
    <Canvas
      dpr={props.lowPower ? [1, 1.5] : [1, 2]}
      frameloop={props.active ? "always" : "demand"}
      gl={{ alpha: true, antialias: !props.lowPower, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 5], fov: 36 }}
      shadows={!props.lowPower}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[-3, 5, 3]} color="#67e8f9" intensity={2.2} />
      <directionalLight position={[3, 2, -3]} color="#3985ff" intensity={2.6} />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <Float speed={1.3} rotationIntensity={0.08} floatIntensity={0.28}>
          <ProductPair {...props} />
        </Float>
        {!props.lowPower && (
          <ContactShadows
            position={[0, -1.45, 0]}
            opacity={0.35}
            scale={5}
            blur={2.5}
            far={3}
          />
        )}
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(Math.PI * 2) / 3}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.08}
        onStart={stopAutoRotate}
        onEnd={resumeAutoRotate}
      />
    </Canvas>
  );
}
