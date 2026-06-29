"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Store, Phone, MapPin, CreditCard, Save, User } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    bkash_number: '',
    nagad_number: '',
    rocket_number: '',
  })
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchBusinessDetails()
  }, [])

  async function fetchBusinessDetails() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (profile?.business_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single()

      if (business) {
        setFormData({
          name: business.name,
          phone: business.phone || '',
          address: business.address || '',
          bkash_number: business.bkash_number || '',
          nagad_number: business.nagad_number || '',
          rocket_number: business.rocket_number || '',
        })
      }
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (profile?.business_id) {
      const { error } = await supabase
        .from('businesses')
        .update(formData)
        .eq('id', profile.business_id)

      if (error) showToast('error', 'ত্রুটি: ' + error.message)
      else showToast('success', 'সেটিংস সফলভাবে আপডেট করা হয়েছে!')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center font-bangla">লোড হচ্ছে...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {toast && (
        <Badge variant={toast.type === 'success' ? 'success' : 'danger'} className="fixed top-4 right-4 z-50 py-3 px-6 shadow-lg font-bangla">
          {toast.text}
        </Badge>
      )}
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-bangla">ব্যবসা সেটিংস</h1>
        <p className="text-text-secondary font-bangla text-sm">আপনার দোকানের তথ্য এবং পেমেন্ট নম্বর আপডেট করুন</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-border">
              <Store className="w-10 h-10 text-text-secondary" />
            </div>
            <h3 className="font-bold text-text-primary font-bangla">{formData.name}</h3>
            <p className="text-xs text-text-secondary font-bangla">বিজনেস ওনার</p>
            <Button variant="outline" size="sm" className="mt-4 w-full font-bangla">লোগো আপলোড</Button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-text-secondary font-bangla flex items-center gap-2">
                  <Store className="w-4 h-4" /> দোকানের নাম
                </label>
                <Input 
                  className="font-bangla" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary font-bangla flex items-center gap-2">
                  <Phone className="w-4 h-4" /> ফোন নম্বর
                </label>
                <Input 
                  className="font-bangla" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary font-bangla flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> ঠিকানা
                </label>
                <Input 
                  className="font-bangla" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-lg font-bold text-text-primary font-bangla mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> পেমেন্ট নম্বর (ইনভয়েসে প্রদর্শিত হবে)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary font-bangla">বিকাশ</label>
                  <Input 
                    className="font-bangla" 
                    value={formData.bkash_number} 
                    onChange={(e) => setFormData({ ...formData, bkash_number: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary font-bangla">নগদ</label>
                  <Input 
                    className="font-bangla" 
                    value={formData.nagad_number} 
                    onChange={(e) => setFormData({ ...formData, nagad_number: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary font-bangla">রকেট</label>
                  <Input 
                    className="font-bangla" 
                    value={formData.rocket_number} 
                    onChange={(e) => setFormData({ ...formData, rocket_number: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button className="font-bangla gap-2" onClick={handleSave} isLoading={saving}>
                <Save className="w-4 h-4" /> পরিবর্তন সংরক্ষণ করুন
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
