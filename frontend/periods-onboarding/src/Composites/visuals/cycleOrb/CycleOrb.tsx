import { GirlCharacter } from "../girlCharacter/GirlCharacter";
import { HoloRing, Orb, Sparkle } from "../primitives/primitives";

/* ------------------------------------------------------------------ */
/* Glowing cycle orb (modal, loading, success)                          */
/* ------------------------------------------------------------------ */
export function CycleOrb({ showCheck, progress, size = 200 }: { showCheck?: boolean; progress?: number; size?: number }) {
  const ringR = size / 2 + 26;
  const C = 2 * Math.PI * ringR;
  return (
    <div className="relative grid place-items-center" style={{ width: size + 80, height: size + 80 }}>
      <div className="absolute inset-0 animate-glow rounded-full bg-[radial-gradient(circle,rgba(243,79,151,0.35),rgba(255,156,198,0.2)_45%,transparent_70%)] blur-lg" />
      <HoloRing size={size + 60} dashed dot={false} reverse />
      {progress !== undefined && (
        <svg className="absolute -rotate-90" width={size + 80} height={size + 80} aria-hidden="true">
          <circle cx={size / 2 + 40} cy={size / 2 + 40} r={ringR} fill="none" stroke="#F8DDE7" strokeWidth="6" />
          <circle
            cx={size / 2 + 40}
            cy={size / 2 + 40}
            r={ringR}
            fill="none"
            stroke="#F34F97"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress / 100)}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
      )}
      <Orb size={size} material="pearl" className="grid animate-float place-items-center">
        <div className="absolute inset-5 animate-spin-slow rounded-full border-[3px] border-transparent border-l-rose/60 border-t-rose-light/50" />
        <div className="absolute inset-10 animate-spin-reverse rounded-full border-2 border-dashed border-rose/25" />
        {showCheck && (
          <svg viewBox="0 0 52 52" className="relative size-[42%]" aria-hidden="true">
            <circle cx="26" cy="26" r="24" fill="#F34F97" />
            <path d="M15 27 L23 34 L38 18" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" className="animate-draw" />
          </svg>
        )}
      </Orb>
    </div>
  );
}

/** Success composition: the guide beside the glowing cycle orb. */
export function SuccessVisual() {
  return (
    <div className="relative mx-auto flex items-end justify-center">
      <div className="h-[230px] animate-character-float sm:h-[300px]">
        <GirlCharacter />
      </div>
      <div className="-mb-4 -ml-10 origin-bottom-left scale-[0.62] sm:-ml-6 sm:scale-90">
        <CycleOrb size={170} showCheck />
      </div>
      <Sparkle size={14} className="left-[8%] top-[10%]" />
      <Sparkle size={10} className="right-[4%] top-[24%]" style={{ animationDelay: "0.8s" }} />
    </div>
  );
}
