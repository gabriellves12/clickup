"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

// ---------- Button ----------
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium tracking-tight rounded-md",
          "transition-all duration-100 ease-[cubic-bezier(.4,0,.2,1)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "active:translate-y-[0.5px] active:scale-[0.985]",
          "disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:scale-100",
          size === "sm" && "h-[26px] px-2.5 text-[12px] rounded-[6px]",
          size === "md" && "h-8 px-3 text-[13px] rounded-md",
          size === "lg" && "h-10 px-4 text-[14px] rounded-[10px]",
          variant === "primary" &&
            "bg-accent text-[var(--accent-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.14)] hover:bg-accent-2",
          variant === "secondary" &&
            "bg-surface text-text border border-border-strong shadow-e1 hover:bg-surface-2",
          variant === "ghost" &&
            "bg-transparent text-text-2 hover:bg-surface-2 hover:text-text",
          variant === "destructive" &&
            "bg-danger text-white hover:brightness-110",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// ---------- IconButton ----------
type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-grid place-items-center size-8 rounded-md",
        "text-text-2 hover:text-text hover:bg-surface-2",
        "border border-transparent hover:border-border",
        "transition-colors duration-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:opacity-45 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";

// ---------- Input ----------
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-[34px] px-3 rounded-md",
        "bg-surface text-text border border-border-strong",
        "text-[14px] tracking-tight",
        "placeholder:text-text-3",
        "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25",
        "disabled:opacity-55 disabled:cursor-not-allowed",
        "transition-shadow duration-100",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ---------- Textarea ----------
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[84px] px-3 py-2.5 rounded-md",
      "bg-surface text-text border border-border-strong",
      "text-[14px] tracking-tight leading-6 resize-y",
      "placeholder:text-text-3",
      "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ---------- Select (native, com wrapper para custom caret) ----------
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-[34px] pl-3 pr-9 rounded-md appearance-none w-full",
          "bg-surface text-text border border-border-strong",
          "text-[14px] tracking-tight",
          "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-2/3 size-2 rotate-45 border-r-[1.5px] border-b-[1.5px] border-text-3"
      />
    </div>
  )
);
Select.displayName = "Select";

// ---------- Label ----------
export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-[12px] font-medium text-text-2 tracking-tight", className)} {...props} />
);

// ---------- Field wrapper ----------
export function Field({ label, htmlFor, children, hint, error, className }: {
  label?: string; htmlFor?: string; children: React.ReactNode; hint?: string; error?: string; className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <span className="text-[11px] text-text-3">{hint}</span>}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}

// ---------- Badge ----------
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "solid" | "accent" | "success" | "warning" | "danger" | "info";
};
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-5 px-2 rounded-full",
        "text-[11px] font-medium tracking-tight border",
        tone === "neutral" && "bg-surface-2 text-text-2 border-hairline",
        tone === "solid" && "bg-text text-bg border-transparent",
        tone === "accent" && "bg-accent/15 text-accent border-transparent",
        tone === "success" && "bg-success/15 text-success border-transparent",
        tone === "warning" && "bg-warning/18 text-warning border-transparent",
        tone === "danger" && "bg-danger/15 text-danger border-transparent",
        tone === "info" && "bg-info/18 text-info border-transparent",
        className
      )}
      {...props}
    />
  );
}

// ---------- Status pill (com dot) ----------
type StatusTone = "neutral" | "doing" | "review" | "done" | "overdue" | "info" | "warn";
export function StatusPill({
  children, tone = "neutral", className,
}: { children: React.ReactNode; tone?: StatusTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full",
        "text-[11px] font-medium tracking-tight border",
        tone === "neutral" && "bg-surface-2 text-text-2 border-hairline",
        tone === "doing" && "bg-accent/12 text-accent border-transparent",
        tone === "review" && "bg-warning/14 text-warning border-transparent",
        tone === "done" && "bg-success/14 text-success border-transparent",
        tone === "overdue" && "bg-danger/14 text-danger border-transparent",
        tone === "info" && "bg-info/16 text-info border-transparent",
        tone === "warn" && "bg-warning/14 text-warning border-transparent",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

// ---------- Avatar ----------
export function Avatar({
  initials, colorKey = "av-1", size = "md", className, imageUrl,
}: { initials: string; colorKey?: string; size?: "sm" | "md" | "lg"; className?: string; imageUrl?: string | null }) {
  const grad: Record<string, string> = {
    "av-1": "linear-gradient(135deg,#171717,#525252)",
    "av-2": "linear-gradient(135deg,#262626,#737373)",
    "av-3": "linear-gradient(135deg,#404040,#8a8a8a)",
    "av-4": "linear-gradient(135deg,#111111,#666666)",
    "av-5": "linear-gradient(135deg,#525252,#a3a3a3)",
  };
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full text-white font-semibold tracking-tight",
        "border-[1.5px] border-surface",
        size === "sm" && "size-[22px] text-[10px]",
        size === "md" && "size-7 text-[11px]",
        size === "lg" && "size-10 text-[14px]",
        className
      )}
      style={{ backgroundImage: grad[colorKey] ?? grad["av-1"] }}
      aria-hidden
    >
      {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}
