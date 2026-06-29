"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, ShoppingCart, Trash2, CreditCard, CheckCircle2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBusinessId } from '@/hooks/useBusiness'
import type { Database } from '@/types/database.types'

type Sale = Database['public']['Tables']['sales']['Insert']
type SaleItem = Database['public']['Tables']['sale_items']['Insert']
type ProductRow = Database['public']['Tables']['products']['Row']
type CartItem = ProductRow & { qty: number }

export default function NewSalePage() {
  const router = useRouter()
  const supabase = createClient()
  const { getBusinessId } = useBusinessId()
  
  const [products, setProducts] = useState<ProductRow[]>([])
  const [clients, setClients] = useState<Database['public']['Tables']['clients']['Row'][]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const { data: p } = await supabase.from('products').select('*, categories(name)').eq('is_active', true)
    const { data: c } = await supabase.from('clients').select('*').order('name')
    setProducts(p || [])
    setClients(c || [])
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
  }

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id))

  const subtotal = cart.reduce((sum, item) => sum + (item.sell_price * item.qty), 0)
  const total = Math.max(0, subtotal - discount)
  const paidAmount = paymentMethod === 'credit' ? 0 : total
  const dueAmount = total - paidAmount

  async function handleConfirmSale() {
    if (cart.length === 0) {
      showToast('error', 'কার্টে কোনো পণ্য নেই')
      return
    }
    setLoading(true)

    try {
      const businessId = await getBusinessId()
      if (!businessId) throw new Error('আপনার বিজনেস আইডি পাওয়া যায়নি')

      // 1. Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
          client_id: selectedClient || null,
          subtotal,
          discount,
          total,
          paid_amount: paidAmount,
          due_amount: dueAmount,
          payment_method: paymentMethod,
          status: 'completed',
        })
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Create sale items
      const saleItems: SaleItem[] = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        unit: item.unit,
        qty: item.qty,
        buy_price: item.buy_price,
        sell_price: item.sell_price,
        total: item.sell_price * item.qty
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      showToast('success', 'বিক্রি সফলভাবে সম্পন্ন হয়েছে!')
      setTimeout(() => router.push('/sales'), 1500)
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
        <Badge 
          variant={toast.type === 'success' ? 'success' : 'danger'} 
          className="fixed top-4 right-4 z-50 py-3 px-6 shadow-lg font-bangla animate-in slide-in-from-top-4"
        >
          {toast.text}
        </Badge>
      )}

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-text-primary font-bangla">পণ্য নির্বাচন করুন</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              className="pl-10 font-bangla" 
              placeholder="পণ্য খুঁজুন..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {filteredProducts.map(product => (
              <button 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="p-4 text-left border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-text-primary font-bangla">{product.name}</p>
                    <p className="text-xs text-text-secondary">{product.unit} | ৳{product.sell_price}</p>
                  </div>
                  <div className="bg-primary text-white p-1 rounded-md group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={product.stock_qty <= product.low_stock_threshold ? 'warning' : 'success'} className="text-[10px] font-bangla">
                    মজুদ: {product.stock_qty}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-text-primary font-bangla">কার্টে থাকা পণ্য</h2>
          {cart.length === 0 ? (
            <div className="text-center py-12 text-text-secondary font-bangla">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              কার্ট খালি। পণ্য যোগ করুন।
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary font-bangla">{item.name}</p>
                    <p className="text-xs text-text-secondary">৳{item.sell_price} x {item.qty} = ৳{item.sell_price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => updateQty(item.id, -1)}>-</Button>
                      <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => updateQty(item.id, 1)}>+</Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-danger h-8 w-8 p-0" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-text-primary font-bangla">পেমেন্ট ডিটেইলস</h2>
          
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> পেমেন্ট পদ্ধতি
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'bkash', 'nagad', 'rocket', 'credit', 'bank'].map(method => (
                <button 
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all font-bangla capitalize ${paymentMethod === method ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border hover:border-primary'}`}
                >
                  {method === 'cash' ? 'নগদ' : method === 'credit' ? 'বকেয়া' : method}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">ডিসকাউন্ট (৳)</label>
            <Input 
              type="number" 
              value={discount} 
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
            />
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
            <div className="flex justify-between text-xl font-bold text-text-primary font-bangla pt-2">
              <span>মোট টাকা:</span>
              <span>৳{total}</span>
            </div>
          </div>

          <Button 
            className="w-full py-6 text-lg font-bangla gap-2" 
            onClick={handleConfirmSale} 
            isLoading={loading}
            disabled={cart.length === 0}
          >
            <CheckCircle2 className="w-5 h-5" /> বিক্রি সম্পন্ন করুন
          </Button>
        </div>
      </div>
    </div>
  )
}
