'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Calculator,
  FilePlus,
  Receipt,
  Package,
  Truck,
  Users,
  CreditCard,
  UserCheck,
  BarChart3,
  Settings,
  Trash2,
  ShieldCheck,
  Store,
  Menu,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFormatting } from '@/hooks/useFormatting'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'
import LanguageToggle from './LanguageToggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface LayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  primary?: boolean
}

interface NavigationSection {
  label?: string
  items: NavigationItem[]
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const { formatDateWithDay } = useFormatting()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (err) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // Navigation grouped into plain-language sections so non-technical staff
  // see a few labelled groups instead of a long flat list of icons.
  // Reports points at /analytics (the real reports page); the empty /reports
  // stub is intentionally not linked. Admin items are role-gated.
  const navigationSections: NavigationSection[] = [
    {
      items: [
        { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: t('navSales'),
      items: [
        { name: t('createInvoice'), href: '/invoice', icon: FilePlus, primary: true },
        { name: t('invoices'), href: '/invoices', icon: Receipt },
        { name: t('calculator'), href: '/calculator', icon: Calculator },
      ],
    },
    {
      label: t('navMoney'),
      items: [
        { name: t('customers'), href: '/customers', icon: Users },
        { name: t('expenses'), href: '/finance', icon: CreditCard },
        { name: t('payroll'), href: '/payroll', icon: UserCheck },
        { name: t('reports'), href: '/analytics', icon: BarChart3 },
      ],
    },
    {
      label: t('navStock'),
      items: [
        { name: t('inventory'), href: '/inventory', icon: Package },
        { name: t('stockPurchases'), href: '/inventory/stock-purchase', icon: Truck },
      ],
    },
    {
      label: t('navAdmin'),
      items: [
        { name: t('settings'), href: '/settings', icon: Settings },
        { name: t('deletedItems'), href: '/soft-delete', icon: Trash2, roles: ['manager', 'owner'] },
        { name: t('permissions'), href: '/permissions', icon: ShieldCheck, roles: ['owner'] },
        { name: t('shopConfig'), href: '/shop-config', icon: Store, roles: ['owner'] },
      ],
    },
  ]

  // Keep only items the current role may see, then drop any now-empty section.
  const navigation: NavigationSection[] = !user
    ? []
    : navigationSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => !item.roles || item.roles.includes(user.role)),
        }))
        .filter((section) => section.items.length > 0)

  const allItems = navigation.flatMap((section) => section.items)

  if (!user) {
    return (
      <AccessibilityProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="loading-spinner h-8 w-8" role="status" aria-label={t('loading')}></div>
        </div>
      </AccessibilityProvider>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">T&A</span>
        </div>
        <span className="font-semibold text-lg">Thai & Aluminum</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {navigation.map((section, sectionIdx) => (
          <div key={section.label ?? `section-${sectionIdx}`} className="space-y-1">
            {section.label && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : item.primary
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              {t('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Language Toggle */}
        <div className="mt-3">
          <LanguageToggle />
        </div>
      </div>
    </div>
  )

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto lg:bg-card lg:border-r">
          <SidebarContent />
        </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">T&A</span>
              </div>
              <span className="font-semibold">Thai & Aluminum</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-sm text-muted-foreground">
                {formatDateWithDay(new Date())}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Desktop Top Bar */}
        <div className="hidden lg:block sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">
                {allItems.find(item => item.href === pathname)?.name || t('dashboard')}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {formatDateWithDay(new Date())}
              </div>
              <LanguageToggle />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main id="main-content" className="p-4 lg:p-6" role="main" aria-label="Main content">
          {children}
        </main>
      </div>
    </div>
    </AccessibilityProvider>
  )
}