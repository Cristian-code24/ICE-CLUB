"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
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

function getModelAvailability() {
  if (
    typeof window === "undefined" ||
    process.env.ICE_CLUB_MODEL_AVAILABLE !== "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }

  const lowEnd =
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
    ("deviceMemory" in navigator &&
      Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) <= 4);
  return !lowEnd && supportsWebGL();
}

function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
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
  const [loaded, setLoaded] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const available = useSyncExternalStore(
    subscribeToReducedMotion,
    getModelAvailability,
    () => false,
  );

  useEffect(() => {
    readyCallback.current = onModelReady;
    availabilityCallback.current = onAvailabilityChange;
  }, [onAvailabilityChange, onModelReady]);

  const handleReady = useCallback(() => {
    setLoaded(true);
    readyCallback.current?.();
  }, []);

  useEffect(() => {
    availabilityCallback.current?.(available);
  }, [available]);

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

  const showModel = available && !sceneFailed && (loaded || visible);
  const modelReady = available && loaded && !sceneFailed;

  return (
    <div
      ref={hostRef}
      className="model-stage"
      data-model-ready={modelReady}
      role="group"
      aria-label={`Vista 3D de ${flavorName}`}
    >
      <Image
        className={`model-fallback ${modelReady ? "model-fallback-hidden" : ""}`}
        src={fallbackImage}
        alt={`Marcianos artesanales de ${flavorName}`}
        fill
        priority
        sizes="(max-width: 760px) 90vw, 40vw"
      />
      {showModel && (
        <SceneErrorBoundary
          onError={() => {
            setSceneFailed(true);
            availabilityCallback.current?.(false);
          }}
        >
          <Suspense fallback={null}>
            <IceScene
              flavorName={flavorName}
              flavorColor={flavorColor}
              active={visible && canRender}
              showControls={showControls}
              viewAngle={viewAngle}
              onReady={handleReady}
            />
          </Suspense>
        </SceneErrorBoundary>
      )}
      {!modelReady && available && (
        <div className="model-loader" role="status">
          <span className="loader-ring" />
          <span>Congelando marciano...</span>
        </div>
      )}
    </div>
  );
}
