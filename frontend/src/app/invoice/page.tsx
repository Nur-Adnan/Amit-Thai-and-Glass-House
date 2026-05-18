'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Plus, 
  Trash2, 
  Receipt, 
  User, 
  Phone, 
  MapPin,
  Calculator,
  CreditCard,
  FileText
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'

// Helper function to format variant information consistently
const formatVariantInfo = (item: InvoiceItem) => {
  if (!item.materialType || !item.company) {
    return null;
  }
  
  const parts = [item.materialType, item.company];
  if (item.thicknessMM) parts.push(`${item.thicknessMM}mm`);
  if (item.quality) parts.push(item.quality);
  
  return {
    display: parts.join(' - '),
    materialType: item.materialType,
    company: item.company,
    thickness: item.thicknessMM ? `${item.thicknessMM}mm` : null,
    quality: item.quality,
    sizeInfo: item.calculatedArea ? `Area: ${item.calculatedArea} ${item.unit}` : null
  };
};

interface InvoiceItem {
  id: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  description?: string
  // Variant tracking fields
  materialType?: string
  company?: string
  thicknessMM?: number
  quality?: string
  measurementType?: string
  calculatedArea?: number
}

interface Customer {
  name: string
  phone: string
  address: string
}

export default function InvoicePage() {
  // Customer Information
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    address: ''
  })

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([])
  
  // Invoice Details
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

  const { t } = useLanguage()
  const { formatCurrency, formatNumber } = useFormatting()

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal()
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100
    }
    return discount
  }

  const calculateGrandTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount()
  }

  const calculateDueAmount = () => {
    return Math.max(0, calculateGrandTotal() - paidAmount)
  }

  const getPaymentStatus = () => {
    const grandTotal = calculateGrandTotal()
    const due = calculateDueAmount()
    
    if (due === 0) return 'paid'
    if (paidAmount > 0) return 'partial'
    return 'due'
  }

  // Item Management
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      quantity: 1,
      unit: 'sqft',
      unitPrice: 0,
      totalPrice: 0,
      description: ''
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    setDeleteItemId(null)
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const handleCreateInvoice = async () => {
    if (!customer.name || items.length === 0) {
      alert('Please fill in customer name and add at least one item')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Invoice created successfully!')
      
      // Reset form
      setCustomer({ name: '', phone: '', address: '' })
      setItems([])
      setDiscount(0)
      setPaidAmount(0)
      setNotes('')
    } catch (error) {
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case 'due':
        return <Badge className="bg-red-100 text-red-800">Due</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-6 w-6 text-primary" />
            <h1 className="heading-1">Create Invoice</h1>
          </div>
          <p className="text-muted-foreground">
            Create professional invoices with automatic calculations and payment tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      placeholder="Enter customer name"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerPhone"
                        value={customer.phone}
                        onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                        placeholder="01XXXXXXXXX"
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerAddress"
                      value={customer.address}
                      onChange={(e) => setCustomer({...customer, address: e.target.value})}
                      placeholder="Enter customer address"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Items
                  </CardTitle>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-sm">Click &quot;Add Item&quot; to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Product Details</TableHead>
                          <TableHead className="w-[100px]">Qty</TableHead>
                          <TableHead className="w-[100px]">Unit</TableHead>
                          <TableHead className="w-[120px]">Unit Price</TableHead>
                          <TableHead className="w-[120px]">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          // Use the helper function for consistent formatting
                          const variantInfo = formatVariantInfo(item);
                          
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <Input
                                    value={item.productName}
                                    onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                                    placeholder="Enter product name"
                                    className="border-0 p-0 h-8 focus-visible:ring-0 font-medium"
                                  />
                                  {variantInfo && (
                                    <div className="text-xs text-muted-foreground">
                                      {variantInfo.display}
                                    </div>
                                  )}
                                  {variantInfo?.sizeInfo && (
                                    <div className="text-xs text-muted-foreground">
                                      {variantInfo.sizeInfo}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="border-0 p-0 h-8 focus-visible:ring-0 text-center"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.unit}
                                  onValueChange={(value) => updateItem(item.id, 'unit', value)}
                                >
                                  <SelectTrigger className="border-0 p-0 h-8 focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sqft">sqft</SelectItem>
                                    <SelectItem value="piece">piece</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="meter">meter</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="border-0 p-0 h-8 focus-visible:ring-0 text-right"
                                />
                              </TableCell>
                              <TableCell className="font-semibold text-right">
                                {formatCurrency(item.totalPrice)}
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteItemId(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete Item</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to remove this item from the invoice?
                                        This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setDeleteItemId(null)}>
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        onClick={() => removeItem(item.id)}
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-12"
                      />
                      <Select
                        value={discountType}
                        onValueChange={(value: 'percentage' | 'amount') => setDiscountType(value)}
                      >
                        <SelectTrigger className="w-20 h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">৳</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or comments"
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {/* Invoice Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrency(calculateSubtotal())}
                    </span>
                  </div>

                  {/* Discount */}
                  {discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Discount {discountType === 'percentage' ? `(${discount}%)` : ''}
                      </span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(calculateDiscountAmount())}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {/* Grand Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Grand Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateGrandTotal())}
                    </span>
                  </div>

                  <Separator />

                  {/* Payment Tracking */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount">Paid Amount</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-12 text-lg font-semibold"
                      />
                    </div>

                    {/* Due Amount - Highlighted */}
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Due Amount</span>
                        {getStatusBadge(getPaymentStatus())}
                      </div>
                      <div className={`text-2xl font-bold ${
                        calculateDueAmount() > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(calculateDueAmount())}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleCreateInvoice}
                  disabled={loading || !customer.name || items.length === 0}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={items.length === 0}
                >
                  Save as Draft
                </Button>
              </div>

              {/* Quick Stats */}
              {items.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {items.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {items.length === 1 ? 'Item' : 'Items'} Added
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}