import * as React from "react"
import { cn } from "@/lib/utils"

// NOTE: HeroUI's <Table> is a controlled, column-model component and does not fit
// this freeform wrapper API (arbitrary row highlighting, per-row onClick, custom
// cells). Per the design system rules, this is a custom component that matches
// HeroUI's visual language (rounded card surface, muted header, hover rows) built
// on semantic HTML. Simple/standard tables elsewhere use HeroUI's <Table> directly.

// Semantic table primitives (HeroUI-styled) — replace the former shadcn re-exports.
export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
))
Table.displayName = "Table"

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"

// Standardized table header cell
interface ProfessionalTableHeaderProps {
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function ProfessionalTableHeader({
  icon: Icon,
  children,
  className,
  align = 'left',
}: ProfessionalTableHeaderProps) {
  const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' }

  return (
    <th className={cn(
      "h-12 px-4 align-middle font-semibold text-muted-foreground bg-muted/30",
      alignClasses[align],
      className
    )}>
      <div className={cn(
        "flex items-center gap-2",
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end'
      )}>
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </div>
    </th>
  )
}

// Professional table wrapper with consistent styling
interface ProfessionalTableProps {
  children: React.ReactNode
  className?: string
}

export function ProfessionalTable({ children, className }: ProfessionalTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table className={className}>
        {children}
      </Table>
    </div>
  )
}

// Professional table row with hover effects
interface ProfessionalTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
  className?: string
  highlight?: 'none' | 'warning' | 'danger' | 'success'
  onClick?: () => void
}

export function ProfessionalTableRow({
  children,
  className,
  highlight = 'none',
  onClick,
  ...props
}: ProfessionalTableRowProps) {
  const highlightClasses = {
    none: '',
    warning: 'bg-orange-50 border-l-4 border-l-orange-500',
    danger: 'bg-red-50 border-l-4 border-l-red-500',
    success: 'bg-green-50 border-l-4 border-l-green-500',
  }

  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-muted/50",
        highlightClasses[highlight],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
}

// Professional table cell with consistent padding
interface ProfessionalTableCellProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function ProfessionalTableCell({
  children,
  className,
  align = 'left',
}: ProfessionalTableCellProps) {
  const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' }

  return (
    <td className={cn("p-4 align-middle", alignClasses[align], className)}>
      {children}
    </td>
  )
}
