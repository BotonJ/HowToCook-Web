import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:brightness-95 shadow-sm",
  secondary:
    "bg-secondary-container text-on-secondary-container hover:brightness-95 shadow-sm",
  ghost:
    "bg-transparent text-primary hover:bg-primary-container/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-label-sm",
  md: "px-6 py-3 text-label-lg",
  lg: "px-8 py-4 text-body-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-full active:scale-90 transition-all font-semibold",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
