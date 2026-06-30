'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Chip,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '@heroui/react'
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
        return <Chip size="sm" className="bg-green-100 text-green-800">Paid</Chip>
      case 'partial':
        return <Chip size="sm" className="bg-yellow-100 text-yellow-800">Partial</Chip>
      case 'due':
        return <Chip size="sm" className="bg-red-100 text-red-800">Due</Chip>
      default:
        return <Chip size="sm" color="default" variant="flat">Unknown</Chip>
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
              <CardHeader className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="customerName" className="text-sm font-medium">Customer Name *</label>
                    <Input
                      id="customerName"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      placeholder="Enter customer name"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="customerPhone" className="text-sm font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
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
                  <label htmlFor="customerAddress" className="text-sm font-medium">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="customerAddress"
                      value={customer.address}
                      onChange={(e) => setCustomer({...customer, address: e.target.value})}
                      placeholder="Enter customer address"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader className="flex flex-col items-start gap-1">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Items
                  </h3>
                  <Button onPress={addItem} size="sm" color="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-sm">Click &quot;Add Item&quot; to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table aria-label="Invoice items">
                      <TableHeader>
                        <TableColumn className="w-[300px]">Product Details</TableColumn>
                        <TableColumn className="w-[100px]">Qty</TableColumn>
                        <TableColumn className="w-[100px]">Unit</TableColumn>
                        <TableColumn className="w-[120px]">Unit Price</TableColumn>
                        <TableColumn className="w-[120px]">Total</TableColumn>
                        <TableColumn className="w-[50px]">{''}</TableColumn>
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
                                  value={String(item.quantity)}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="border-0 p-0 h-8 focus-visible:ring-0 text-center"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  aria-label="Unit"
                                  selectedKeys={item.unit ? [item.unit] : []}
                                  onSelectionChange={(keys) => updateItem(item.id, 'unit', Array.from(keys)[0] as string)}
                                  className="border-0 p-0 h-8"
                                >
                                  <SelectItem key="sqft">sqft</SelectItem>
                                  <SelectItem key="piece">piece</SelectItem>
                                  <SelectItem key="kg">kg</SelectItem>
                                  <SelectItem key="meter">meter</SelectItem>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={String(item.unitPrice)}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="border-0 p-0 h-8 focus-visible:ring-0 text-right"
                                />
                              </TableCell>
                              <TableCell className="font-semibold text-right">
                                {formatCurrency(item.totalPrice)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  onPress={() => setDeleteItemId(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                <Modal
                                  isOpen={deleteItemId === item.id}
                                  onOpenChange={(open) => { if (!open) setDeleteItemId(null) }}
                                >
                                  <ModalContent>
                                    {(onClose) => (
                                      <>
                                        <ModalHeader className="flex flex-col gap-1">
                                          Delete Item
                                          <span className="text-sm font-normal text-muted-foreground">
                                            Are you sure you want to remove this item from the invoice?
                                            This action cannot be undone.
                                          </span>
                                        </ModalHeader>
                                        <ModalFooter>
                                          <Button variant="bordered" onPress={() => { setDeleteItemId(null); onClose(); }}>
                                            Cancel
                                          </Button>
                                          <Button
                                            color="danger"
                                            onPress={() => { removeItem(item.id); onClose(); }}
                                          >
                                            Delete
                                          </Button>
                                        </ModalFooter>
                                      </>
                                    )}
                                  </ModalContent>
                                </Modal>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-semibold">Additional Details</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="discount" className="text-sm font-medium">Discount</label>
                    <div className="flex gap-2">
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        value={String(discount)}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-12"
                      />
                      <Select
                        aria-label="Discount type"
                        selectedKeys={discountType ? [discountType] : []}
                        onSelectionChange={(keys) => setDiscountType(Array.from(keys)[0] as 'percentage' | 'amount')}
                        className="w-20 h-12"
                      >
                        <SelectItem key="amount">৳</SelectItem>
                        <SelectItem key="percentage">%</SelectItem>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</label>
                    <Select
                      aria-label="Payment method"
                      selectedKeys={paymentMethod ? [paymentMethod] : []}
                      onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as string)}
                      className="h-12"
                    >
                      <SelectItem key="cash">Cash</SelectItem>
                      <SelectItem key="card">Card</SelectItem>
                      <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem key="cheque">Cheque</SelectItem>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or comments"
                    className="h-12"
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              
              {/* Invoice Summary */}
              <Card>
                <CardHeader className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Invoice Summary
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  
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

                  <Divider />

                  {/* Grand Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Grand Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateGrandTotal())}
                    </span>
                  </div>

                  <Divider />

                  {/* Payment Tracking */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label htmlFor="paidAmount" className="text-sm font-medium">Paid Amount</label>
                      <Input
                        id="paidAmount"
                        type="number"
                        step="0.01"
                        value={String(paidAmount)}
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
                </CardBody>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onPress={handleCreateInvoice}
                  isDisabled={loading || !customer.name || items.length === 0}
                  isLoading={loading}
                  color="primary"
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </Button>

                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full"
                  isDisabled={items.length === 0}
                >
                  Save as Draft
                </Button>
              </div>

              {/* Quick Stats */}
              {items.length > 0 && (
                <Card>
                  <CardBody className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {items.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {items.length === 1 ? 'Item' : 'Items'} Added
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}