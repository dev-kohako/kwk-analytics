"use client";

import { ApolloProvider } from "@apollo/client/react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { createApolloClient } from "../lib/apollo/client";
import Link from "next/link";

export function Providers({ children }: { children: React.ReactNode }) {
  const client = createApolloClient();

  return (
    <ApolloProvider client={client}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ApolloProvider>
  );
}
