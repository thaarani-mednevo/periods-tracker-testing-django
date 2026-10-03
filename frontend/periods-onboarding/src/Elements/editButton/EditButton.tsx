import { PencilLine } from "lucide-react";

interface EditButtonProps {
  onClick: () => void;
  /** Screen-reader context, e.g. "last period". */
  label: string;
}

export function EditButton({ onClick, label }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edit ${label}`}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2.5 text-caption font-semibold text-rose-ink transition-colors duration-200 hover:bg-blush-50 active:bg-blush-100 focus-ring pointer-fine:min-h-7 pointer-fine:px-2"
    >
      <PencilLine className="size-3.5" aria-hidden="true" />
      Edit
    </button>
  );
}
