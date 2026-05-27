import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted-bg/80 ring-1 ring-border/50",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
