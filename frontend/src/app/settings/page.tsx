'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardBody, Tabs, Tab } from '@heroui/react'
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
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(String(key))}
              aria-label="Settings"
              className="w-full"
            >
              <Tab
                key="shop-info"
                title={
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">Shop Info</span>
                  </div>
                }
              >
                <div className="p-6">
                  <BasicShopInfoTab />
                </div>
              </Tab>

              <Tab
                key="pricing"
                title={
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Pricing</span>
                  </div>
                }
              >
                <div className="p-6">
                  <BasicPricingTab />
                </div>
              </Tab>

              <Tab
                key="users"
                title={
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Users</span>
                  </div>
                }
              >
                <div className="p-6">
                  <BasicUsersTab />
                </div>
              </Tab>

              <Tab
                key="permissions"
                title={
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Permissions</span>
                  </div>
                }
              >
                <div className="p-6">
                  <BasicPermissionsTab />
                </div>
              </Tab>

              <Tab
                key="language"
                title={
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Language</span>
                  </div>
                }
              >
                <div className="p-6">
                  <BasicLanguageTab />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}