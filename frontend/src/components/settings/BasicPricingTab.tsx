'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Alert,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'
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
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Glass Pricing
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Select
                id="thickness"
                label="Thickness"
                placeholder="Select thickness"
                selectedKeys={newPricing.thickness ? [newPricing.thickness] : []}
                onSelectionChange={(keys) => setNewPricing(prev => ({ ...prev, thickness: Array.from(keys)[0] as string }))}
              >
                {thicknessOptions.map(thickness => (
                  <SelectItem key={thickness}>{thickness}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Select
                id="quality"
                label="Quality"
                placeholder="Select quality"
                selectedKeys={newPricing.quality ? [newPricing.quality] : []}
                onSelectionChange={(keys) => setNewPricing(prev => ({ ...prev, quality: Array.from(keys)[0] as string }))}
              >
                {qualityOptions.map(quality => (
                  <SelectItem key={quality}>{quality}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Input
                id="pricePerSqFt"
                type="number"
                step="0.01"
                label="Price per Sq Ft"
                value={String(newPricing.pricePerSqFt)}
                onChange={(e) => setNewPricing(prev => ({ ...prev, pricePerSqFt: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="effectiveDate"
                type="date"
                label="Effective Date"
                value={newPricing.effectiveDate}
                onChange={(e) => setNewPricing(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>
          </div>

          <Button color="primary" onPress={handleAddPricing} isDisabled={loading} startContent={<Plus className="h-4 w-4" />}>
            {loading ? 'Adding...' : 'Add Pricing'}
          </Button>
        </CardBody>
      </Card>

      {/* Current Pricing List */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Glass Pricing
          </h3>
        </CardHeader>
        <CardBody>
          {pricings.length > 0 ? (
            <Table aria-label="Current glass pricing table">
              <TableHeader>
                <TableColumn>Thickness</TableColumn>
                <TableColumn>Quality</TableColumn>
                <TableColumn>Price per Sq Ft</TableColumn>
                <TableColumn>Effective Date</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {pricings.map((pricing) => (
                  <TableRow key={pricing.id}>
                    <TableCell className="font-medium">{pricing.thickness}</TableCell>
                    <TableCell>{pricing.quality}</TableCell>
                    <TableCell className="font-semibold">৳{pricing.pricePerSqFt}</TableCell>
                    <TableCell>{new Date(pricing.effectiveDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={pricing.isActive ? 'primary' : 'default'} variant="flat">
                        {pricing.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="bordered" isIconOnly>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="bordered"
                          isIconOnly
                          onPress={() => handleDeletePricing(pricing.id)}
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
        </CardBody>
      </Card>

      {/* Messages */}
      {message && (
        <Alert
          color={message.type === 'error' ? 'danger' : 'default'}
          description={message.text}
          icon={message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        />
      )}
    </div>
  )
}