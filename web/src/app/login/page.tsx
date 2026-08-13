"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiPost, ApiError } from "@/lib/api-client";
import { storeTokens, type AuthTokens } from "@/lib/auth";
import { BandWeave } from "./LoginBackdrop";
import { ResetCodeForm } from "./ResetCodeForm";
import { SessionEndedNotice } from "./SessionEndedNotice";

const fieldClassName =
  "w-full rounded-md border border-border bg-surface py-3 pl-4 pr-11 text-sm outline-none transition-colors placeholder:text-foreground/45 focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Reached by link, never shown automatically — see ResetCodeForm for why an email address alone
  // must not open a password-setting flow.
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const tokens = await apiPost<AuthTokens>("/api/v1/auth/login", { email, password });
      storeTokens(tokens);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details) {
          setFieldErrors(
            Object.fromEntries(error.details.map((d) => [d.field.toLowerCase(), d.message])),
          );
        }
        setFormError(error.message);
      } else {
        setFormError("Unable to reach the server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    /* One screen, never a scrollbar. dvh rather than vh because a phone's retracting address bar
       makes 100vh taller than what is actually on show, which puts Sign in just past the fold. */
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/*
        The machine fills the left of the page, the accent band the right, and the card straddles the
        seam between them — which is what gives the layout its depth, so both are backdrops here
        rather than columns in the flow.

        The panel is held light in both themes rather than following the background: the artwork is
        a black machine on white, so on a dark background it would be a glaring white slab with an
        invisible machine in the middle of it.
      */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[74%] bg-[#f6f4f0] lg:block" />

      {/* Black, sampled from the machine's own body rather than picked by eye, so the band and the
          artwork read as one palette. The brand colour still carries on the tile, the wordmark and
          the Continue button — all on white, where it works. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[26%] bg-[#222124] lg:block">
        <BandWeave className="h-full w-full text-white/[0.08]" />
      </div>

      {/*
        The right padding is what makes the card straddle the band rather than sit on top of it:
        roughly two thirds of the card wants to be over the page and a third over the accent, and
        with the band 26% wide that lands the card's right edge around 16% in from the edge.
      */}
      <div className="relative flex flex-1 items-center justify-center px-5 lg:justify-between lg:gap-8 lg:px-12 lg:pr-[16%] xl:px-20 xl:pr-[16%]">
        {/*
          The machine sits in the flow rather than in the panel behind it, so it centres in the gap
          actually left beside the card. Positioned in the panel with a fixed percentage padding it
          could only be centred at one window width — the card's edge moves as the viewport changes,
          and the machine drifted off-centre everywhere else.

          Vertically it needs nothing: it and the card are siblings under items-center, so both are
          middle-aligned on the same line.
        */}
        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          {/*
            A plain img, not next/image: this app builds with `output: "export"`, where the image
            optimiser needs a loader that is not configured.

            The source login.png was opaque white with no alpha, which showed as a white rectangle on
            the warm panel. It is served here as a WebP with the background cleared to transparent —
            which also cuts it from 1.1 MB to 36 KB, the white having carried compression noise that
            PNG could not squeeze.
          */}
          {/* Two ceilings at once, hence min(): 28rem keeps it compact on a wide screen, and 100%
              keeps it inside its column on a narrow one. With only the rem cap it stayed 28rem on a
              1024-wide tablet and slid under the card, which clipped the handwheel. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login.webp"
            alt=""
            className="max-h-[46%] w-auto max-w-[min(28rem,100%)] object-contain"
          />
        </div>

        {/* ---- Sign-in card ---- */}
        <div className="w-full max-w-[30rem] shrink-0 rounded-xl border border-border bg-surface px-7 py-9 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] sm:px-10">
          <div className="flex flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
              M
            </span>
            <p className="mt-2.5 text-lg font-bold tracking-tight">
              Mathilens <span className="text-primary">Tailoring</span>
            </p>
          </div>

          <h1 className="mt-6 text-center text-xl font-semibold">Sign In with your Email</h1>
          <span className="mx-auto mt-2 block h-0.5 w-24 rounded-full bg-primary/70" />

          {isRedeeming ? (
            <ResetCodeForm
              onDone={() => {
                setIsRedeeming(false);
                setRedeemed(true);
              }}
              onCancel={() => setIsRedeeming(false)}
            />
          ) : (
            <>
              {!redeemed && (
                <Suspense fallback={null}>
                  <SessionEndedNotice />
                </Suspense>
              )}
              {redeemed && (
                <p className="mt-5 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  Password set. Sign in with it below.
                </p>
              )}
          <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
            <div>
              {/* Labels are read out but not drawn: the reference puts the name in the field
                  itself, and a placeholder alone would leave the input unnamed to a screen reader. */}
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Email Address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClassName}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3.5 7 L12 13 L20.5 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>
              {fieldErrors.email && <p className="mt-1.5 text-sm text-danger">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Password *"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClassName}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                {/* Typing a password on a tablet's on-screen keyboard is easy to get wrong and
                    impossible to check — so it can be revealed, on the device holding it. */}
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground/45 transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                    {!showPassword && (
                      <path d="M4 20 L20 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    )}
                  </svg>
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-sm text-danger">{fieldErrors.password}</p>}
            </div>

            {formError && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="mx-auto mt-3 px-12">
              {isSubmitting ? "Signing in…" : "Login"}
            </Button>
          </form>

              <button
                type="button"
                onClick={() => setIsRedeeming(true)}
                className="mt-5 w-full text-center text-sm text-primary hover:underline"
              >
                Have a reset code?
              </button>
            </>
          )}

          {/*
            Nothing below the button by design. There is no "Forgot Password?", no "Sign in with
            Google" and no "Create an account" — none of the three exists: password resets are done
            by an Owner from Users, the API accepts email and password only, and accounts are handed
            out rather than self-registered, so who can sign in stays a decision the shop makes.

            The /register route is still deliberately routable — it is how the first Owner account is
            created on a fresh database, when nobody exists yet to grant access.
          */}
        </div>
      </div>

      {/* Over the page background on a narrow screen, over the light left panel on a wide one — so
          on lg it needs an explicit dark, not the theme's foreground, which is near-white in dark
          mode and would vanish against the panel. */}
      <footer className="relative shrink-0 px-5 pb-5 text-center text-xs text-foreground/60 lg:text-black/55">
        © {new Date().getFullYear()} Mathilens Tailoring ERP. All rights reserved.
      </footer>
    </main>
  );
}
