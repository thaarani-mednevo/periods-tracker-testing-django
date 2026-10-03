import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../../lib/cn";

/**
 * Material library for the CSS-rendered "3D" scenes.
 * Lighting model: soft top-left key light, peach ambient fill, pink rim light.
 */
export const MATERIAL = {
  /** Frosted pink glass sphere */
  orb: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.7) 12%, rgba(255,211,228,0.8) 34%, rgba(243,79,151,0.5) 62%, rgba(255,111,174,0.62) 84%, rgba(255,200,222,0.95) 100%)",
  /** Pearl/white glass sphere */
  pearl: "radial-gradient(circle at 30% 25%, #fff 0%, rgba(255,255,255,0.92) 22%, rgba(255,229,239,0.9) 55%, rgba(255,211,228,0.85) 82%, rgba(255,156,198,0.75) 100%)",
  /** Rose metallic (for rings, caps, binders) */
  roseMetal: "linear-gradient(135deg, #ffe5ef 0%, #ff9cc6 22%, #d93d7f 48%, #ffb3d1 70%, #fff1f6 100%)",
  /** Pink liquid with a peach top note */
  peachLiquid: "linear-gradient(180deg, #ffd6c4 0%, #ff6fae 55%, #f34f97 100%)",
  /** Frosted glass panel */
  glassPanel: "linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.82) 45%, rgba(255,229,239,0.6) 100%)",
  /** Brand gradient */
  brand: "linear-gradient(135deg, #f34f97 0%, #ff6fae 100%)",
} as const;

export function Orb({
  size,
  className,
  material = "orb",
  children,
  style,
}: {
  size: number;
  className?: string;
  material?: "orb" | "pearl";
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("relative rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: MATERIAL[material],
        boxShadow:
          "inset -10px -14px 30px rgba(243,79,151,0.28), inset 8px 10px 24px rgba(255,255,255,0.9), 0 30px 60px -20px rgba(217,61,127,0.45), 0 0 0 1px rgba(255,255,255,0.5)",
        ...style,
      }}
    >
      {/* Specular highlight */}
      <span
        className="absolute left-[18%] top-[12%] h-[22%] w-[34%] -rotate-[28deg] rounded-full bg-white/80 blur-[6px]"
        aria-hidden="true"
      />
      {/* Pink rim light */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "inset -3px -3px 0 rgba(255,255,255,0.35), inset 0 -18px 30px -12px rgba(255,200,222,0.9)" }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

/** Frosted glass panel with a diagonal sheen — the surface most holograms are built on. */
export function GlassPanel({
  className,
  children,
  style,
}: {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("relative overflow-hidden border border-white/80 backdrop-blur-md", className)}
      style={{
        background: MATERIAL.glassPanel,
        boxShadow:
          "0 40px 70px -30px rgba(217,61,127,0.45), 0 10px 24px -12px rgba(255,111,174,0.35), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -20px 40px -20px rgba(255,156,198,0.35)",
        ...style,
      }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -left-1/4 -top-1/2 h-full w-[150%] -rotate-12 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

export function HoloRing({
  size,
  className,
  dashed,
  reverse,
  dot = true,
  tilt,
}: {
  size: number;
  className?: string;
  dashed?: boolean;
  reverse?: boolean;
  dot?: boolean;
  tilt?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, transform: tilt ? `rotateX(${tilt}deg)` : undefined }}
    >
      <div
        className={cn(
          "size-full rounded-full border",
          dashed ? "border-dashed border-rose/25" : "border-rose/20",
          reverse ? "animate-spin-reverse" : "animate-spin-slow",
          className,
        )}
      >
        {dot && (
          <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-glow-sm" />
        )}
      </div>
    </div>
  );
}

/** Tiny peach/rose particles drifting in the scene. */
export function Particles({ count = 10, className }: { count?: number; className?: string }) {
  const dots = Array.from({ length: count }, (_, i) => {
    // Deterministic pseudo-random layout
    const x = (i * 37 + 11) % 92;
    const y = (i * 53 + 7) % 88;
    const s = 3 + ((i * 7) % 5);
    return { x, y, s, d: (i % 5) * 0.8, peach: i % 4 === 0 };
  });
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {dots.map((p, i) => (
        <span
          key={i}
          className={cn("absolute animate-float rounded-full", p.peach ? "bg-apricot/40" : "bg-rose/35")}
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${6 + (i % 4)}s` }}
        />
      ))}
    </div>
  );
}

/** Soft contact shadow under an object. */
export function FloorShadow({ width = 220, className }: { width?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute left-1/2 -translate-x-1/2 rounded-[50%] blur-xl", className)}
      style={{ width, height: width * 0.16, background: "radial-gradient(ellipse, rgba(217,61,127,0.32), transparent 70%)" }}
    />
  );
}

/** Floating label chip used to annotate a scene. */
export function DataChip({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn(
        "absolute flex items-center gap-2 whitespace-nowrap rounded-2xl border border-white/90 bg-white/80 px-3 py-2 text-xs font-semibold text-ink-soft shadow-[0_6px_16px_-10px_rgba(217,61,127,0.18)] backdrop-blur-md",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/** Studio stage: warm backdrop, soft key light, peach ambience, pink rim glow. */
export function Stage({ children, className, caption }: { children: ReactNode; className?: string; caption?: ReactNode }) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[24px] border border-blush-300 bg-gradient-to-br from-[#FFF5F9] via-[#FFFAFC] to-[#FBF4FF]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(40,20,30,0.05)]",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -left-1/4 -top-1/4 size-[80%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),transparent_62%)]" />
        <div className="absolute -bottom-1/3 -right-1/4 size-[70%] rounded-full bg-[radial-gradient(circle,rgba(255,214,196,0.4),transparent_62%)]" />
        <div className="absolute -right-1/3 top-0 size-[70%] rounded-full bg-[radial-gradient(circle,rgba(255,156,198,0.32),transparent_60%)]" />
        {/* Faint holographic grid floor */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(rgba(243,79,151,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(243,79,151,0.07)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_top,black,transparent)] [transform:perspective(420px)_rotateX(58deg)] origin-bottom" />
        <Sparkle size={12} className="left-[9%] top-[14%]" />
        <Sparkle size={9} className="right-[12%] top-[22%]" style={{ animationDelay: "1.2s" }} />
        <Sparkle size={7} className="bottom-[26%] left-[16%]" style={{ animationDelay: "0.6s" }} />
      </div>
      {children}
      {caption && (
        <div className="absolute bottom-0 right-0 z-30 hidden max-w-[52%] justify-end p-2.5 sm:p-4 md:flex">
          <div className="max-w-full text-balance rounded-2xl border border-white/90 bg-white/80 px-3 py-1.5 text-center text-[11px] font-semibold leading-snug text-ink-soft shadow-sm backdrop-blur-md sm:rounded-full sm:px-3.5 sm:text-[11.5px]">
            {caption}
          </div>
        </div>
      )}
    </div>
  );
}

export type SceneMode = "landscape" | "portrait";

export interface SceneLayout {
  mode: SceneMode;
  /** Design-space canvas size — its aspect follows the panel so the composition fills it. */
  w: number;
  h: number;
  /** Rendered box of the guide in design space. She is anchored to the bottom-left of the canvas. */
  girlH: number;
  girlW: number;
}

const DEFAULT_LAYOUT: SceneLayout = { mode: "landscape", w: 640, h: 460, girlH: 403, girlW: 269 };

/**
 * The guide's size. Height leads — she occupies 35–45% of the panel — and her width follows the
 * artwork's aspect, then gets clamped to the device's width band so she never grows into the scene.
 * (On a 4:5 panel the two bands cannot both be hit exactly, so height wins and width lands at the
 * bottom of its band.)
 */
const GIRL_HEIGHT_SHARE = { desktop: 0.48, tablet: 0.46, mobile: 0.48 } as const;
const GIRL_WIDTH_BAND = { desktop: [0.38, 0.45], tablet: [0.35, 0.4], mobile: [0.42, 0.5] } as const;
/** Portrait scenes stack the guide under the scene, so she may use more of the narrow canvas. */
const PORTRAIT_WIDTH_MAX = 0.78;
/**
 * Portrait scene box geometry (see SceneBox): 440 design px tall, scaled 0.92 from an 8px top inset.
 * The guide stands in the space under it, so her height is capped to what is left below the scene.
 */
const PORTRAIT_SCENE_BOTTOM = 8 + 440 * 0.92;
/** How far her head may rise into the scene box's bottom padding (it holds no content). */
const PORTRAIT_OVERLAP = 12;
/** Portrait aspect of the artwork (1024×1536); wider pieces are letterboxed inside the same box. */
const GIRL_ASPECT = 1024 / 1536;

type Device = keyof typeof GIRL_HEIGHT_SHARE;

/** Device band from the viewport, matching the app's own breakpoints. */
function deviceFor(): Device {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

/** Composition rules: landscape = guide bottom-left, holograms centre/right; portrait = holograms on top, guide below. */
function layoutFor(width: number, height: number, forced?: SceneMode): SceneLayout {
  const ratio = width > 0 ? height / width : 0.72;
  const mode: SceneMode = forced ?? (ratio > 1.25 ? "portrait" : "landscape");
  const w = mode === "portrait" ? 420 : 640;
  const h =
    mode === "portrait"
      ? Math.round(Math.min(900, Math.max(640, w * ratio)))
      : Math.round(Math.min(720, Math.max(460, w * ratio)));

  // Height leads, width follows the artwork's aspect and is then clamped to the device band.
  const device = deviceFor();
  const [minShare, maxShare] = GIRL_WIDTH_BAND[device];
  const targetH = h * GIRL_HEIGHT_SHARE[device];
  const widthCap = mode === "portrait" ? w * PORTRAIT_WIDTH_MAX : w * maxShare;
  // Portrait: never taller than the room under the scene, or she would cover its lowest chips.
  const heightCap = mode === "portrait" ? h - PORTRAIT_SCENE_BOTTOM + PORTRAIT_OVERLAP : h * 0.5;
  let girlW = Math.min(Math.min(targetH, heightCap) * GIRL_ASPECT, widthCap);
  if (mode === "portrait") girlW = Math.max(girlW, Math.min(w * minShare, heightCap * GIRL_ASPECT));
  const girlH = Math.min(girlW / GIRL_ASPECT, heightCap);
  return { mode, w, h, girlH: Math.round(girlH), girlW: Math.round(girlW) };
}

const SceneLayoutContext = createContext<SceneLayout>(DEFAULT_LAYOUT);

/** The composition chosen by the surrounding SceneCanvas. */
export function useSceneLayout(): SceneLayout {
  return useContext(SceneLayoutContext);
}

/**
 * Composition scaled to fit its container. The canvas aspect is derived from the container so the
 * scene fills the whole panel (no empty band); it switches to a portrait composition for tall, narrow
 * panels. Scale is written to the DOM inside the ResizeObserver callback (before paint), so a panel
 * resize never shows an oversized frame.
 */
export function SceneCanvas({ children, mode = "auto" }: { children: ReactNode; mode?: SceneMode | "auto" }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<SceneLayout>(DEFAULT_LAYOUT);

  useLayoutEffect(() => {
    const el = ref.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const next = layoutFor(width, height, mode === "auto" ? undefined : mode);
      // A little headroom so the idle float never lifts her hair past the top edge.
      const scale = Math.min(width / next.w, height / (next.h + 16));
      canvas.style.width = `${next.w}px`;
      canvas.style.height = `${next.h}px`;
      canvas.style.transform = `translateX(-50%) scale(${scale})`;
      canvas.style.opacity = scale > 0 ? "1" : "0";
      setLayout((prev) => (prev.mode === next.mode && prev.w === next.w && prev.h === next.h ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  return (
    <SceneLayoutContext.Provider value={layout}>
      <div ref={ref} className="absolute inset-0 overflow-hidden">
        {/* Anchored to the bottom centre (the guide's image ends at her thighs, so she sits on the card edge). */}
        <div ref={canvasRef} className="absolute bottom-0 left-1/2 origin-bottom opacity-0 transition-opacity duration-300">
          {children}
        </div>
      </div>
    </SceneLayoutContext.Provider>
  );
}

export function Sparkle({ size = 14, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("pointer-events-none absolute animate-glow", className)} style={style} aria-hidden="true">
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill="#FF7CB6" />
    </svg>
  );
}

/**
 * The contextual hologram area: a 420×440 design box placed where the guide is pointing —
 * upper-right in landscape (vertically balanced in taller panels), across the top in portrait.
 */
export function SceneBox({ children }: { children: ReactNode }) {
  const { mode, h } = useSceneLayout();
  const landscapeTop = Math.round(Math.max(6, (h - 460) * 0.35));
  return (
    <div
      className={cn("absolute h-[440px] w-[420px]", mode === "landscape" ? "right-0 origin-top-right scale-[0.8]" : "left-0 top-2 origin-top scale-[0.92]")}
      style={mode === "landscape" ? { top: landscapeTop } : undefined}
    >
      {children}
    </div>
  );
}

/** Soft 3D-looking five-petal flower (pink with a peach heart). */
export function Flower({ size = 64, className, style, hue = "pink" }: { size?: number; className?: string; style?: CSSProperties; hue?: "pink" | "blush" }) {
  // Scoped per instance: several flowers share a scene, and duplicate SVG ids are invalid and fragile.
  const id = `fl-${hue}-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("pointer-events-none absolute drop-shadow-[0_4px_8px_rgba(243,79,151,0.1)]", className)}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="85%" r="85%">
          <stop offset="0" stopColor={hue === "pink" ? "#F34F97" : "#FF9CC6"} />
          <stop offset="0.55" stopColor={hue === "pink" ? "#FF8DBF" : "#FFC2DA"} />
          <stop offset="1" stopColor="#FFF1F6" />
        </radialGradient>
        <radialGradient id={`${id}-c`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFF6F2" />
          <stop offset="1" stopColor="#FFB59C" />
        </radialGradient>
      </defs>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="50" cy="27" rx="17" ry="25" fill={`url(#${id})`} transform={`rotate(${angle} 50 50)`} opacity="0.95" />
      ))}
      <circle cx="50" cy="50" r="10" fill={`url(#${id}-c)`} />
    </svg>
  );
}

/** Slender leafy sprig used to frame the scene. */
export function Sprig({ className, style, flip }: { className?: string; style?: CSSProperties; flip?: boolean }) {
  return (
    <svg
      width="70"
      height="110"
      viewBox="0 0 70 110"
      className={cn("pointer-events-none absolute", className)}
      style={{ transform: flip ? "scaleX(-1)" : undefined, ...style }}
      aria-hidden="true"
    >
      <path d="M35 108 C34 80 36 50 40 8" fill="none" stroke="#E0B8D6" strokeWidth="2" strokeLinecap="round" />
      {[20, 38, 56, 74].map((y, i) => (
        <g key={y}>
          <ellipse
            cx={i % 2 ? 50 : 24}
            cy={y}
            rx="12"
            ry="6"
            fill={i % 2 ? "#FFC2DA" : "#E7DCF7"}
            opacity="0.9"
            transform={`rotate(${i % 2 ? -30 : 30} ${i % 2 ? 50 : 24} ${y})`}
          />
        </g>
      ))}
    </svg>
  );
}
