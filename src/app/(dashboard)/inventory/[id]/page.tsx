"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, History, ArrowLeft, TrendingDown, TrendingUp, RotateCcw } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()
  
  const [product, setProduct] = useState<any>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [productId])

  async function fetchData() {
    setLoading(true)
    
    const { data: prod } = await supabase
      .from('products')
      .select(`*, categories(name)`)
      .eq('id', productId)
      .single()

    const { data: movs } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    setProduct(prod)
    setMovements(movs || [])
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center font-bangla">লোড হচ্ছে...</div>
  if (!product) return <div className="p-8 text-center font-bangla">পণ্য পাওয়া যায়নি</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="sm" className="gap-2 font-bangla">
            <ArrowLeft className="w-4 h-4" /> ফিরে যান
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-text-primary font-bangla">{product.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary font-bangla border-b pb-2">পণ্যের তথ্য</h2>
            
            <div className="space-y-3">
              <DetailItem label="SKU" value={product.sku || 'N/A'} />
              <DetailItem label="ক্যাটেগরি" value={product.categories?.name || 'অন্যান্য'} />
              <DetailItem label="ইউনিট" value={product.unit} />
              <DetailItem label="বিক্রয় মূল্য" value={`৳${product.sell_price}`} />
              <DetailItem label="ক্রয় মূল্য" value={`৳${product.buy_price}`} />
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary font-bangla border-b pb-2">বর্তমান স্টক</h2>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-text-primary">{product.stock_qty}</div>
              <div className="text-sm text-text-secondary font-bangla">{product.unit} মজুদ আছে</div>
            </div>
            <div className="flex justify-center">
              {product.stock_qty <= product.low_stock_threshold ? (
                <Badge variant="danger" className="font-bangla">লো স্টক সতর্কতা</Badge>
              ) : (
                <Badge variant="success" className="font-bangla">স্টক পর্যাপ্ত</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary font-bangla flex items-center gap-2">
                <History className="w-5 h-5" /> স্টক মুভমেন্ট হিস্টোরি
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">তারিখ</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">টাইপ</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পরিবর্তন</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">আগের স্টক</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">পরের স্টক</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-text-secondary font-bangla">কোন মুভমেন্ট রেকর্ড নেই</td></tr>
                  ) : (
                    movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-xs text-text-secondary">
                          {new Date(mov.created_at).toLocaleDateString('bn-BD')}
                        </td>
                        <td className="p-4">
                          <MovementBadge type={mov.type} />
                        </td>
                        <td className={`p-4 font-medium ${mov.qty_change > 0 ? 'text-success' : 'text-danger'}`}>
                          {mov.qty_change > 0 ? `+${mov.qty_change}` : mov.qty_change}
                        </td>
                        <td className="p-4 text-sm">{mov.qty_before}</td>
                        <td className="p-4 text-sm font-medium">{mov.qty_after}</td>
                        <td className="p-4 text-xs text-text-secondary font-bangla">{mov.note || '-'}</td>
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

function DetailItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-secondary font-bangla">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

function MovementBadge({ type }: { type: string }) {
  const configs: any = {
    purchase: { label: 'ক্রয়', color: 'bg-success/10 text-success' },
    sale: { label: 'বিক্রি', color: 'bg-danger/10 text-danger' },
    adjustment: { label: 'সংশোধন', color: 'bg-warning/10 text-warning' },
    return: { label: 'রিটার্ন', color: 'bg-info/10 text-info' },
  }
  const config = configs[type] || { label: type, color: 'bg-gray-100 text-gray-600' }
  return <Badge className={`${config.color} font-bangla`}>{config.label}</Badge>
}
