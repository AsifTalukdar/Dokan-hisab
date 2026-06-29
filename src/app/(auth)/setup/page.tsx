"use client"

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Store, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    bkash_number: '',
    nagad_number: '',
    rocket_number: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // 1. Create the business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name,
          owner_id: user.id,
          phone: formData.phone,
          address: formData.address,
          bkash_number: formData.bkash_number,
          nagad_number: formData.nagad_number,
          rocket_number: formData.rocket_number,
        })
        .select()
        .single()

      if (bizError) throw bizError

      // 2. Link business to profile
      const { error: profError } = await supabase
        .from('profiles')
        .update({ business_id: business.id })
        .eq('id', user.id)

      if (profError) throw profError

      setMessage({ type: 'success', text: 'আপনার ব্যবসার প্রোফাইল তৈরি হয়েছে!' })
      setTimeout(() => router.push('/'), 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'কিছু ভুল হয়েছে, দয়া করে আবার চেষ্টা করুন।' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-bangla mb-2">ব্যবসার প্রোফাইল সেটআপ</h1>
          <p className="text-text-secondary font-bangla">আপনার দোকানের তথ্য দিয়ে শুরু করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              দোকানের নাম *
            </label>
            <Input 
              placeholder="যেমন: রহমান স্টোর" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              মোবাইল নম্বর *
            </label>
            <Input 
              placeholder="017XXXXXXXX" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              ঠিকানা
            </label>
            <Input 
              placeholder="মিরপুর-১০, ঢাকা" 
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              বিকাশ নম্বর
            </label>
            <Input 
              placeholder="017XXXXXXXX" 
              value={formData.bkash_number} 
              onChange={(e) => setFormData({ ...formData, bkash_number: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              নগদ নম্বর
            </label>
            <Input 
              placeholder="017XXXXXXXX" 
              value={formData.nagad_number} 
              onChange={(e) => setFormData({ ...formData, nagad_number: e.target.value })} 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              রকেট নম্বর
            </label>
            <Input 
              placeholder="017XXXXXXXX" 
              value={formData.rocket_number} 
              onChange={(e) => setFormData({ ...formData, rocket_number: e.target.value })} 
            />
          </div>

          {message && (
            <div className="md:col-span-2">
              <Badge 
                variant={message.type === 'success' ? 'success' : 'danger'} 
                className="w-full justify-center py-2 text-sm font-bangla"
              >
                {message.text}
              </Badge>
            </div>
          )}

          <div className="md:col-span-2">
            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-bangla" 
              isLoading={loading}
            >
              সেটআপ সম্পন্ন করুন
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
