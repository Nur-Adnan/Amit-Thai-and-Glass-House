'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

interface GlassPricing {
  _id: string
  thickness: string
  quality: string
  pricePerSqFt: number
  effectiveDate: string
  isActive: boolean
  createdAt: string
}

export default function PricingTab() {
  const [pricings, setPricings] = useState<GlassPricing[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingPricing, setEditingPricing] = useState<GlassPricing | null>(null)
  const [newPricing, setNewPricing] = useState({
    thickness: '',
    quality: '',
    pricePerSqFt: 0,
    effectiveDate: new Date().toISOString().split('T')[0]
  })

  const { t: globalT } = useLanguage()
  
  // Local translation helper for pricing
  const t = (key: string, fallback: string) => {
    // For now, just return the fallback since we don't have these keys in the main translations
    return fallback
  }
  const { formatCurrency, formatDate } = useFormatting()

  const thicknessOptions = ['3mm', '4mm', '5mm', '6mm']
  const qualityOptions = ['Local', 'Imported']

  useEffect(() => {
    fetchPricings()
  }, [])

  const fetchPricings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/calculator/glass-pricing', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPricings(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching glass pricing:', error)
    }
  }

  const handleAddPricing = async () => {
    if (!newPricing.thickness || !newPricing.quality || newPricing.pricePerSqFt <= 0) {
      setMessage({ type: 'error', text: t('settings.pricing.fillAllFields', 'Please fill all fields') })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/calculator/glass-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPricing)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.pricing.addSuccess', 'Glass pricing added successfully') })
        setNewPricing({
          thickness: '',
          quality: '',
          pricePerSqFt: 0,
          effectiveDate: new Date().toISOString().split('T')[0]
        })
        fetchPricings()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.pricing.addError', 'Failed to add glass pricing') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.pricing.addError', 'Failed to add glass pricing') })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePricing = async () => {
    if (!editingPricing) return

    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/calculator/glass-pricing/${editingPricing._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pricePerSqFt: editingPricing.pricePerSqFt,
          effectiveDate: editingPricing.effectiveDate
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.pricing.updateSuccess', 'Glass pricing updated successfully') })
        setEditingPricing(null)
        fetchPricings()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.pricing.updateError', 'Failed to update glass pricing') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.pricing.updateError', 'Failed to update glass pricing') })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePricing = async (id: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/calculator/glass-pricing/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.pricing.deleteSuccess', 'Glass pricing deleted successfully') })
        fetchPricings()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.pricing.deleteError', 'Failed to delete glass pricing') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.pricing.deleteError', 'Failed to delete glass pricing') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('settings.pricing.addNew', 'Add New Glass Pricing')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thickness">{t('settings.pricing.thickness', 'Thickness')}</Label>
              <select
                id="thickness"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPricing.thickness}
                onChange={(e) => setNewPricing(prev => ({ ...prev, thickness: e.target.value }))}
              >
                <option value="">{t('settings.pricing.selectThickness', 'Select thickness')}</option>
                {thicknessOptions.map(thickness => (
                  <option key={thickness} value={thickness}>{thickness}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">{t('settings.pricing.quality', 'Quality')}</Label>
              <select
                id="quality"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPricing.quality}
                onChange={(e) => setNewPricing(prev => ({ ...prev, quality: e.target.value }))}
              >
                <option value="">{t('settings.pricing.selectQuality', 'Select quality')}</option>
                {qualityOptions.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerSqFt">{t('settings.pricing.pricePerSqFt', 'Price per Sq Ft')}</Label>
              <Input
                id="pricePerSqFt"
                type="number"
                step="0.01"
                value={newPricing.pricePerSqFt}
                onChange={(e) => setNewPricing(prev => ({ ...prev, pricePerSqFt: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">{t('settings.pricing.effectiveDate', 'Effective Date')}</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={newPricing.effectiveDate}
                onChange={(e) => setNewPricing(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleAddPricing} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            {loading ? t('common.adding', 'Adding...') : t('settings.pricing.addPricing', 'Add Pricing')}
          </Button>
        </CardContent>
      </Card>

      {/* Current Pricing List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('settings.pricing.currentPricing', 'Current Glass Pricing')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('settings.pricing.thickness', 'Thickness')}</TableHead>
                  <TableHead>{t('settings.pricing.quality', 'Quality')}</TableHead>
                  <TableHead>{t('settings.pricing.pricePerSqFt', 'Price per Sq Ft')}</TableHead>
                  <TableHead>{t('settings.pricing.effectiveDate', 'Effective Date')}</TableHead>
                  <TableHead>{t('settings.pricing.status', 'Status')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricings.map((pricing) => (
                  <TableRow key={pricing._id}>
                    <TableCell className="font-medium">{pricing.thickness}</TableCell>
                    <TableCell>{pricing.quality}</TableCell>
                    <TableCell className="font-semibold">
                      {editingPricing?._id === pricing._id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingPricing.pricePerSqFt}
                          onChange={(e) => setEditingPricing(prev => prev ? { ...prev, pricePerSqFt: parseFloat(e.target.value) || 0 } : null)}
                          className="w-24"
                        />
                      ) : (
                        formatCurrency(pricing.pricePerSqFt)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPricing?._id === pricing._id ? (
                        <Input
                          type="date"
                          value={editingPricing.effectiveDate.split('T')[0]}
                          onChange={(e) => setEditingPricing(prev => prev ? { ...prev, effectiveDate: e.target.value } : null)}
                          className="w-36"
                        />
                      ) : (
                        formatDate(new Date(pricing.effectiveDate))
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pricing.isActive ? 'default' : 'secondary'}>
                        {pricing.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingPricing?._id === pricing._id ? (
                          <>
                            <Button size="sm" onClick={handleUpdatePricing} disabled={loading}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingPricing(null)}>
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPricing(pricing)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('settings.pricing.deleteConfirm', 'Delete Glass Pricing')}</DialogTitle>
                                  <DialogDescription>
                                    {t('settings.pricing.deleteWarning', 'Are you sure you want to delete this glass pricing? This action cannot be undone.')}
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline">{t('common.cancel', 'Cancel')}</Button>
                                  <Button variant="destructive" onClick={() => handleDeletePricing(pricing._id)}>
                                    {t('common.delete', 'Delete')}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.pricing.noPricing', 'No glass pricing configured yet')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}