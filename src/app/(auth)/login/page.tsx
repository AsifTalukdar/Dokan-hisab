"use client"

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'একটি লগইন লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে চেক করুন।' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'কিছু ভুল হয়েছে, দয়া করে আবার চেষ্টা করুন।' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary font-bangla mb-2">দোকান হিসাব</h1>
          <p className="text-text-secondary font-bangla">আপনার ব্যবসার হিসাব এখন আরও সহজ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla block">
              ইমেইল অ্যাড্রেস
            </label>
            <Input 
              type="email" 
              placeholder="example@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          {message && (
            <Badge 
              variant={message.type === 'success' ? 'success' : 'danger'} 
              className="w-full justify-center py-2 text-sm font-bangla"
            >
              {message.text}
            </Badge>
          )}

          <Button 
            type="submit" 
            className="w-full py-6 text-lg font-bangla" 
            isLoading={loading}
          >
            লগইন করুন
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary font-bangla">
            সহায়তার জন্য যোগাযোগ করুন: <span className="font-semibold">support@dokanhisab.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
