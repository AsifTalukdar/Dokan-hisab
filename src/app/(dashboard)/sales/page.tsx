"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Download, Search, Plus, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function SalesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creatingInvoice, setCreatingInvoice] = useState<string | null>(null)

  useEffect(() => {
    fetchSales()
  }, [])

  async function fetchSales() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sales')
      .select(`*, clients(name)`)
      .order('created_at', { ascending: false })

    if (!error) setSales(data)
    setLoading(false)
  }

  async function handleCreateInvoiceFromSale(sale: any) {
    setCreatingInvoice(sale.id)
    try {
      // Fetch sale items
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', sale.id)

      let invNo = ''
      const { data: rpcInvNo } = await supabase
        .rpc('generate_invoice_number', { p_business_id: sale.business_id })
      
      if (rpcInvNo) {
        invNo = rpcInvNo
      } else {
        const { data: lastInv } = await supabase
          .from('invoices')
          .select('invoice_number')
          .order('invoice_number', { ascending: false })
          .limit(1)

        const year  = new Date().getFullYear()
        const lastN = lastInv?.[0]?.invoice_number || `INV-${year}-000`
        const seq   = parseInt(lastN.split('-')[2] || '0') + 1
        invNo = `INV-${year}-${seq.toString().padStart(3, '0')}`
      }

      // Create invoice
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert({
          business_id:    sale.business_id,
          client_id:      sale.client_id,
          sale_id:        sale.id,
          invoice_number: invNo,
          issue_date:     new Date().toISOString().split('T')[0],
          subtotal:       sale.subtotal,
          discount:       sale.discount,
          total:          sale.total,
          paid_amount:    sale.paid_amount,
          due_amount:     sale.due_amount,
          status:         sale.due_amount > 0 ? 'sent' : 'paid',
        })
        .select()
        .single()

      if (invErr) throw invErr

      // Create invoice items from sale items
      const invoiceItems = (saleItems || []).map(si => ({
        invoice_id:  inv.id,
        product_id:  si.product_id,
        description: si.product_name,
        unit:        si.unit,
        qty:         si.qty,
        unit_price:  si.sell_price,
        total:       si.total,
      }))

      const { error: itemsErr } = await supabase.from('invoice_items').insert(invoiceItems)
      if (itemsErr) throw itemsErr

      // Link sale to invoice
      const { error: updateSaleErr } = await supabase
        .from('sales')
        .update({ invoice_id: inv.id })
        .eq('id', sale.id)

      if (updateSaleErr) throw updateSaleErr

      // Update local state to reflect new invoice_id
      setSales(prev => prev.map(s => s.id === sale.id ? { ...s, invoice_id: inv.id } : s))

      router.push(`/invoices/${inv.id}`)
    } catch (err: any) {
      console.error('Invoice creation error:', err.message)
      alert('ত্রুটি: ' + err.message)
    } finally {
      setCreatingInvoice(null)
    }
  }

  const filteredSales = sales.filter(s => 
    s.clients?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">বিক্রয় ইতিহাস/Sales</h1>
          <p className="text-text-secondary font-bangla text-sm">আপনার দোকানের সকল বিক্রয়ের তালিকা</p>
        </div>
        <Button className="font-bangla gap-2" onClick={() => router.push('/sales/new')}>
          <Plus className="w-4 h-4" /> নতুন সেল এন্ট্রি
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <Input 
          className="pl-10 font-bangla" 
          placeholder="কাস্টমারের নাম দিয়ে খুঁজুন..." 
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
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">কাস্টমার</th>
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
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-text-secondary font-bangla">কোন রেকর্ড পাওয়া যায়নি</td></tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm">{format(new Date(sale.created_at), 'dd MMM yyyy')}</td>
                    <td className="p-4 font-medium text-text-primary font-bangla">{sale.clients?.name || 'সাধারণ কাস্টমার'}</td>
                    <td className="p-4 font-medium text-text-primary font-bangla">৳{sale.total}</td>
                    <td className="p-4 text-sm text-success font-bangla">৳{sale.paid_amount}</td>
                    <td className="p-4 text-sm text-danger font-bangla">৳{sale.due_amount}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-bangla capitalize">{sale.payment_method}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      {sale.invoice_id ? (
                        // Invoice exists — show View button
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/invoices/${sale.invoice_id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      ) : (
                        // No invoice yet — show Create Invoice button
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bangla gap-1 h-8 text-xs"
                          onClick={() => handleCreateInvoiceFromSale(sale)}
                          isLoading={creatingInvoice === sale.id}
                        >
                          <FileText className="w-3 h-3" /> ইনভয়েস তৈরি
                        </Button>
                      )}
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

function Input(props: any) {
  return (
    <input {...props} className={`flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`} />
  )
}
