'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  TypographyH1, 
  TypographyH2, 
  TypographyH3, 
  TypographyH4,
  TypographyP,
  TypographyLead,
  CurrencyDisplay,
  NumberDisplay,
  PercentageDisplay
} from '@/components/ui/typography'

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <TypographyH1>Thai & Aluminum Design System</TypographyH1>
        <TypographyLead>
          A consistent, BD-friendly design language with high contrast and readable components
        </TypographyLead>
      </div>

      {/* Color Palette */}
      <section className="space-y-6">
        <TypographyH2>Color Palette</TypographyH2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>Main brand colors for actions and emphasis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-md"></div>
                <div>
                  <div className="font-medium">Primary</div>
                  <div className="text-sm text-muted-foreground">hsl(221.2 83.2% 53.3%)</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary rounded-md"></div>
                <div>
                  <div className="font-medium">Secondary</div>
                  <div className="text-sm text-muted-foreground">hsl(210 40% 96%)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Colors</CardTitle>
              <CardDescription>Colors for different states and feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-success-600 rounded-md"></div>
                <div>
                  <div className="font-medium">Success</div>
                  <div className="text-sm text-muted-foreground">Paid, Active, Positive</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-warning-600 rounded-md"></div>
                <div>
                  <div className="font-medium">Warning</div>
                  <div className="text-sm text-muted-foreground">Partial, Pending</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-danger-600 rounded-md"></div>
                <div>
                  <div className="font-medium">Danger</div>
                  <div className="text-sm text-muted-foreground">Due, Error, Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BD Colors</CardTitle>
              <CardDescription>Bangladesh-specific cultural colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-bd-green rounded-md"></div>
                <div>
                  <div className="font-medium">BD Green</div>
                  <div className="text-sm text-muted-foreground">Flag green</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-bd-red rounded-md"></div>
                <div>
                  <div className="font-medium">BD Red</div>
                  <div className="text-sm text-muted-foreground">Flag red</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-bd-gold rounded-md"></div>
                <div>
                  <div className="font-medium">BD Gold</div>
                  <div className="text-sm text-muted-foreground">Traditional gold</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <TypographyH2>Typography</TypographyH2>
        
        <Card>
          <CardHeader>
            <CardTitle>Heading Hierarchy</CardTitle>
            <CardDescription>Consistent heading sizes with proper contrast</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <TypographyH1>Heading 1 - Main Page Title</TypographyH1>
              <div className="text-sm text-muted-foreground mt-1">text-4xl font-extrabold</div>
            </div>
            <div>
              <TypographyH2>Heading 2 - Section Title</TypographyH2>
              <div className="text-sm text-muted-foreground mt-1">text-3xl font-semibold</div>
            </div>
            <div>
              <TypographyH3>Heading 3 - Subsection</TypographyH3>
              <div className="text-sm text-muted-foreground mt-1">text-2xl font-semibold</div>
            </div>
            <div>
              <TypographyH4>Heading 4 - Card Title</TypographyH4>
              <div className="text-sm text-muted-foreground mt-1">text-xl font-semibold</div>
            </div>
            <div>
              <TypographyP>
                Body text with proper line height and spacing for readability. 
                This paragraph demonstrates the default text styling used throughout the application.
              </TypographyP>
              <div className="text-sm text-muted-foreground mt-1">leading-7</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Number Display */}
      <section className="space-y-6">
        <TypographyH2>Number Display</TypographyH2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Currency Display</CardTitle>
              <CardDescription>Large, readable currency formatting for BD market</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Small</div>
                <CurrencyDisplay amount={1250.75} size="sm" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Base</div>
                <CurrencyDisplay amount={15750.50} size="base" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Large</div>
                <CurrencyDisplay amount={125000.00} size="lg" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Extra Large</div>
                <CurrencyDisplay amount={1500000.00} size="xl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Numbers & Percentages</CardTitle>
              <CardDescription>Consistent number formatting with color coding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Quantity</div>
                <NumberDisplay value={1250} size="lg" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Positive Percentage</div>
                <PercentageDisplay value={15.5} size="lg" showSign />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Negative Percentage</div>
                <PercentageDisplay value={-8.2} size="lg" showSign />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Neutral Percentage</div>
                <PercentageDisplay value={0} size="lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-6">
        <TypographyH2>Buttons</TypographyH2>
        
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles for various actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Primary</div>
                <Button variant="default">Primary</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Secondary</div>
                <Button variant="secondary">Secondary</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Success</div>
                <Button variant="default" className="bg-green-600 hover:bg-green-700">Success</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Danger</div>
                <Button variant="destructive">Danger</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Outline</div>
                <Button variant="outline">Outline</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Ghost</div>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Warning</div>
                <Button variant="default" className="bg-yellow-600 hover:bg-yellow-700">Warning</Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Link</div>
                <Button variant="link">Link</Button>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <TypographyH4>Button Sizes</TypographyH4>
              <div className="flex items-center space-x-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="lg" className="h-12 px-10">Extra Large</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges */}
      <section className="space-y-6">
        <TypographyH2>Status Badges</TypographyH2>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Indicators</CardTitle>
            <CardDescription>Color-coded badges for different states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Payment Status</div>
                <div className="space-y-2">
                  <Badge variant="paid">Paid</Badge>
                  <Badge variant="partial">Partial</Badge>
                  <Badge variant="due">Due</Badge>
                  <Badge variant="pending">Pending</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Activity Status</div>
                <div className="space-y-2">
                  <Badge variant="active">Active</Badge>
                  <Badge variant="inactive">Inactive</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Alert Levels</div>
                <div className="space-y-2">
                  <Badge variant="success">Low Risk</Badge>
                  <Badge variant="warning">Medium Risk</Badge>
                  <Badge variant="danger">High Risk</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">General</div>
                <div className="space-y-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Forms */}
      <section className="space-y-6">
        <TypographyH2>Form Components</TypographyH2>
        
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Consistent form styling with proper focus states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input id="name" placeholder="Enter customer name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select className="form-select">
                  <option>Select status</option>
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Due</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Alerts */}
      <section className="space-y-6">
        <TypographyH2>Alerts & Notifications</TypographyH2>
        
        <div className="space-y-4">
          <Alert variant="info">
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is an informational alert with neutral styling.
            </AlertDescription>
          </Alert>
          
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Operation completed successfully. All data has been saved.
            </AlertDescription>
          </Alert>
          
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Due sales percentage is above 30%. Consider reviewing credit policies.
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertTitle>Critical Alert</AlertTitle>
            <AlertDescription>
              Total due amount exceeds safe threshold. Immediate action required.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-6">
        <TypographyH2>Cards & Layouts</TypographyH2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Metric Card</CardTitle>
              <CardDescription>Dashboard metrics display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <CurrencyDisplay amount={125000} size="2xl" />
                <div className="flex items-center space-x-2">
                  <PercentageDisplay value={12.5} showSign className="text-sm" />
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>Payment status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Paid</span>
                  <Badge variant="paid">45</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Partial</span>
                  <Badge variant="partial">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Due</span>
                  <Badge variant="due">8</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common business actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="default">Create Invoice</Button>
              <Button className="w-full" variant="outline">Add Customer</Button>
              <Button className="w-full" variant="secondary">View Reports</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <section className="text-center py-8 border-t">
        <TypographyP className="text-muted-foreground">
          Thai & Aluminum Glass House Design System - Built for Bangladesh Market
        </TypographyP>
      </section>
    </div>
  )
}