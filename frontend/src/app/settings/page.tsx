'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Settings,
  Store,
  DollarSign,
  Users,
  Shield,
  Globe
} from 'lucide-react'

// Simple tab components for now
import BasicShopInfoTab from '@/components/settings/BasicShopInfoTab'
import BasicPricingTab from '@/components/settings/BasicPricingTab'
import BasicUsersTab from '@/components/settings/BasicUsersTab'
import BasicPermissionsTab from '@/components/settings/BasicPermissionsTab'
import BasicLanguageTab from '@/components/settings/BasicLanguageTab'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('shop-info')

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h1 className="heading-1">Settings</h1>
            <p className="text-muted-foreground">Central control panel for your business</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="shop-info" className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">Shop Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Pricing</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Permissions</span>
                  </TabsTrigger>
                  <TabsTrigger value="language" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Language</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <div className="p-6">
                <TabsContent value="shop-info" className="mt-0">
                  <BasicShopInfoTab />
                </TabsContent>

                <TabsContent value="pricing" className="mt-0">
                  <BasicPricingTab />
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <BasicUsersTab />
                </TabsContent>

                <TabsContent value="permissions" className="mt-0">
                  <BasicPermissionsTab />
                </TabsContent>

                <TabsContent value="language" className="mt-0">
                  <BasicLanguageTab />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}