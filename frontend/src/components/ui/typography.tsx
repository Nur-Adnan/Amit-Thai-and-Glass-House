import * as React from "react"
import { cn } from "@/lib/utils"

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function TypographyH1({ className, children, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function TypographyH2({ className, children, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function TypographyH3({ className, children, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function TypographyH4({ className, children, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  )
}

export function TypographyP({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function TypographyBlockquote({ className, children, ...props }: TypographyProps) {
  return (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    >
      {children}
    </blockquote>
  )
}

export function TypographyList({ className, children, ...props }: TypographyProps) {
  return (
    <ul
      className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    >
      {children}
    </ul>
  )
}

export function TypographyInlineCode({ className, children, ...props }: TypographyProps) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </code>
  )
}

export function TypographyLead({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-xl text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function TypographyLarge({ className, children, ...props }: TypographyProps) {
  return (
    <div
      className={cn("text-lg font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function TypographySmall({ className, children, ...props }: TypographyProps) {
  return (
    <small
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
    </small>
  )
}

export function TypographyMuted({ className, children, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

// Number display components for BD market
export function CurrencyDisplay({ 
  amount, 
  size = "base", 
  className, 
  ...props 
}: { 
  amount: number
  size?: "sm" | "base" | "lg" | "xl" | "2xl"
} & React.HTMLAttributes<HTMLSpanElement>) {
  const sizeClasses = {
    sm: "text-number-sm",
    base: "text-number-base", 
    lg: "text-number-lg",
    xl: "text-number-xl",
    "2xl": "text-number-2xl"
  }
  
  return (
    <span
      className={cn(
        "currency-display",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      ৳{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

export function NumberDisplay({ 
  value, 
  size = "base", 
  className, 
  ...props 
}: { 
  value: number
  size?: "sm" | "base" | "lg" | "xl" | "2xl"
} & React.HTMLAttributes<HTMLSpanElement>) {
  const sizeClasses = {
    sm: "text-number-sm",
    base: "text-number-base", 
    lg: "text-number-lg",
    xl: "text-number-xl",
    "2xl": "text-number-2xl"
  }
  
  return (
    <span
      className={cn(
        "number-display",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {value.toLocaleString('en-US')}
    </span>
  )
}

export function PercentageDisplay({ 
  value, 
  size = "base", 
  className, 
  showSign = false,
  ...props 
}: { 
  value: number
  size?: "sm" | "base" | "lg" | "xl" | "2xl"
  showSign?: boolean
} & React.HTMLAttributes<HTMLSpanElement>) {
  const sizeClasses = {
    sm: "text-number-sm",
    base: "text-number-base", 
    lg: "text-number-lg",
    xl: "text-number-xl",
    "2xl": "text-number-2xl"
  }
  
  const colorClass = value > 0 ? "number-positive" : value < 0 ? "number-negative" : "number-display"
  
  return (
    <span
      className={cn(
        colorClass,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showSign && value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}