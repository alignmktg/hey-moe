import { forwardRef } from "react";
import { cn } from "../../lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary: "bg-[#E85D3A] text-white hover:bg-[#D14E2D] active:bg-[#C0452A]",
  secondary:
    "bg-[#F0EDE8] text-[#1A1A1A] hover:bg-[#E8E5E1] active:bg-[#DDD9D3]",
  ghost: "text-[#6B6660] hover:bg-[#F0EDE8] active:bg-[#E8E5E1]",
};

const sizeStyles = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
