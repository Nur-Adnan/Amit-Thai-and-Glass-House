import * as React from "react"
import { Chip } from "@heroui/react"
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"

// Standardized status meanings mapped to HeroUI Chip colors (HeroUI-native)
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

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'

interface StatusBadgeProps {
  status: StatusType
  text?: string
  showIcon?: boolean
  size?: 'sm' | 'default' | 'lg'
  animate?: boolean
  className?: string
}

const statusConfig: Record<StatusType, {
  color: ChipColor
  icon: React.ComponentType<{ className?: string }>
  defaultText: string
}> = {
  // Payment Status
  paid: { color: 'success', icon: CheckCircle, defaultText: 'Paid' },
  partial: { color: 'warning', icon: AlertCircle, defaultText: 'Partial' },
  due: { color: 'danger', icon: XCircle, defaultText: 'Due' },
  pending: { color: 'default', icon: Clock, defaultText: 'Pending' },

  // General Status
  active: { color: 'success', icon: CheckCircle, defaultText: 'Active' },
  inactive: { color: 'default', icon: XCircle, defaultText: 'Inactive' },

  // Stock Status
  'in-stock': { color: 'success', icon: CheckCircle, defaultText: 'In Stock' },
  'low-stock': { color: 'warning', icon: AlertTriangle, defaultText: 'Low Stock' },
  'out-of-stock': { color: 'danger', icon: XCircle, defaultText: 'Out of Stock' },

  // Risk Status
  good: { color: 'success', icon: CheckCircle, defaultText: 'Good' },
  warning: { color: 'warning', icon: AlertTriangle, defaultText: 'Warning' },
  critical: { color: 'danger', icon: AlertTriangle, defaultText: 'Critical' },
  blocked: { color: 'danger', icon: XCircle, defaultText: 'Blocked' },
}

export function StatusBadge({
  status,
  text,
  showIcon = true,
  size = 'default',
  animate = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayText = text || config.defaultText
  const chipSize: 'sm' | 'md' | 'lg' = size === 'default' ? 'md' : size
  const pulse =
    animate && (status === 'critical' || status === 'out-of-stock' || status === 'blocked')

  return (
    <Chip
      color={config.color}
      variant="flat"
      size={chipSize}
      className={[pulse ? 'animate-pulse' : '', className ?? ''].filter(Boolean).join(' ') || undefined}
      startContent={showIcon ? <Icon className="h-3 w-3" /> : undefined}
    >
      {displayText}
    </Chip>
  )
}
