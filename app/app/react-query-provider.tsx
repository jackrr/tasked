"use client";

import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCacheInvalidator } from "@/app/components/cache-invalidator";

export default function ReactQueryProvider({
  children,
}: React.PropsWithChildren) {
  const [client] = React.useState(() => new QueryClient());
  useCacheInvalidator(client);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
