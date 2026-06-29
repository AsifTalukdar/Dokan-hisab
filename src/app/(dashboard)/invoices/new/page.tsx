"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Trash2, ArrowLeft, CheckCircle2, FileText, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusiness'
import type { Database } from '@/types/database.types'

type Invoice = Database['public']['Tables']['invoices']['Insert']
type InvoiceItem = Database['public']['Tables']['invoice_items']['Insert']

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()
  const { getBusinessId } = useBusinessId()
  
  const [products, setProducts] = useState<Database['public']['Tables']['products']['Row'][]>([])
  const [clients, setClients] = useState<Database['public']['Tables']['clients']['Row'][]>([])
  const [items, setItems] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
    generateInvoiceNumber()
  }, [])

  async function fetchInitialData() {
    const { data: p } = await supabase.from('products').select('*, categories(name)').eq('is_active', true)
    const { data: c } = await supabase.from('clients').select('*').order('name')
    setProducts(p || [])
    setClients(c || [])
  }

  async function generateInvoiceNumber() {
    const businessId = await getBusinessId()
    if (!businessId) return

    try {
      const { data, error } = await supabase
        .rpc('generate_invoice_number', { p_business_id: businessId })

      if (error) throw error
      if (data) setInvoiceNumber(data)
    } catch (e: any) {
      console.error(e)
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('business_id', businessId)
        .order('invoice_number', { ascending: false })
        .limit(1)
      
      const lastNum = data?.[0]?.invoice_number || 'INV-2024-000'
      const currentYear = new Date().getFullYear()
      const sequence = parseInt(lastNum.split('-')[2] || '0') + 1
      setInvoiceNumber(`INV-${currentYear}-${sequence.toString().padStart(3, '0')}`)
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const addItem = (product: any) => {
    setItems([...items, {
      product_id: product.id,
      description: product.name,
      unit: product.unit,
      qty: 1,
      unit_price: product.sell_price,
      total: product.sell_price
    }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'qty' || field === 'unit_price') {
      newItems[index].total = newItems[index].qty * newItems[index].unit_price
    }
    setItems(newItems)
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = Math.max(0, subtotal - discount + tax)

  async function handleSaveInvoice() {
    if (items.length === 0) {
      showToast('error', 'কমপক্ষে একটি আইটেম যোগ করুন')
      return
    }
    setLoading(true)

    try {
      const businessId = await getBusinessId()
      if (!businessId) throw new Error('বিজনেস আইডি পাওয়া যায়নি')

      // 1. Create Invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          business_id: businessId,
          client_id: selectedClient || null,
          invoice_number: invoiceNumber,
          issue_date: new Date().toISOString().split('T')[0],
          subtotal,
          discount,
          tax,
          total,
          status: 'sent',
        })
        .select()
        .single()

      if (invError) throw invError

      // 2. Create Invoice Items
      const invoiceItems: InvoiceItem[] = items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        description: item.description,
        unit: item.unit,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.total
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
      if (itemsError) throw itemsError

      showToast('success', 'ইনভয়েস সফলভাবে তৈরি হয়েছে!')
      setTimeout(() => router.push('/invoices'), 1500)
    } catch (err: any) {
      showToast('error', err.message || 'কিছু ভুল হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      {toast && (
        <Badge variant={toast.type === 'success' ? 'success' : 'danger'} className="fixed top-4 right-4 z-50 py-3 px-6 shadow-lg font-bangla">
          {toast.text}
        </Badge>
      )}

      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="gap-2 font-bangla">
              <ArrowLeft className="w-4 h-4" /> ফিরে যান
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">নতুন ইনভয়েস তৈরি</h1>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              className="pl-10 font-bangla" 
              placeholder="পণ্য খুঁজুন..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredProducts.map(product => (
              <button 
                key={product.id} 
                onClick={() => addItem(product)}
                className="p-4 text-left border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-text-primary font-bangla">{product.name}</p>
                    <p className="text-xs text-text-secondary">৳{product.sell_price} / {product.unit}</p>
                  </div>
                  <div className="bg-primary text-white p-1 rounded-md group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-text-primary font-bangla">ইনভয়েস আইটেম</h2>
          {items.length === 0 ? (
            <div className="text-center py-12 text-text-secondary font-bangla">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              কোন আইটেম যোগ করা হয়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl border border-border">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-medium text-text-primary font-bangla">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      className="w-16 h-8 text-center" 
                      value={item.qty} 
                      onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)} 
                    />
                    <span className="text-xs text-text-secondary font-bangla">পরিমাণ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      className="w-24 h-8 text-right" 
                      value={item.unit_price} 
                      onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} 
                    />
                    <span className="text-xs text-text-secondary font-bangla">মূল্য</span>
                  </div>
                  <div className="text-sm font-bold text-text-primary font-bangla w-20 text-right">
                    ৳{item.total}
                  </div>
                  <Button variant="ghost" size="sm" className="text-danger h-8 w-8 p-0" onClick={() => removeItem(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-text-primary font-bangla">ইনভয়েস ডিটেইলস</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">ইনভয়েস নম্বর</label>
            <Input className="font-bangla" value={invoiceNumber} readOnly />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla flex items-center gap-2">
              <User className="w-4 h-4" /> কাস্টমার নির্বাচন করুন
            </label>
            <select 
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-primary"
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">সাধারণ কাস্টমার (Walk-in)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="font-bangla">{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">ডিসকাউন্ট (৳)</label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">ট্যাক্স (৳)</label>
              <Input type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-3">
            <div className="flex justify-between text-sm text-text-secondary font-bangla">
              <span>সাবটোটাল:</span>
              <span>৳{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary font-bangla">
              <span>ডিসকাউন্ট:</span>
              <span className="text-danger">- ৳{discount}</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary font-bangla">
              <span>ট্যাক্স:</span>
              <span className="text-success">+ ৳{tax}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-text-primary font-bangla pt-2">
              <span>মোট টাকা:</span>
              <span>৳{total}</span>
            </div>
          </div>

          <Button 
            className="w-full py-6 text-lg font-bangla gap-2" 
            onClick={handleSaveInvoice} 
            isLoading={loading}
            disabled={items.length === 0}
          >
            <CheckCircle2 className="w-5 h-5" /> ইনভয়েস সংরক্ষণ করুন
          </Button>
        </div>
      </div>
    </div>
  )
}
