"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  CreditCard,
  ShoppingCart,
  PackagePlus,
  FileText
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import QuickStartModal from '@/components/dashboard/QuickStartModal'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showQuickStart, setShowQuickStart] = useState(false)
  const [metrics, setMetrics] = useState({
    revenue: '৳0',
    due: '৳0',
    stockValue: '0টি',
    lowStockCount: 0
  })
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    checkQuickStartStatus()
  }, [])

  async function checkQuickStartStatus() {
    // Check if user has already completed onboarding
    // For now, we show it if they have few products
    const { data: products } = await supabase.from('products').select('id')
    if (!products || products.length < 5) {
      setShowQuickStart(true)
    }
  }

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const { data: dailySales } = await supabase
        .from('daily_sales_summary')
        .select('*')
        .order('sale_date', { ascending: true })
        .limit(7)

      if (dailySales) {
        setSalesData(dailySales.map(d => ({
          name: new Date(d.sale_date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
          revenue: d.total_revenue
        })))
        const todayRevenue = dailySales[dailySales.length - 1]?.total_revenue || 0
        setMetrics(prev => ({ ...prev, revenue: `৳${todayRevenue}` }))
      }

      const { data: clientSummary } = await supabase
        .from('client_invoice_summary')
        .select('total_due')

      const totalDue = clientSummary?.reduce((sum, item) => sum + item.total_due, 0) || 0
      setMetrics(prev => ({ ...prev, due: `৳${totalDue}` }))

      const { data: stockData } = await supabase
        .from('products')
        .select('stock_qty')
        .eq('is_active', true)

      const totalStock = stockData?.reduce((sum, p) => sum + p.stock_qty, 0) || 0
      setMetrics(prev => ({ ...prev, stockValue: `${totalStock}টি` }))

      const { count: lowStockCount } = await supabase
        .from('low_stock_products')
        .select('*', { count: 'exact', head: true })

      setMetrics(prev => ({ ...prev, lowStockCount: lowStockCount || 0 }))

    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center font-bangla">লোড হচ্ছে...</div>

  return (
    <div className="space-y-8">
      <QuickStartModal isOpen={showQuickStart} onClose={() => setShowQuickStart(false)} />
      
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-bangla">স্বাগতম, দোকান হিসাব! 👋</h1>
        <p className="text-text-secondary font-bangla">আপনার ব্যবসার আজকের লাইভ রিপোর্ট</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="আজকের আয়" 
          value={metrics.revenue} 
          icon={TrendingUp} 
          color="bg-success" 
        />
        <MetricCard 
          title="মোট বকেয়া" 
          value={metrics.due} 
          icon={CreditCard} 
          color="bg-danger" 
        />
        <MetricCard 
          title="মোট মজুদ" 
          value={metrics.stockValue} 
          icon={Package} 
          color="bg-primary" 
        />
        <MetricCard 
          title="স্টক সতর্কতা" 
          value={metrics.lowStockCount} 
          icon={AlertTriangle} 
          color="bg-warning" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary font-bangla">সাপ্তাহিক বিক্রয় রিপোর্ট</h2>
            <Badge variant="outline" className="font-bangla">৳ BDT</Badge>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontFamily: 'Hind Siliguri' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3B6D11" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-lg font-bold text-text-primary font-bangla mb-4">দ্রুত অ্যাকশন</h2>
            <div className="grid grid-cols-1 gap-3">
              <Button className="w-full justify-start gap-3 font-bangla h-12" onClick={() => router.push('/sales/new')}>
                <ShoppingCart className="w-5 h-5" /> নতুন সেল এন্ট্রি
              </Button>
              <Button className="w-full justify-start gap-3 font-bangla h-12" onClick={() => router.push('/purchases/new')}>
                <PackagePlus className="w-5 h-5" /> নতুন স্টক যোগ
              </Button>
              <Button className="w-full justify-start gap-3 font-bangla h-12" onClick={() => router.push('/invoices/new')}>
                <FileText className="w-5 h-5" /> ইনভয়েস তৈরি
              </Button>
            </div>
          </div>

          <div className="bg-danger/10 p-6 rounded-2xl border border-danger/20">
            <div className="flex items-center gap-3 text-danger mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold font-bangla">স্টক সতর্কতা</h3>
            </div>
            <p className="text-sm text-danger/80 font-bangla">
              আপনার {metrics.lowStockCount}টি পণ্যের মজুদ খুব কমে গেছে। দ্রুত অর্ডার করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-bangla mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-success font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
          <span className="text-xs text-text-secondary font-bangla">গত সপ্তাহের তুলনায়</span>
        </div>
      )}
    </div>
  )
}
