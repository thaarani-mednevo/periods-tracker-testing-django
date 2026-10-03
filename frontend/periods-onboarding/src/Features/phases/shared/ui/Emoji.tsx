interface EmojiProps {
  symbol: string;
  label?: string;
  className?: string;
}

export function Emoji({ symbol, label, className = "" }: EmojiProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <span
      {...a11y}
      className={`inline-flex select-none items-center justify-center leading-none ${className}`}
      style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"' }}
    >
      {symbol}
    </span>
  );
}