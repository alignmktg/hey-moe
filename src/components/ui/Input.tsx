import { forwardRef } from "react";
import { cn } from "../../lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-[#FAFAF8] border border-[#E8E5E1] px-4 text-[14px] text-[#1A1A1A] placeholder:text-[#9C9690] focus:outline-none focus:border-[#E85D3A] focus:ring-2 focus:ring-[#E85D3A]/10 h-11 transition-colors",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
