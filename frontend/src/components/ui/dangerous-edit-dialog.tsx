'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Shield,
  Clock,
  DollarSign,
  Package
} from 'lucide-react'

interface DangerousEditValidation {
  isValid: boolean
  hasWarnings: boolean
  requiresConfirmation: boolean
  restrictions: Array<{
    field: string
    rule: string
    message: string
    currentValue: any
    attemptedValue: any
    stockQuantity?: number
    unit?: string
  }>
  warnings: Array<{
    field: string
    message: string
    impact: string
  }>
  confirmationRequired: Array<{
    field: string
    rule: string
    message: string
    details: any
    requiresReason: boolean
    severity: 'low' | 'medium' | 'high'
  }>
  summary: {
    restrictedFields: string[]
    warningFields: string[]
    confirmationFields: string[]
    totalIssues: number
  }
}

interface DangerousEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validation: DangerousEditValidation | null
  onConfirm: (reasons: Record<string, string>) => void
  onCancel: () => void
  loading?: boolean
}

export function DangerousEditDialog({
  open,
  onOpenChange,
  validation,
  onConfirm,
  onCancel,
  loading = false
}: DangerousEditDialogProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})

  if (!validation) return null

  const handleReasonChange = (field: string, reason: string) => {
    setReasons(prev => ({
      ...prev,
      [field]: reason
    }))
  }

  const toggleDetails = (field: string) => {
    setShowDetails(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const canConfirm = validation.confirmationRequired
    .filter(c => c.requiresReason)
    .every(c => reasons[c.field]?.trim().length >= 10)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4 text-red-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <AlertCircle className="h-4 w-4 text-blue-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'purchasePrice':
      case 'sellingPrice':
        return <DollarSign className="h-4 w-4" />
      case 'stockQuantity':
        return <Package className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            Dangerous Edit Detected
          </DialogTitle>
          <DialogDescription>
            This edit contains changes that require special attention and confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Edit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {validation.restrictions.length}
                  </div>
                  <div className="text-muted-foreground">Blocked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {validation.confirmationRequired.length}
                  </div>
                  <div className="text-muted-foreground">Requires Confirmation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validation.warnings.length}
                  </div>
                  <div className="text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {validation.summary.totalIssues}
                  </div>
                  <div className="text-muted-foreground">Total Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restrictions (Blocking) */}
          {validation.restrictions.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Blocked Changes (Cannot Proceed)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {validation.restrictions.map((restriction, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-red-800">
                          {restriction.field === 'company' ? 'Company Change Blocked' : 'Thickness Change Blocked'}
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          {restriction.message}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span>
                            <strong>Current:</strong> {restriction.currentValue}
                          </span>
                          <span>
                            <strong>Attempted:</strong> {restriction.attemptedValue}
                          </span>
                          {restriction.stockQuantity && (
                            <span>
                              <strong>Stock:</strong> {restriction.stockQuantity} {restriction.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Confirmations Required */}
          {validation.confirmationRequired.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Changes Requiring Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validation.confirmationRequired.map((confirmation, index) => (
                  <div key={index} className="space-y-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(confirmation.severity)}
                          {getFieldIcon(confirmation.field)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-yellow-800">
                              {confirmation.field === 'purchasePrice' ? 'Purchase Price Change' :
                               confirmation.field === 'sellingPrice' ? 'Selling Price Change' :
                               confirmation.field === 'stockQuantity' ? 'Manual Stock Adjustment' :
                               confirmation.field}
                            </span>
                            <Badge variant={getSeverityColor(confirmation.severity)} className="text-xs">
                              {confirmation.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-yellow-700 mt-1">
                            {confirmation.message}
                          </div>
                          
                          {/* Details Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDetails(confirmation.field)}
                            className="mt-2 h-6 px-2 text-xs"
                          >
                            {showDetails[confirmation.field] ? 'Hide Details' : 'Show Details'}
                          </Button>
                          
                          {/* Detailed Information */}
                          {showDetails[confirmation.field] && confirmation.details && (
                            <div className="mt-3 p-2 bg-white border rounded text-xs space-y-1">
                              {Object.entries(confirmation.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reason Input */}
                    {confirmation.requiresReason && (
                      <div className="space-y-2">
                        <Label htmlFor={`reason-${confirmation.field}`} className="text-sm font-medium">
                          Reason for {confirmation.field} change *
                        </Label>
                        <Textarea
                          id={`reason-${confirmation.field}`}
                          placeholder={`Explain why you are changing ${confirmation.field}... (minimum 10 characters)`}
                          value={reasons[confirmation.field] || ''}
                          onChange={(e) => handleReasonChange(confirmation.field, e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="text-xs text-muted-foreground">
                          {reasons[confirmation.field]?.length || 0}/10 characters minimum
                        </div>
                      </div>
                    )}

                    {index < validation.confirmationRequired.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="font-medium text-blue-800">{warning.message}</div>
                    <div className="text-blue-700 text-xs mt-1">{warning.impact}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          {validation.isValid && validation.requiresConfirmation && (
            <Button
              onClick={() => onConfirm(reasons)}
              disabled={!canConfirm || loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? 'Processing...' : 'Confirm Changes'}
            </Button>
          )}
          {!validation.isValid && (
            <Button disabled className="bg-red-600">
              Cannot Proceed
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}