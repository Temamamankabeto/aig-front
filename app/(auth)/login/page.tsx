"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UtensilsCrossed } from "lucide-react";
import { BarChart3, ClipboardList, Coffee, CreditCard, ShoppingCart, Truck, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth/auth.service";

const roleIcons = [
  ShoppingCart,
  Coffee,
  Warehouse,
  CreditCard,
  ClipboardList,
  Truck,
  BarChart3,
];

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
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
        {/* Ambient role-icon pattern — every role that signs in here */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-10 p-10 opacity-[0.08]">
          {Array.from({ length: 16 }).map((_, i) => {
            const Icon = roleIcons[i % roleIcons.length];
            return <Icon key={i} className="h-10 w-10 text-primary-foreground" strokeWidth={1.25} />;
          })}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/95 to-primary/80" />

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
        </div>

        <div className="relative z-10 px-14 pb-12 text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} AIG Cafeteria & Restaurant
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 lg:hidden">
              <UtensilsCrossed className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in with your email or phone number to continue.
            </p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-5">
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
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}