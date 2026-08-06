"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui/primitives";
import { BrandLoader } from "@/components/shell/BrandLoader";
import { signIn, type SignInResult } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInResult | null, FormData>(signIn, null);
  const [showPassword, setShowPassword] = React.useState(false);
  const error = state && state.ok === false ? state.error : null;

  return (
    <>
    {pending && (
      <div
        className="fixed inset-0 z-[90] bg-bg grid place-items-center"
        style={{ animation: "brandFadeIn 180ms ease-out" }}
        aria-live="polite"
      >
        <BrandLoader />
      </div>
    )}
    <form action={formAction} className="grid gap-4">
      <Field label="Email">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="nome@thinkcontrol.com.br"
          className="h-12 rounded-lg border-[#dedede] bg-white px-3.5 text-[13px] focus:ring-black/10"
        />
      </Field>

      <Field label="Senha">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-12 rounded-lg border-[#dedede] bg-white px-3.5 pr-11 text-[13px] focus:ring-black/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 grid place-items-center rounded-md text-text-3 hover:text-text hover:bg-surface-2 transition-colors"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4">
                <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.7 20.7 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.7 20.7 0 01-3.16 4.19M1 1l22 22M9.88 9.88a3 3 0 004.24 4.24" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </Field>

      {error && (
        <div className={cn(
          "text-[12.5px] leading-snug px-3 py-2.5 rounded-md",
          "bg-danger/10 text-danger border border-danger/20",
        )}>
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={pending}
        className="mt-2 h-12 w-full justify-center rounded-lg text-[13px]"
      >
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-[10.5px] text-text-3">
        Problemas para acessar? Fale com o responsável pelo workspace.
      </p>
    </form>
    </>
  );
}
