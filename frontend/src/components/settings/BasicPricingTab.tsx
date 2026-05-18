'use client'

import { useState } from 'react'
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
  DollarSign,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface GlassPricing {
  id: string
  thickness: string
  quality: string
  pricePerSqFt: number
  effectiveDate: string
  isActive: boolean
}

export default function BasicPricingTab() {
  const [pricings, setPricings] = useState<GlassPricing[]>([
    {
      id: '1',
      thickness: '3mm',
      quality: 'Local',
      pricePerSqFt: 45,
      effectiveDate: '2025-01-01',
      isActive: true
    },
    {
      id: '2',
      thickness: '4mm',
      quality: 'Local',
      pricePerSqFt: 55,
      effectiveDate: '2025-01-01',
      isActive: true
    },
    {
      id: '3',
      thickness: '5mm',
      quality: 'Imported',
      pricePerSqFt: 85,
      effectiveDate: '2025-01-01',
      isActive: true
    }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [newPricing, setNewPricing] = useState({
    thickness: '',
    quality: '',
    pricePerSqFt: 0,
    effectiveDate: new Date().toISOString().split('T')[0]
  })

  const thicknessOptions = ['3mm', '4mm', '5mm', '6mm']
  const qualityOptions = ['Local', 'Imported']

  const handleAddPricing = async () => {
    if (!newPricing.thickness || !newPricing.quality || newPricing.pricePerSqFt <= 0) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newItem: GlassPricing = {
        id: Date.now().toString(),
        thickness: newPricing.thickness,
        quality: newPricing.quality,
        pricePerSqFt: newPricing.pricePerSqFt,
        effectiveDate: newPricing.effectiveDate,
        isActive: true
      }
      
      setPricings(prev => [...prev, newItem])
      setMessage({ type: 'success', text: 'Glass pricing added successfully' })
      setNewPricing({
        thickness: '',
        quality: '',
        pricePerSqFt: 0,
        effectiveDate: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add glass pricing' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePricing = async (id: string) => {
    setLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setPricings(prev => prev.filter(p => p.id !== id))
      setMessage({ type: 'success', text: 'Glass pricing deleted successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete glass pricing' })
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
            Add New Glass Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thickness">Thickness</Label>
              <select
                id="thickness"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPricing.thickness}
                onChange={(e) => setNewPricing(prev => ({ ...prev, thickness: e.target.value }))}
              >
                <option value="">Select thickness</option>
                {thicknessOptions.map(thickness => (
                  <option key={thickness} value={thickness}>{thickness}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <select
                id="quality"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPricing.quality}
                onChange={(e) => setNewPricing(prev => ({ ...prev, quality: e.target.value }))}
              >
                <option value="">Select quality</option>
                {qualityOptions.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerSqFt">Price per Sq Ft</Label>
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
              <Label htmlFor="effectiveDate">Effective Date</Label>
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
            {loading ? 'Adding...' : 'Add Pricing'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Pricing List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Glass Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thickness</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Price per Sq Ft</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricings.map((pricing) => (
                  <TableRow key={pricing.id}>
                    <TableCell className="font-medium">{pricing.thickness}</TableCell>
                    <TableCell>{pricing.quality}</TableCell>
                    <TableCell className="font-semibold">৳{pricing.pricePerSqFt}</TableCell>
                    <TableCell>{new Date(pricing.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={pricing.isActive ? 'default' : 'secondary'}>
                        {pricing.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePricing(pricing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No glass pricing configured yet
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