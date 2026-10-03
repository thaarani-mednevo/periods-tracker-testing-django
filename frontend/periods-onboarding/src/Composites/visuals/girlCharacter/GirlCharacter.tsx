import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GENERIC_GIRL } from "../../../assets/cycle-tracker/stepVisuals";
import { cn } from "../../../lib/cn";

/** The one guide character, shared by all 11 steps (bundled asset, never an external URL). */
export const GIRL_SRC = GENERIC_GIRL;

interface GirlCharacterProps {
  className?: string;
  /** Pass true where surrounding content already describes the scene. */
  decorative?: boolean;
}

/**
 * Renders the supplied character exactly as delivered — object-contain, never cropped, stretched,
 * rotated or filtered. Motion belongs to the wrappers around her (transform/opacity only). If the file
 * is ever missing, a neutral orb stands in — never a substitute person.
 */
export function GirlCharacter({ className, decorative }: GirlCharacterProps) {
  const [failed, setFailed] = useState(false);

  if (!GIRL_SRC || failed) {
    return (
      <div className={cn("grid aspect-[2/3] h-full place-items-center", className)} aria-hidden="true">
        <div className="grid size-2/3 max-h-40 max-w-40 place-items-center rounded-full bg-[radial-gradient(circle_at_32%_26%,#fff,#FFD3E4_45%,#FF9CC6)]">
          <Sparkles className="size-1/3 text-white" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={GIRL_SRC}
      alt={decorative ? "" : "Mednevo wellness guide"}
      aria-hidden={decorative || undefined}
      width={800}
      height={1200}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("h-full w-auto max-w-none select-none object-contain", className)}
    />
  );
}
