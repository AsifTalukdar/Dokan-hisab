"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  PackagePlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useBusinessId } from '@/hooks/useBusiness'

const navItems = [
  { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard },
  { name: 'মজুদ/Stock', href: '/inventory', icon: Box },
  { name: 'বিক্রয়', href: '/sales', icon: ShoppingCart },
  { name: 'ক্রয়/Purchase', href: '/purchases', icon: PackagePlus },
  { name: 'ইনভয়েস', href: '/invoices', icon: FileText },
  { name: 'কাস্টমার', href: '/clients', icon: Users },
  { name: 'সেটিংস', href: '/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const pathname = usePathname()
  const supabase = createClient()
  const { clearCache } = useBusinessId()

  useEffect(() => {
    async function fetchUserName() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile?.full_name) setUserName(profile.full_name)
    }
    fetchUserName()
  }, [])

  const handleLogout = async () => {
    clearCache()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center">
                <StoreIcon />
              </div>
              <span className="text-xl font-bold text-text-primary font-bangla">দোকান হিসাব</span>
            </Link>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6 text-text-secondary" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-bangla text-sm
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'}
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-text-secondary font-bangla" 
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              লগ আউট
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-text-secondary" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text-primary font-bangla">{userName || 'প্রোফাইল'}</p>
              <p className="text-xs text-text-secondary font-bangla">ওনার</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full border border-border" />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function StoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
