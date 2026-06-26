import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

const ROUTE_ROLE_RULES: Array<{ prefixes: string[]; roles: string[] }> = [
  {
    prefixes: ["/packages", "/dashboard/packages"],
    roles: ["Admin", "General Admin", "General Administrator"],
  },
  {
    prefixes: ["/package-orders", "/dashboard/package-orders"],
    roles: ["Manager", "Cafeteria Manager", "Admin", "General Admin", "General Administrator"],
  },
  {
    prefixes: ["/package-payments", "/dashboard/package-payments"],
    roles: ["Finance", "Finance Manager", "Cashier", "Admin", "General Admin", "General Administrator"],
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function parseRoles(raw?: string) {
  if (!raw) return [];

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);

    if (Array.isArray(parsed)) return parsed.map((role) => String(role));
    if (typeof parsed === "string") return [parsed];
  } catch {
    // fallback below
  }

  return raw
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
}

function hasAllowedRole(userRoles: string[], allowedRoles: string[]) {
  const normalizedUserRoles = userRoles.map(normalize);
  return allowedRoles.some((role) =>
    normalizedUserRoles.includes(normalize(role))
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const matchedRule = ROUTE_ROLE_RULES.find((rule) =>
    rule.prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  const rolesCookie =
    request.cookies.get("roles")?.value ||
    request.cookies.get("role")?.value;

  const userRoles = parseRoles(rolesCookie);

  // Now roles are saved to cookies during login.
  // If roles are missing, redirect to login instead of silently allowing access.
  if (userRoles.length === 0) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!hasAllowedRole(userRoles, matchedRule.roles)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/packages/:path*",
    "/package-orders/:path*",
    "/package-payments/:path*",
    "/dashboard/packages/:path*",
    "/dashboard/package-orders/:path*",
    "/dashboard/package-payments/:path*",
  ],
};