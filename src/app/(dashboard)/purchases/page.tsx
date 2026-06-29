"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, PackagePlus, Truck, Trash2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PurchasesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPurchases()
  }, [])

  async function fetchPurchases() {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setPurchases(data)
    setLoading(false)
  }

  const filteredPurchases = purchases.filter(p => 
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.note?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">পণ্য ক্রয়/Purchases</h1>
          <p className="text-text-secondary font-bangla text-sm">নতুন স্টক যোগ করুন এবং সাপ্লায়ার হিসাব রাখুন</p>
        </div>
        <Button onClick={() => router.push('/purchases/new')} className="font-bangla gap-2">
          <Plus className="w-4 h-4" /> নতুন ক্রয় রেকর্ড করুন
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <Input 
          className="pl-10 font-bangla" 
          placeholder="সাপ্লায়ার বা নোট দিয়ে খুঁজুন..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">তারিখ</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">সাপ্লায়ার</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">মোট টাকা</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পেইড</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">বকেয়া</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পদ্ধতি</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-text-secondary font-bangla">লোড হচ্ছে...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-text-secondary font-bangla">কোন রেকর্ড পাওয়া যায়নি</td></tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-text-secondary">
                      {new Date(pur.created_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="p-4 font-medium text-text-primary font-bangla">{pur.supplier_name || 'Unknown'}</td>
                    <td className="p-4 font-medium text-text-primary font-bangla">৳{pur.total}</td>
                    <td className="p-4 text-sm text-success font-bangla">৳{pur.paid_amount}</td>
                    <td className="p-4 text-sm text-danger font-bangla">৳{pur.due_amount}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-bangla capitalize">{pur.payment_method}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                        বিস্তারিত
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
