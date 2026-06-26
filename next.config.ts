import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/orders",
        destination: "/dashboard/order-management/orders",
        permanent: false,
      },
      {
        source: "/dashboard/orders/create",
        destination: "/dashboard/order-management/orders/create",
        permanent: false,
      },
      {
        source: "/dashboard/orders/sold-items",
        destination: "/dashboard/order-management/orders/sold-items",
        permanent: false,
      },
      {
        source: "/dashboard/orders/:id",
        destination: "/dashboard/order-management/orders/:id",
        permanent: false,
      },
      {
        source: "/dashboard/pos/orders",
        destination: "/dashboard/order-management/pos/orders",
        permanent: false,
      },
      {
        source: "/dashboard/pos/orders/create",
        destination: "/dashboard/order-management/pos/orders/create",
        permanent: false,
      },
      {
        source: "/dashboard/credit-orders",
        destination: "/dashboard/order-management/credit-orders",
        permanent: false,
      },
      {
        source: "/dashboard/credit-accounts",
        destination: "/dashboard/order-management/credit-accounts",
        permanent: false,
      },
      {
        source: "/dashboard/credit-accounts/:id",
        destination: "/dashboard/order-management/credit-accounts/:id",
        permanent: false,
      },
      {
        source: "/dashboard/catering/packages",
        destination: "/dashboard/order-management/catering/packages",
        permanent: false,
      },
      {
        source: "/dashboard/catering/package-orders",
        destination: "/dashboard/order-management/catering/package-orders",
        permanent: false,
      },
      {
        source: "/dashboard/catering/package-orders/create",
        destination: "/dashboard/order-management/catering/package-orders/create",
        permanent: false,
      },
      {
        source: "/dashboard/catering/package-orders/:id",
        destination: "/dashboard/order-management/catering/package-orders/:id",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
