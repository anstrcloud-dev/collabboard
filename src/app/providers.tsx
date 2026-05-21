"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { useState } from "react"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    < SessionProvider refetchOnWindowFocus={true} refetchInterval={0}
    // refetchOnWindowFocus — re-checks session when switching browser tabs
    // refetchInterval — 0 means don't poll on a timer, only check on focus 
    >

      {/* QueryClientProvider — makes useQuery() and TanStack Query available everywhere */}
      < QueryClientProvider client={queryClient} >
        {children}
      </QueryClientProvider >
    </SessionProvider >
  )
}