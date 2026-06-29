"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function QuickStartModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkProgress()
  }, [])

  async function checkProgress() {
    // In a real app, we'd fetch this from user_meta in Supabase
    // For now, we check if products exist to auto-complete step 1
    const { data: products } = await supabase.from('products').select('id')
    if (products && products.length >= 5) {
      setCompletedSteps([1])
      setCurrentStep(2)
    }
  }

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step])
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  async function handleAutoSuggest() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('business_id').eq('id', user?.id).single()
      
      const demoProducts = [
        { name: 'চিনigura চাল ৫ কেজি', sku: 'RICE-01', unit: 'bag', buy_price: 280, sell_price: 320, stock_qty: 50, business_id: profile?.business_id },
        { name: 'সয়াবিন তেল ১ লিটার', sku: 'OIL-01', unit: 'bottle', buy_price: 140, sell_price: 160, stock_qty: 100, business_id: profile?.business_id },
        { name: 'চিনি ১ কেজি', sku: 'SUGAR-01', unit: 'kg', buy_price: 110, sell_price: 130, stock_qty: 200, business_id: profile?.business_id },
        { name: 'লিপটন টি ব্যাগ', sku: 'TEA-01', unit: 'box', buy_price: 45, sell_price: 60, stock_qty: 80, business_id: profile?.business_id },
        { name: 'লাক্স সাবান', sku: 'SOAP-01', unit: 'pcs', buy_price: 35, sell_price: 45, stock_qty: 150, business_id: profile?.business_id },
      ]

      const { error } = await supabase.from('products').insert(demoProducts)
      if (error) throw error
      
      markStepComplete(1)
      // Show success toast here
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const steps = [
    {
      id: 1,
      title: "Add 5 products",
      help: "Add 5 common items (e.g., Rice, Sugar, Oil, Tea, Soap).",
      primary: "Add product",
      secondary: "Auto‑suggest 5",
      action: () => router.push('/inventory'),
      secondaryAction: handleAutoSuggest,
    },
    {
      id: 2,
      title: "Record 1 sale",
      help: "Record a quick sale for any product (qty 1) to see stock reduce automatically.",
      primary: "Record sale",
      hint: "Tip: choose 'Walk‑in' for a quick sale.",
      action: () => router.push('/sales/new'),
    },
    {
      id: 3,
      title: "Create & share invoice",
      help: "Create an invoice from the sale and share via WhatsApp.",
      primary: "Create & share",
      hint: "Invoice will include your business name and payment block.",
      action: () => router.push('/invoices'),
    },
    {
      id: 4,
      title: "Add bKash / Nagad number",
      help: "Show payment options on every invoice.",
      primary: "Add bKash / Nagad",
      secondary: "Skip for now",
      action: () => router.push('/settings'),
      secondaryAction: onClose,
    },
  ]

  const currentStepData = steps[currentStep - 1]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-[520px] rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border relative">
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close quick start"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-2xl font-bold text-text-primary font-bangla pr-8">
            Quick Start — 4 steps to try দোকান হিসাব
          </h2>
          <p className="text-sm text-text-secondary font-bangla mt-1">
            Complete these in 5 minutes and get a guided demo. (Pilot users: 3 months Pro free)
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 flex items-center gap-4">
          <div className="flex-1 flex gap-2">
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-500",
                  completedSteps.includes(s.id) ? "bg-primary" : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-text-secondary font-bangla">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 font-bold">
                {currentStep}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-text-primary font-bangla">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-text-secondary font-bangla">
                  {currentStepData.help}
                </p>
                
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button 
                    className="font-bangla gap-2" 
                    onClick={() => { markStepComplete(currentStep); currentStepData.action(); }}
                  >
                    {currentStepData.primary} <ArrowRight className="w-4 h-4" />
                  </Button>
                  {currentStepData.secondary && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-bangla" 
                      onClick={currentStepData.secondaryAction}
                      isLoading={loading}
                    >
                      {currentStepData.secondary}
                    </Button>
                  )}
                </div>
                {currentStepData.hint && (
                  <p className="text-xs text-text-secondary font-bangla mt-3 italic">
                    {currentStepData.hint}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between bg-gray-50">
          <button className="text-sm text-primary hover:underline font-bangla flex items-center gap-1">
            <HelpCircle className="w-4 h-4" /> Need help? Book a 15-min demo
          </button>
          
          <Button 
            variant="ghost" 
            className="font-bangla" 
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
