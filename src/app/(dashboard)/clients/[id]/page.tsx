"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, MapPin, Mail, TrendingUp, History } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const supabase = createClient()
  
  const [client, setClient] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [clientId])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      setClient(c)

      const { data: s } = await supabase
        .from('sales')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      setSales(s || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center font-bangla">লোড হচ্ছে...</div>
  if (!client) return <div className="p-8 text-center font-bangla">কাস্টমার পাওয়া যায়নি</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="sm" className="gap-2 font-bangla">
            <ArrowLeft className="w-4 h-4" /> ফিরে যান
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-text-primary font-bangla">{client.name} এর লেজার</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary font-bangla border-b pb-2">কাস্টমার প্রোফাইল</h2>
            <div className="space-y-3">
              <DetailRow label="ফোন" value={client.phone || 'N/A'} />
              <DetailRow label="ঠিকানা" value={client.address || 'N/A'} />
              <DetailRow label="ইমেইল" value={client.email || 'N/A'} />
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary font-bangla border-b pb-2">বর্তমান হিসাব</h2>
            <div className="text-center py-4">
              <div className={`text-4xl font-bold ${client.total_due > 0 ? 'text-danger' : 'text-success'}`}>
                ৳{client.total_due}
              </div>
              <div className="text-sm text-text-secondary font-bangla">মোট বকেয়া টাকা</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary font-bangla flex items-center gap-2">
                <History className="w-5 h-5" /> লেনদেনের ইতিহাস
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">তারিখ</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">মোট টাকা</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পেইড</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">বকেয়া</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পদ্ধতি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-text-secondary font-bangla">কোন রেকর্ড পাওয়া যায়নি</td></tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm">{format(new Date(sale.created_at), 'dd MMM yyyy')}</td>
                        <td className="p-4 font-medium text-text-primary font-bangla">৳{sale.total}</td>
                        <td className="p-4 text-sm text-success font-bangla">৳{sale.paid_amount}</td>
                        <td className="p-4 text-sm text-danger font-bangla">৳{sale.due_amount}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-bangla capitalize">{sale.payment_method}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-secondary font-bangla">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}
