"use client"

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-text-primary font-bangla">লগইন ত্রুটি</h1>
        <p className="text-text-secondary font-bangla">
          আপনার লগইন লিঙ্কে কোনো সমস্যা হয়েছে অথবা লিঙ্কটি এক্সপায়ার হয়ে গেছে।
        </p>
        <Link href="/login">
          <Button className="w-full font-bangla">আবার চেষ্টা করুন</Button>
        </Link>
      </div>
    </div>
  )
}
