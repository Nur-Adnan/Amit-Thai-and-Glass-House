import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Standardized table header component
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
  align = 'left'
}: ProfessionalTableHeaderProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <TableHead className={cn(
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
    </TableHead>
  )
}

// Professional table wrapper with consistent styling
interface ProfessionalTableProps {
  children: React.ReactNode
  className?: string
}

export function ProfessionalTable({ children, className }: ProfessionalTableProps) {
  return (
    <div className="rounded-lg border bg-card">
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
    success: 'bg-green-50 border-l-4 border-l-green-500'
  }

  return (
    <TableRow 
      className={cn(
        "hover:bg-muted/50 transition-colors",
        highlightClasses[highlight],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </TableRow>
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
  align = 'left' 
}: ProfessionalTableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <TableCell className={cn(
      "p-4 align-middle",
      alignClasses[align],
      className
    )}>
      {children}
    </TableCell>
  )
}

export { Table, TableBody, TableHeader }