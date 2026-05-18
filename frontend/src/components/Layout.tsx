'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Receipt, 
  Package, 
  Users, 
  CreditCard, 
  UserCheck, 
  BarChart3, 
  Settings,
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
  badge?: string
  roles?: string[]
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

  // Navigation items in the specified order
  const navigationItems: NavigationItem[] = [
    { 
      name: t('dashboard'), 
      href: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      name: t('calculator'), 
      href: '/calculator', 
      icon: Calculator 
    },
    { 
      name: t('createInvoice'), 
      href: '/invoice', 
      icon: FileText 
    },
    { 
      name: t('invoices'), 
      href: '/invoices', 
      icon: Receipt 
    },
    { 
      name: t('inventory'), 
      href: '/inventory', 
      icon: Package 
    },
    { 
      name: t('customers'), 
      href: '/customers', 
      icon: Users 
    },
    { 
      name: t('expenses'), 
      href: '/finance', 
      icon: CreditCard 
    },
    { 
      name: t('payroll'), 
      href: '/payroll', 
      icon: UserCheck 
    },
    { 
      name: t('reports'), 
      href: '/reports', 
      icon: BarChart3 
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: BarChart3 
    },
    { 
      name: t('settings'), 
      href: '/settings', 
      icon: Settings 
    }
  ]

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    if (!user) return []
    
    const filteredNav = [...navigationItems]
    
    // Add role-specific items
    if (user.role === 'manager' || user.role === 'owner') {
      filteredNav.push({
        name: t('deletedItems'),
        href: '/soft-delete',
        icon: Settings,
        roles: ['manager', 'owner']
      })
    }

    if (user.role === 'owner') {
      filteredNav.push({
        name: t('permissions'),
        href: '/permissions',
        icon: Settings,
        roles: ['owner']
      })
      filteredNav.push({
        name: t('shopConfig'),
        href: '/shop-config',
        icon: Settings,
        roles: ['owner']
      })
    }

    return filteredNav
  }

  const navigation = getFilteredNavigation()

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
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {item.name}
              {item.badge && (
                <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
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
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
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
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
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
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
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