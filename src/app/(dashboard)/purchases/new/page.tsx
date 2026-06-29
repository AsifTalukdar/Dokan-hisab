"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ArrowLeft, PackagePlus, CheckCircle2, Search, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBusinessId } from '@/hooks/useBusiness'

export default function NewPurchasePage() {
  const router = useRouter()
  const supabase = createClient()
  const { getBusinessId } = useBusinessId()
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [supplier, setSupplier] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*, categories(name)').eq('is_active', true)
    setProducts(data || [])
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

  const total = cart.reduce((sum, item) => sum + (item.buy_price * item.qty), 0)
  const dueAmount = Math.max(0, total - paidAmount)

  async function handleConfirmPurchase() {
    if (cart.length === 0) {
      showToast('error', 'কার্টে কোনো পণ্য নেই')
      return
    }
    setLoading(true)

    try {
      const businessId = await getBusinessId()
      if (!businessId) throw new Error('বিজনেস আইডি পাওয়া যায়নি')

      // 1. Create purchase
      const { data: purchase, error: purError } = await supabase
        .from('purchases')
        .insert({
          business_id: businessId,
          supplier_name: supplier,
          total,
          paid_amount: paidAmount,
          due_amount: dueAmount,
          payment_method: paymentMethod,
        })
        .select()
        .single()

      if (purError) throw purError

      // 2. Create purchase items (Trigger adds stock)
      const purchaseItems = cart.map(item => ({
        purchase_id: purchase.id,
        product_id: item.id,
        product_name: item.name,
        qty: item.qty,
        buy_price: item.buy_price,
        total: item.buy_price * item.qty
      }))

      const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems)
      if (itemsError) throw itemsError

      showToast('success', 'স্টক সফলভাবে যোগ করা হয়েছে!')
      setTimeout(() => {
        router.push('/purchases')
      }, 1500)
    } catch (err: any) {
      showToast('error', 'ত্রুটি: ' + err.message)
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
          <Link href="/purchases">
            <Button variant="ghost" size="sm" className="gap-2 font-bangla">
              <ArrowLeft className="w-4 h-4" /> ফিরে যান
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">নতুন স্টক ক্রয়</h1>
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
                onClick={() => addToCart(product)}
                className="p-4 text-left border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-text-primary font-bangla">{product.name}</p>
                    <p className="text-xs text-text-secondary">৳{product.buy_price} / {product.unit}</p>
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
          <h2 className="text-xl font-bold text-text-primary font-bangla">ক্রয় তালিকা</h2>
          {cart.length === 0 ? (
            <div className="text-center py-12 text-text-secondary font-bangla">
              <PackagePlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
              কোন পণ্য যোগ করা হয়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary font-bangla">{item.name}</p>
                    <p className="text-xs text-text-secondary">৳{item.buy_price} x {item.qty} = ৳{item.buy_price * item.qty}</p>
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
              <Truck className="w-4 h-4" /> সাপ্লায়ারের নাম
            </label>
            <Input 
              className="font-bangla" 
              placeholder="সাপ্লায়ারের নাম লিখুন" 
              value={supplier} 
              onChange={(e) => setSupplier(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">পেমেন্ট পদ্ধতি</label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'bkash', 'nagad', 'rocket', 'bank', 'credit'].map(method => (
                <button 
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all font-bangla capitalize ${paymentMethod === method ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-border'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">পেইড অ্যামাউন্ট (৳)</label>
            <Input 
              type="number" 
              value={paidAmount} 
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} 
            />
          </div>

          <div className="pt-6 border-t border-border space-y-3">
            <div className="flex justify-between text-xl font-bold text-text-primary font-bangla pt-2">
              <span>মোট বিল:</span>
              <span>৳{total}</span>
            </div>
            <div className="flex justify-between text-lg font-medium text-danger font-bangla">
              <span>বকেয়া:</span>
              <span>৳{dueAmount}</span>
            </div>
          </div>

          <Button 
            className="w-full py-6 text-lg font-bangla gap-2" 
            onClick={handleConfirmPurchase} 
            isLoading={loading}
            disabled={cart.length === 0}
          >
            <CheckCircle2 className="w-5 h-5" /> স্টক আপডেট করুন
          </Button>
        </div>
      </div>
    </div>
  )
}
