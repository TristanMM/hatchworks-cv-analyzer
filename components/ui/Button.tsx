import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
};

/**
 * Generic reusable button (see conventions.md — components/ui).
 */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
