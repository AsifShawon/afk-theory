import React, { forwardRef, ButtonHTMLAttributes } from "react"
import clsx from "clsx"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "contrast" | "outline" | "ghost" | "danger"
  size?: "small" | "medium" | "large"
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "medium",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center font-heading font-semibold uppercase tracking-wider transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-accent text-on-accent hover:bg-accent-hover border border-accent",
          variant === "secondary" && "bg-raised text-ink hover:bg-line border border-control",
          variant === "contrast" && "bg-ink text-canvas hover:bg-ink/90 border border-ink",
          variant === "outline" && "bg-transparent text-ink hover:bg-raised border border-control hover:border-accent hover:text-accent",
          variant === "ghost" && "bg-transparent text-ink hover:bg-raised border-transparent",
          variant === "danger" && "bg-err text-canvas hover:bg-err/85 border border-err",
          size === "small" && "h-8 px-3 text-[11px]",
          size === "medium" && "h-10 px-5 text-xs",
          size === "large" && "h-12 px-8 text-xs sm:text-sm",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"
