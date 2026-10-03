import {
  Activity,
  Bell,
  CalendarDays,
  CalendarHeart,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Clock,
  Droplet,
  Egg,
  FileHeart,
  Gauge,
  Heart,
  HeartPulse,
  Hourglass,
  Pill,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  ShieldPlus,
  Smile,
  Thermometer,
  Timer,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { useId, type CSSProperties } from "react";
import { cn } from "../../../lib/cn";
import type { StepId } from "../../../types";
import { useSceneLayout, type SceneLayout } from "../primitives/primitives";

/* ------------------------------------------------------------------ */
/* Contextual icons                                                    */
/* ------------------------------------------------------------------ */

/**
 * Three icons per step, largest first. Only what belongs to that step — never generic filler. The
 * third icon is only shown on wide (landscape) compositions where there is room for it.
 */
const STEP_ICONS: Record<StepId, readonly [LucideIcon, LucideIcon, LucideIcon]> = {
  1: [CalendarDays, Droplet, Clock],
  2: [RefreshCcw, CalendarDays, Gauge],
  3: [Activity, HeartPulse, CircleHelp],
  4: [Hourglass, Timer, CalendarDays],
  5: [Ruler, Weight, Heart],
  6: [ShieldPlus, Pill, FileHeart],
  7: [Heart, Smile, Thermometer],
  8: [Bell, CalendarDays, Droplet],
  9: [ShieldCheck, Pill, CalendarHeart],
  10: [Heart, Egg, CalendarHeart],
  11: [ClipboardCheck, ShieldCheck, CircleCheck],
};

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/** Which viewports get an element: 1 = always, 2 = tablet and up, 3 = desktop only. */
type Tier = 1 | 2 | 3;

const TIER_CLASS: Record<Tier, string> = {
  1: "",
  2: "hidden md:block",
  3: "hidden lg:block",
};

interface Motion {
  /** Seconds for one float cycle — varied so nothing moves in lockstep. */
  duration: number;
  delay: number;
  /** Vertical drift in px (4–10). */
  lift: number;
  /** Gentle tilt in degrees. */
  tilt: number;
}

function floatStyle(m: Motion): CSSProperties & { "--gy": string; "--gr": string } {
  return {
    "--gy": `${-m.lift}px`,
    "--gr": `${m.tilt}deg`,
    animation: `glassFloat ${m.duration}s ease-in-out ${m.delay}s infinite`,
  };
}

/**
 * A translucent glass sphere: white frost, a hairline bright rim, a soft pink inner glow and a
 * specular highlight. Depth comes from transparency and blur, not from heavy shadow.
 */
export function GlassOrb({
  size,
  x,
  y,
  motion,
  tier = 1,
  icon,
  gradientId,
}: {
  size: number;
  x: number;
  y: number;
  motion: Motion;
  tier?: Tier;
  icon?: LucideIcon;
  /** Prefix of this layer's shared icon gradients (unique per mounted decor layer). */
  gradientId: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute", TIER_CLASS[tier])} style={{ left: x, top: y, width: size, height: size }}>
      <div
        className="relative size-full rounded-full border border-white/85 backdrop-blur-[18px]"
        style={{
          ...floatStyle(motion),
          background:
            "radial-gradient(circle at 68% 76%, rgba(255,170,206,0.42), transparent 56%), radial-gradient(circle at 30% 24%, rgba(255,255,255,0.9), rgba(255,255,255,0.45) 46%, rgba(255,226,238,0.38) 100%)",
          boxShadow:
            "0 10px 26px rgba(30,20,30,0.08), inset 0 -14px 26px rgba(255,150,196,0.28), inset 0 8px 18px rgba(255,255,255,0.85), inset 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        {/* Refraction ring just inside the rim */}
        <span className="absolute inset-[7%] rounded-full border border-white/60" />
        {/* Specular highlight, slowly glinting */}
        <span
          className="absolute left-[16%] top-[10%] h-[26%] w-[40%] -rotate-[24deg] rounded-full bg-white/90 blur-[3px]"
          style={{ animation: `glassGlint ${motion.duration + 2}s ease-in-out ${motion.delay}s infinite` }}
        />
        {/* Lower reflection */}
        <span className="absolute bottom-[12%] right-[18%] h-[10%] w-[26%] rounded-full bg-white/55 blur-[2px]" />
        {icon && <FloatingMedicalIcon icon={icon} size={size} gradientId={gradientId} />}
      </div>
    </div>
  );
}

/** A wellness glyph suspended inside an orb, shaded with a pink gradient so it reads as an object. */
export function FloatingMedicalIcon({ icon: Icon, size, gradientId }: { icon: LucideIcon; size: number; gradientId: string }) {
  return (
    <span className="absolute inset-0 grid place-items-center">
      <Icon
        className="drop-shadow-[0_3px_4px_rgba(217,61,127,0.18)]"
        style={{ width: size * 0.42, height: size * 0.42 }}
        stroke={`url(#${gradientId}-stroke)`}
        fill={`url(#${gradientId}-fill)`}
        strokeWidth={1.9}
      />
    </span>
  );
}

/** Shared gradients for every glass icon — defined once per decor layer. */
function GlassIconGradients({ id }: { id: string }) {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8DBF" />
          <stop offset="1" stopColor="#D93D7F" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE3EF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFB6D5" stopOpacity="0.55" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** A tiny glowing glass bead. */
export function GlassParticle({ size, x, y, motion, tier = 1 }: { size: number; x: number; y: number; motion: Motion; tier?: Tier }) {
  return (
    <span
      className={cn("pointer-events-none absolute rounded-full border border-white/80 bg-white/55", TIER_CLASS[tier])}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: "radial-gradient(circle at 35% 30%, #fff, rgba(255,196,222,0.55) 70%)",
        boxShadow: "0 2px 6px rgba(30,20,30,0.06)",
        ...floatStyle(motion),
      }}
    />
  );
}

/** A faint elliptical ring suggesting a holographic field behind the scene. */
export function HolographicRing({ x, y, width, tier = 2 }: { x: number; y: number; width: number; tier?: Tier }) {
  return (
    <div
      className={cn("pointer-events-none absolute rounded-[50%] border border-[#F3A8C5]/30", TIER_CLASS[tier])}
      style={{
        left: x - width / 2,
        top: y - width * 0.18,
        width,
        height: width * 0.36,
        animation: "glassGlint 12s ease-in-out infinite",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

interface Slot {
  x: number;
  y: number;
  size: number;
  tier: Tier;
}

/**
 * Safe areas, computed from the same geometry the scene and the guide use: the guide owns the
 * bottom-left, the scene box the centre/right (landscape) or the top (portrait). Glass only goes
 * where neither is.
 */
function slotsFor(layout: SceneLayout): { orbs: Slot[]; particles: Slot[]; ring?: { x: number; y: number; width: number } } {
  const { mode, w, h } = layout;

  if (mode === "landscape") {
    const sceneLeft = w - 420 * 0.8;
    const sceneTop = Math.round(Math.max(6, (h - 460) * 0.35));
    const sceneBottom = sceneTop + 440 * 0.8;
    const girlTop = h - layout.girlH;
    const orbs: Slot[] = [
      // Upper-left, above the guide's head.
      { x: Math.round(w * 0.07), y: Math.round(Math.max(18, girlTop * 0.18)), size: 108, tier: 1 },
      // Between the guide and the scene, just below the first orb.
      { x: Math.round(sceneLeft - 104), y: Math.round(Math.max(140, girlTop * 0.62)), size: 74, tier: 2 },
    ];
    // Lower-right, beneath the scene box — only when the canvas is tall enough to leave room.
    const lowerRightY = sceneBottom + 16;
    if (lowerRightY + 64 < h - 64) orbs.push({ x: w - 132, y: lowerRightY, size: 64, tier: 3 });

    const particles: Slot[] = [
      { x: Math.round(w * 0.3), y: 26, size: 8, tier: 1 },
      { x: Math.round(sceneLeft - 26), y: Math.round(sceneTop + 40), size: 6, tier: 2 },
      { x: Math.round(w * 0.2), y: Math.round(Math.max(90, girlTop * 0.7)), size: 5, tier: 2 },
      { x: w - 36, y: Math.round(sceneBottom - 20), size: 7, tier: 3 },
      { x: Math.round(sceneLeft + 40), y: Math.round(sceneBottom + 6), size: 5, tier: 3 },
    ];
    return { orbs, particles, ring: { x: Math.round(sceneLeft + 168), y: Math.round(sceneBottom - 26), width: 300 } };
  }

  // Portrait: the scene fills the top, the guide the bottom-left — glass lives in the right column.
  const sceneBottom = 8 + 440 * 0.92;
  const orbs: Slot[] = [
    { x: w - 116, y: sceneBottom + 16, size: 92, tier: 1 },
    { x: w - 88, y: Math.round(h - 210), size: 64, tier: 2 },
  ];
  const particles: Slot[] = [
    { x: w - 150, y: sceneBottom + 110, size: 7, tier: 1 },
    { x: w - 40, y: Math.round(h - 250), size: 6, tier: 2 },
    { x: w - 120, y: Math.round(h - 120), size: 5, tier: 2 },
  ];
  return { orbs, particles };
}

const ORB_MOTION: readonly Motion[] = [
  { duration: 9, delay: 0, lift: 8, tilt: 3 },
  { duration: 7, delay: 1.2, lift: 6, tilt: -4 },
  { duration: 11, delay: 0.6, lift: 5, tilt: 2 },
];

const PARTICLE_MOTION: readonly Motion[] = [
  { duration: 6, delay: 0.3, lift: 6, tilt: 0 },
  { duration: 8, delay: 1.6, lift: 9, tilt: 0 },
  { duration: 10, delay: 0.9, lift: 5, tilt: 0 },
  { duration: 7, delay: 2.2, lift: 7, tilt: 0 },
  { duration: 12, delay: 0.1, lift: 4, tilt: 0 },
];

/**
 * The soft glass atmosphere behind every step's visual: 2–3 glass spheres holding icons that belong to
 * the step, a handful of glass particles and a faint holographic ring. Purely decorative — hidden from
 * assistive tech, never focusable, positioned only in areas the scene and the guide leave free, and
 * thinned out on tablets and phones. Motion is transform/opacity only and stops under reduced motion.
 */
export function GlassWellnessDecor({ step }: { step: StepId }) {
  const layout = useSceneLayout();
  const { orbs, particles, ring } = slotsFor(layout);
  const icons = STEP_ICONS[step];
  // useId contains ":" characters, which are not valid in url(#…) references.
  const gradientId = `glass-${useId().replace(/:/g, "")}`;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <GlassIconGradients id={gradientId} />
      {ring && <HolographicRing {...ring} />}
      {orbs.map((slot, i) => (
        <GlassOrb key={i} {...slot} icon={icons[i]} gradientId={gradientId} motion={ORB_MOTION[i % ORB_MOTION.length]} />
      ))}
      {particles.map((slot, i) => (
        <GlassParticle key={i} {...slot} motion={PARTICLE_MOTION[i % PARTICLE_MOTION.length]} />
      ))}
    </div>
  );
}
