"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBusinessId } from '@/hooks/useBusiness'

export default function InventoryPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select(`*, categories(name)`)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!error) setProducts(data)
    setLoading(false)
  }

  async function handleDelete(productId: string) {
    if (!confirm('এই পণ্যটি মুছতে চান?')) return

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)

    if (!error) fetchProducts()
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const getStockBadge = (qty: number, threshold: number) => {
    if (qty <= 0) return <Badge variant="danger" className="font-bangla">ফুরিয়ে গেছে</Badge>
    if (qty <= threshold) return <Badge variant="warning" className="font-bangla">কম স্টক</Badge>
    return <Badge variant="success" className="font-bangla">পর্যাপ্ত</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">মজুদ পণ্য/Stock</h1>
          <p className="text-text-secondary font-bangla text-sm">আপনার দোকানের সকল পণ্যের তালিকা এবং স্টক ম্যানেজমেন্ট</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="font-bangla gap-2">
          <Plus className="w-4 h-4" /> নতুন পণ্য যোগ করুন
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input 
            className="pl-10 font-bangla" 
            placeholder="নাম বা SKU দিয়ে খুঁজুন..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Button variant="outline" className="font-bangla gap-2">
          <Filter className="w-4 h-4" /> ফিল্টার
        </Button>
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পণ্যের নাম</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">SKU</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">ক্যাটেগরি</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">মূল্য (বিক্রি)</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla">মজুদ/Stock</th>
                <th className="p-4 text-sm font-medium text-text-secondary font-bangla text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-secondary font-bangla">লোড হচ্ছে...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-secondary font-bangla">কোন পণ্য পাওয়া যায়নি</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium text-text-primary font-bangla">{product.name}</div>
                      <div className="text-xs text-text-secondary">{product.unit}</div>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">{product.sku || 'N/A'}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-bangla">{product.categories?.name || 'অন্যান্য'}</Badge>
                    </td>
                    <td className="p-4 font-medium text-text-primary font-bangla">৳{product.sell_price}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{product.stock_qty}</span>
                        {getStockBadge(product.stock_qty, product.low_stock_threshold)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-danger hover:text-danger hover:bg-danger/10"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          product={editingProduct} 
          onSuccess={fetchProducts}
        />
      )}
    </div>
  )
}

function ProductModal({ isOpen, onClose, product, onSuccess }: any) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category_id: product?.category_id || '',
    unit: product?.unit || 'pcs',
    buy_price: product?.buy_price || 0,
    sell_price: product?.sell_price || 0,
    stock_qty: product?.stock_qty || 0,
    low_stock_threshold: product?.low_stock_threshold || 5,
  })

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  const { getBusinessId } = useBusinessId()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const businessId = await getBusinessId()
      if (!businessId) throw new Error('বিজনেস আইডি পাওয়া যায়নি')

      const { error } = await supabase
        .from('products')
        .upsert({
          id: product?.id,
          business_id: businessId,
          ...formData,
        })

      if (error) throw error
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary font-bangla">
            {product ? 'পণ্য এডিট করুন' : 'নতুন পণ্য যোগ করুন'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-1">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">পণ্যের নাম *</label>
              <Input 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="যেমন: চিনigura চাল ৫ কেজি" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">SKU</label>
              <Input 
                value={formData.sku} 
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
                placeholder="RICE-5KG" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">ক্যাটেগরি</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:ring-2 focus:ring-primary outline-none"
                value={formData.category_id} 
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">নির্বাচন করুন</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="font-bangla">{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">ইউনিট (Unit)</label>
              <Input 
                value={formData.unit} 
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                placeholder="pcs, kg, bag" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">মজুদ পরিমাণ</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={formData.stock_qty} 
                onChange={(e) => setFormData({ ...formData, stock_qty: parseFloat(e.target.value) || 0 })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">ক্রয় মূল্য (Buy Price)</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={formData.buy_price} 
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">বিক্রয় মূল্য (Sell Price)</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={formData.sell_price} 
                onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary font-bangla">সতর্কতা লেভেল (Low Stock)</label>
              <Input 
                type="number" 
                min="0" 
                step="1"
                value={formData.low_stock_threshold} 
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseFloat(e.target.value) || 0 })} 
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <Button variant="outline" className="flex-1 font-bangla" onClick={onClose}>বাতিল করুন</Button>
            <Button type="submit" className="flex-1 font-bangla" isLoading={loading}>সংরক্ষণ করুন</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
