import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Package,
  Users,
  CreditCard
} from "lucide-react"

// Standardized status colors and meanings
export type StatusType = 
  | 'paid' 
  | 'partial' 
  | 'due' 
  | 'pending'
  | 'active' 
  | 'inactive'
  | 'in-stock'
  | 'low-stock'
  | 'out-of-stock'
  | 'good'
  | 'warning'
  | 'critical'
  | 'blocked'

interface StatusBadgeProps {
  status: StatusType
  text?: string
  showIcon?: boolean
  size?: 'sm' | 'default' | 'lg'
  animate?: boolean
  className?: string
}

const statusConfig: Record<StatusType, {
  variant: string
  icon: React.ComponentType<{ className?: string }>
  defaultText: string
  className: string
}> = {
  // Payment Status
  paid: {
    variant: 'default',
    icon: CheckCircle,
    defaultText: 'Paid',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  },
  partial: {
    variant: 'default',
    icon: AlertCircle,
    defaultText: 'Partial',
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
  },
  due: {
    variant: 'default',
    icon: XCircle,
    defaultText: 'Due',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  },
  pending: {
    variant: 'default',
    icon: Clock,
    defaultText: 'Pending',
    className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
  },
  
  // General Status
  active: {
    variant: 'default',
    icon: CheckCircle,
    defaultText: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  },
  inactive: {
    variant: 'default',
    icon: XCircle,
    defaultText: 'Inactive',
    className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
  },
  
  // Stock Status
  'in-stock': {
    variant: 'default',
    icon: CheckCircle,
    defaultText: 'In Stock',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  },
  'low-stock': {
    variant: 'default',
    icon: AlertTriangle,
    defaultText: 'Low Stock',
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
  },
  'out-of-stock': {
    variant: 'default',
    icon: XCircle,
    defaultText: 'Out of Stock',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  },
  
  // Risk Status
  good: {
    variant: 'default',
    icon: CheckCircle,
    defaultText: 'Good',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  },
  warning: {
    variant: 'default',
    icon: AlertTriangle,
    defaultText: 'Warning',
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
  },
  critical: {
    variant: 'default',
    icon: AlertTriangle,
    defaultText: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  },
  blocked: {
    variant: 'default',
    icon: XCircle,
    defaultText: 'Blocked',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  }
}

export function StatusBadge({ 
  status, 
  text, 
  showIcon = true, 
  size = 'default',
  animate = false,
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayText = text || config.defaultText
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  }

  return (
    <Badge 
      className={cn(
        config.className,
        sizeClasses[size],
        animate && (status === 'critical' || status === 'out-of-stock' || status === 'blocked') && 'animate-pulse',
        'font-medium border',
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {displayText}
    </Badge>
  )
}