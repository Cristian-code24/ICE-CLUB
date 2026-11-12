"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useGLTF } from "@react-three/drei";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const IceScene = dynamic(() => import("./IceScene"), { ssr: false });

type Props = {
  flavorName: string;
  flavorColor: string;
  fallbackImage?: string;
  showControls?: boolean;
  viewAngle?: string;
  onModelReady?: () => void;
  onAvailabilityChange?: (available: boolean) => void;
};

type BoundaryProps = {
  children: React.ReactNode;
  onError: () => void;
};

class SceneErrorBoundary extends Component<
  BoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export default function IceModel3D({
  flavorName,
  flavorColor,
  fallbackImage = "/assets/ice-pop-pair.png",
  showControls = false,
  viewAngle,
  onModelReady,
  onAvailabilityChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const readyCallback = useRef(onModelReady);
  const availabilityCallback = useRef(onAvailabilityChange);
  const [available, setAvailable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    readyCallback.current = onModelReady;
    availabilityCallback.current = onAvailabilityChange;
  }, [onAvailabilityChange, onModelReady]);

  const handleReady = useCallback(() => {
    setLoaded(true);
    readyCallback.current?.();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const lowEnd =
      (navigator.hardwareConcurrency > 0 &&
        navigator.hardwareConcurrency <= 4) ||
      ("deviceMemory" in navigator &&
        Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) <= 4);
    setLowPower(lowEnd);
    if (reducedMotion || lowEnd || !supportsWebGL()) return;

    let active = true;
    fetch("/api/model")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Model availability request failed: ${response.status}`);
        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          !("available" in result) ||
          typeof result.available !== "boolean"
        ) {
          throw new Error("Model availability response has an invalid shape");
        }
        if (active && result.available) {
          useGLTF.preload("/models/ice-club.glb");
          setAvailable(true);
        }
        if (active) availabilityCallback.current?.(result.available);
      })
      .catch((error: unknown) => {
        console.error("No se pudo comprobar si el modelo 3D está disponible:", error);
        if (active) {
          setAvailable(false);
          availabilityCallback.current?.(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () =>
      setCanRender(document.visibilityState === "visible");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const showModel = available && (loaded || visible);

  return (
    <div
      ref={hostRef}
      className="model-stage"
      data-model-ready={loaded}
      role="group"
      aria-label={`Vista 3D de ${flavorName}`}
    >
      <Image
        className={`model-fallback ${loaded ? "model-fallback-hidden" : ""}`}
        src={fallbackImage}
        alt={`Marcianos artesanales de ${flavorName}`}
        fill
        priority
        sizes="(max-width: 760px) 90vw, 40vw"
      />
      {showModel && (
        <SceneErrorBoundary
          onError={() => {
            setAvailable(false);
            availabilityCallback.current?.(false);
          }}
        >
          <Suspense fallback={null}>
            <IceScene
              flavorName={flavorName}
              flavorColor={flavorColor}
              active={visible && canRender}
              lowPower={lowPower}
              showControls={showControls}
              viewAngle={viewAngle}
              onReady={handleReady}
            />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {!loaded && available && (
        <div className="model-loader" role="status">
          <span className="loader-ring" />
          <span>Congelando marciano...</span>
        </div>
      )}
    </div>
  );
}
