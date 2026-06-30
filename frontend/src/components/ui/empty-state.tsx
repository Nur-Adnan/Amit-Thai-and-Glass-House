import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@heroui/react"

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  className?: string
}

// Maps the legacy shadcn-style action variant to HeroUI Button props.
const actionVariant: Record<
  NonNullable<EmptyStateProps["action"]>["variant"] & string,
  { color?: "default" | "primary"; variant?: "solid" | "bordered" | "flat" }
> = {
  default: { color: "primary", variant: "solid" },
  outline: { variant: "bordered" },
  secondary: { variant: "flat" },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const btn = action ? actionVariant[action.variant || "default"] : undefined

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      <div className="mb-4 p-4 rounded-full bg-muted/50">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onPress={action.onClick} color={btn?.color} variant={btn?.variant}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
