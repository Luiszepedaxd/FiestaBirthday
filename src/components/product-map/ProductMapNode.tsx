import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PRODUCT_MAP_CENTER_COLOR } from "./constants";

type ProductMapNodeBubbleProps = {
  name: string;
  color: string;
  isCenter?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  animationDelay?: number;
  /** Inside React Flow: no button/motion entrance (avoids 0-size / invisible nodes). */
  variant?: "default" | "flow";
};

const sizeClasses = {
  sm: "h-16 w-16 text-[10px]",
  md: "h-20 w-20 text-xs sm:h-24 sm:w-24 sm:text-sm",
  lg: "h-28 w-28 text-sm sm:h-36 sm:w-36 sm:text-base",
};

const bubbleClassName = (
  size: ProductMapNodeBubbleProps["size"],
  isCenter: boolean,
  className?: string,
) =>
  cn(
    "flex shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-white p-2 text-center font-semibold leading-tight text-white shadow-lg outline-none ring-offset-2 transition-shadow focus-visible:ring-2 focus-visible:ring-[#C6017F] focus-visible:ring-offset-[#FAF8F5]",
    sizeClasses[size ?? "md"],
    isCenter && "shadow-xl ring-2 ring-[#C6017F]/30",
    className,
  );

export function ProductMapNodeBubble({
  name,
  color,
  isCenter = false,
  size = "md",
  className,
  onClick,
  onContextMenu,
  animationDelay = 0,
  variant = "default",
}: ProductMapNodeBubbleProps) {
  const displayColor = isCenter ? PRODUCT_MAP_CENTER_COLOR : color;
  const style = {
    backgroundColor: displayColor,
    boxShadow: isCenter
      ? `0 8px 32px ${PRODUCT_MAP_CENTER_COLOR}40`
      : `0 4px 16px ${displayColor}55`,
  };

  if (variant === "flow") {
    return (
      <div
        className={bubbleClassName(size, isCenter, className)}
        style={style}
        title={name}
      >
        <span className="line-clamp-3 px-1">{name}</span>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: animationDelay, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={bubbleClassName(size, isCenter, className)}
      style={style}
      title={name}
    >
      <span className="line-clamp-3 px-1">{name}</span>
    </motion.button>
  );
}
