"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Download, Printer, ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const supabase = createClient()
  
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')

  useEffect(() => {
    fetchInvoiceData()
  }, [invoiceId])

  async function fetchInvoiceData() {
    setLoading(true)
    try {
      const { data: inv } = await supabase
        .from('invoices')
        .select(`*, clients(*), invoice_items(*)`)
        .eq('id', invoiceId)
        .single()
      setInvoice(inv)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  async function markAsPaid() {
    if (!invoice) return
    setUpdating(true)
    try {
      // Step 1: Insert into payments — trigger handles everything else
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          business_id: invoice.business_id,
          invoice_id: invoiceId,
          client_id: invoice.client_id || null,
          amount: invoice.due_amount,
          method: paymentMethod,
        })

      if (paymentError) throw paymentError

      // Step 2: Update status only — amounts already handled by trigger
      const { error: statusError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)

      if (statusError) throw statusError
      
      setInvoice({ ...invoice, status: 'paid', due_amount: 0, paid_amount: invoice.total })
      showToast('success', 'পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে')
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setUpdating(false)
    }
  }

  function handleWhatsAppShare() {
    const pdfUrl = `${window.location.origin}/api/invoice/${invoiceId}/pdf`
    const clientName = invoice.clients?.name || 'কাস্টমার'
    const msg = encodeURIComponent(
      `${clientName} ভাই, আপনার ইনভয়েস নং ${invoice.invoice_number} এর কপি:\n${pdfUrl}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) return <div className="p-8 text-center font-bangla">লোড হচ্ছে...</div>
  if (!invoice) return <div className="p-8 text-center font-bangla">ইনভয়েস পাওয়া যায়নি</div>

  return (
    <div className="space-y-6 relative">
      {toast && (
        <Badge variant={toast.type === 'success' ? 'success' : 'danger'} className="fixed top-4 right-4 z-50 py-3 px-6 shadow-lg font-bangla">
          {toast.text}
        </Badge>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="gap-2 font-bangla">
              <ArrowLeft className="w-4 h-4" /> ফিরে যান
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-bangla">ইনভয়েস ডিটেইলস</h1>
            <p className="text-sm text-text-secondary font-bangla">নম্বর: {invoice.invoice_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="font-bangla gap-2" 
            onClick={() => window.open(`/api/invoice/${invoiceId}/pdf`, '_blank')}
          >
            <Download className="w-4 h-4" /> ডাউনলোড PDF
          </Button>
          <Button
            variant="outline"
            className="font-bangla gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            onClick={handleWhatsAppShare}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          {invoice.status !== 'paid' && (
            <div className="flex items-center gap-3">
              <select
                className="h-9 px-3 rounded-md border border-border bg-surface text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {['cash', 'bkash', 'nagad', 'rocket', 'bank'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <Button className="font-bangla gap-2" onClick={markAsPaid} isLoading={updating}>
                <CheckCircle2 className="w-4 h-4" /> পেইড মার্ক করুন
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary font-bangla border-b pb-2">ইনভয়েস তথ্য</h2>
            <div className="space-y-3">
              <DetailRow label="কাস্টমার" value={invoice.clients?.name || 'সাধারণ কাস্টমার'} />
              <DetailRow label="তারিখ" value={format(new Date(invoice.issue_date), 'dd MMM yyyy')} />
              <DetailRow label="ডিউ ডেট" value={invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : 'N/A'} />
              <DetailRow label="স্ট্যাটাস" value={<Badge variant={invoice.status === 'paid' ? 'success' : 'warning'} className="font-bangla">{invoice.status}</Badge>} />
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary font-bangla border-b pb-2">হিসাব</h2>
            <div className="space-y-3">
              <DetailRow label="সাবটোটাল" value={`৳${invoice.subtotal}`} />
              <DetailRow label="ডিসকাউন্ট" value={`৳${invoice.discount}`} />
              <DetailRow label="ট্যাক্স" value={`৳${invoice.tax}`} />
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="font-bold text-text-primary font-bangla">মোট টাকা:</span>
                <span className="text-xl font-bold text-primary font-bangla">৳{invoice.total}</span>
              </div>
              <div className="flex justify-between items-center text-danger font-bold font-bangla">
                <span>বকেয়া:</span>
                <span>৳{invoice.due_amount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary font-bangla">বিল আইটেম</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla">বিবরণ</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla text-center">পরিমাণ</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla text-right">মূল্য</th>
                    <th className="p-4 text-sm font-medium text-text-secondary font-bangla text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.invoice_items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-text-primary font-bangla">{item.description}</td>
                      <td className="p-4 text-center">{item.qty} {item.unit}</td>
                      <td className="p-4 text-right">৳{item.unit_price}</td>
                      <td className="p-4 text-right font-medium">৳{item.total}</td>
                    </tr>
                  ))}
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
