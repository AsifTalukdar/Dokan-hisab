"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Printer, Search, Download } from 'lucide-react'
import { format } from 'date-fns'

import { useRouter } from 'next/navigation'

export default function InvoicesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select(`*, clients(name)`)
      .order('created_at', { ascending: false })

    if (!error) setInvoices(data)
    setLoading(false)
  }

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
    inv.clients?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">ইনভয়েস ম্যানেজমেন্ট</h1>
          <p className="text-text-secondary font-bangla text-sm">বিল তৈরি করুন এবং পেমেন্ট ট্র্যাক করুন</p>
        </div>
        <Button className="font-bangla gap-2" onClick={() => router.push('/invoices/new')}>
          <Plus className="w-4 h-4" /> নতুন ইনভয়েস
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <Input 
          className="pl-10 font-bangla" 
          placeholder="ইনভয়েস নম্বর বা কাস্টমার দিয়ে খুঁজুন..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">ইনভয়েস নং</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">কাস্টমার</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">তারিখ</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">মোট টাকা</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">বকেয়া</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">স্ট্যাটাস</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-text-secondary font-bangla">লোড হচ্ছে...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-text-secondary font-bangla">কোন ইনভয়েস পাওয়া যায়নি</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-text-primary">#{inv.invoice_number}</td>
                    <td className="p-4 font-bangla text-text-primary">{inv.clients?.name || 'সাধারণ কাস্টমার'}</td>
                    <td className="p-4 text-sm text-text-secondary">
                      {format(new Date(inv.issue_date), 'dd MMM yyyy')}
                    </td>
                    <td className="p-4 font-medium text-text-primary font-bangla">৳{inv.total}</td>
                    <td className="p-4 font-medium text-danger font-bangla">৳{inv.due_amount}</td>
                    <td className="p-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`/invoices/${inv.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => window.open(`/api/invoice/${inv.id}/pdf`, '_blank')}>
                        <Download className="w-4 h-4" />
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

function InvoiceStatusBadge({ status }: { status: string }) {
  const configs: any = {
    draft: { label: 'ড্রাফট', color: 'bg-gray-100 text-gray-600' },
    sent: { label: 'পাঠানো হয়েছে', color: 'bg-blue-100 text-blue-600' },
    paid: { label: 'পেইড', color: 'bg-success/10 text-success' },
    overdue: { label: 'বকেয়া', color: 'bg-danger/10 text-danger' },
    cancelled: { label: 'বাতিল', color: 'bg-gray-200 text-gray-500' },
  }
  const config = configs[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  return <Badge className={`${config.color} font-bangla`}>{config.label}</Badge>
}

function Plus(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function Input(props: any) {
  return (
    <input {...props} className={`flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`} />
  )
}
