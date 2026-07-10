"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Coffee,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth/auth.service";

// What the platform actually does for the people signing in — kept short,
// specific, and tied to real roles rather than decorative icon noise.
const capabilities = [
  {
    icon: Coffee,
    title: "Point of sale",
    description: "Ring up orders across every counter in seconds",
  },
  {
    icon: Warehouse,
    title: "Inventory",
    description: "Track stock and ingredients as they move",
  },
  {
    icon: ClipboardList,
    title: "Staff scheduling",
    description: "Keep every shift covered, kitchen to register",
  },
  {
    icon: BarChart3,
    title: "Reporting",
    description: "See sales and performance the moment they happen",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({ login, password });
      authService.saveSession(response);
      toast.success("Logged in successfully");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-background">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" strokeWidth={1.75} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-primary-foreground">
              AIG Cafeteria
            </span>
          </div>

          <h1 className="mt-10 max-w-md text-4xl font-semibold leading-tight tracking-tight text-primary-foreground">
            Serving Quality, Inspiring Every Day
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            One platform for every counter, kitchen, and back office across
            AIG Cafeteria & Restaurant.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-7">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Icon className="h-4.5 w-4.5 text-primary-foreground/90" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-foreground">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-primary-foreground/60">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 px-14 pb-12 text-xs text-primary-foreground/50">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>© {new Date().getFullYear()} AIG Cafeteria & Restaurant. All rights reserved.</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 lg:hidden">
              <UtensilsCrossed className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in with your email or phone number to continue
            </p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="login">Email or phone number</Label>
                  <Input
                    id="login"
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="you@example.com"
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:text-left">
            Having trouble signing in? Contact your system administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
