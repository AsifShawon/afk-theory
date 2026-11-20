import { clsx } from "clsx"
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-graphite text-brand-bone hover:bg-brand-graphite-light",
  secondary: "bg-white text-brand-graphite border border-brand-border hover:border-brand-graphite",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  ghost: "text-brand-graphite hover:bg-brand-stone",
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-base px-4 h-10 text-sm font-semibold transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent",
        buttonStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={clsx("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
    </label>
  )
}

const inputBase =
  "w-full rounded-base border border-brand-border bg-white px-3 text-sm text-brand-graphite placeholder:text-brand-muted-light focus:border-brand-graphite focus:outline-none"

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputBase, "h-10", className)} {...props} />
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(inputBase, "py-2 min-h-[96px]", className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(inputBase, "h-10", className)} {...props} />
}

export function Card({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-panel border border-brand-border bg-white p-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title && <h2 className="font-display text-lg font-bold uppercase tracking-tight">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "live" | "warn"; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        tone === "live" && "bg-brand-accent text-brand-graphite",
        tone === "warn" && "bg-amber-100 text-amber-900",
        tone === "neutral" && "bg-brand-stone text-brand-muted"
      )}
    >
      {children}
    </span>
  )
}

export function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-base border px-4 py-3 text-sm",
        tone === "error" && "border-red-200 bg-red-50 text-red-800",
        tone === "success" && "border-green-200 bg-green-50 text-green-900",
        tone === "info" && "border-brand-border bg-brand-bone text-brand-graphite"
      )}
    >
      {children}
    </div>
  )
}
