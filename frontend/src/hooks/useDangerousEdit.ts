'use client'

import { API_BASE } from '@/lib/apiBase'
import { useState } from 'react'

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

interface UseDangerousEditOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useDangerousEdit(options: UseDangerousEditOptions = {}) {
  const [validation, setValidation] = useState<DangerousEditValidation | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{
    productId: string
    data: any
    endpoint: string
  } | null>(null)

  /**
   * Validate edit for dangerous changes
   */
  const validateEdit = async (productId: string, data: any) => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/products/${productId}/validate-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Validation failed')
      }

      return result.validation
    } catch (error) {
      console.error('Edit validation error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Attempt to update product with dangerous edit handling
   */
  const updateProduct = async (productId: string, data: any, endpoint: string = 'products') => {
    try {
      setLoading(true)

      // First, validate the edit
      const validationResult = await validateEdit(productId, data)
      
      // If there are restrictions, show dialog and block
      if (!validationResult.isValid) {
        setValidation(validationResult)
        setShowDialog(true)
        return { success: false, requiresDialog: true }
      }

      // If confirmation is required, show dialog
      if (validationResult.requiresConfirmation) {
        setValidation(validationResult)
        setPendingUpdate({ productId, data, endpoint })
        setShowDialog(true)
        return { success: false, requiresDialog: true }
      }

      // If no issues, proceed with normal update
      return await performUpdate(productId, data, endpoint)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      options.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Perform the actual update
   */
  const performUpdate = async (productId: string, data: any, endpoint: string, confirmed: boolean = false, reasons?: Record<string, string>) => {
    try {
      const token = localStorage.getItem('token')
      
      const updateData = confirmed ? {
        ...data,
        confirmDangerousEdit: true,
        reasons: reasons || {}
      } : data

      const response = await fetch(`${API_BASE}/api/${endpoint}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle dangerous edit response
        if (result.dangerousEdit) {
          setValidation(result)
          setShowDialog(true)
          return { success: false, requiresDialog: true }
        }
        throw new Error(result.message || 'Update failed')
      }

      options.onSuccess?.(result.data)
      return { success: true, data: result.data }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      options.onError?.(errorMessage)
      throw error
    }
  }

  /**
   * Handle confirmation from dialog
   */
  const handleConfirm = async (reasons: Record<string, string>) => {
    if (!pendingUpdate) return

    try {
      setLoading(true)
      
      const result = await performUpdate(
        pendingUpdate.productId,
        pendingUpdate.data,
        pendingUpdate.endpoint,
        true,
        reasons
      )

      if (result.success) {
        setShowDialog(false)
        setValidation(null)
        setPendingUpdate(null)
      }

      return result

    } catch (error) {
      console.error('Confirmed update error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle cancellation from dialog
   */
  const handleCancel = () => {
    setShowDialog(false)
    setValidation(null)
    setPendingUpdate(null)
    setLoading(false)
  }

  /**
   * Update stock with reason requirement
   */
  const updateStock = async (productId: string, quantity: number, operation: 'add' | 'subtract', reason: string) => {
    try {
      setLoading(true)

      if (!reason || reason.trim().length < 10) {
        throw new Error('Reason is required for stock adjustments (minimum 10 characters)')
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity,
          operation,
          reason: reason.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Stock update failed')
      }

      options.onSuccess?.(result.data)
      return { success: true, data: result.data }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stock update failed'
      options.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get dangerous edit history
   */
  const getEditHistory = async (productId: string, page: number = 1, limit: number = 10) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/products/${productId}/edit-history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch edit history')
      }

      return { success: true, data: result.data }

    } catch (error) {
      console.error('Edit history error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch edit history' }
    }
  }

  return {
    validation,
    showDialog,
    loading,
    validateEdit,
    updateProduct,
    updateStock,
    getEditHistory,
    handleConfirm,
    handleCancel,
    setShowDialog
  }
}