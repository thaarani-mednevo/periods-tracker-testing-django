import avaRobot from "../../../../assets/phases/luteal/ava-robot.png";

export function AvaAvatar({ className = "", label }: { className?: string; label?: string }) {
  return <img src={avaRobot} alt={label ?? ""} draggable={false} className={`select-none object-contain ${className}`} />;
}