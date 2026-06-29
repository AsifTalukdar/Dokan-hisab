"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, Phone, MapPin, Mail, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (!error) setClients(data)
    setLoading(false)
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-bangla">কাস্টমার তালিকা/Clients</h1>
          <p className="text-text-secondary font-bangla text-sm">আপনার সকল কাস্টমারের হিসাব এবং বকেয়া ট্র্যাক করুন</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="font-bangla gap-2">
          <Plus className="w-4 h-4" /> নতুন কাস্টমার যোগ করুন
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <Input 
          className="pl-10 font-bangla" 
          placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center p-8 font-bangla">লোড হচ্ছে...</div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full text-center p-8 font-bangla">কোন কাস্টমার পাওয়া যায়নি</div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-text-secondary">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingClient(client); setIsModalOpen(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={async () => { if(confirm('মুছে ফেলতে চান?')) { await supabase.from('clients').delete().eq('id', client.id); fetchClients(); } }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-text-primary font-bangla mb-3">{client.name}</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone className="w-4 h-4" /> {client.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4" /> {client.address || 'ঠিকানা নেই'}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail className="w-4 h-4" /> {client.email || 'ইমেইল নেই'}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm font-medium text-text-secondary font-bangla">মোট বকেয়া:</span>
                <span className={cn("text-lg font-bold font-bangla", client.total_due > 0 ? "text-danger" : "text-success")}>
                  ৳{client.total_due}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ClientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          client={editingClient} 
          onSuccess={fetchClients} 
        />
      )}
    </div>
  )
}

function ClientModal({ isOpen, onClose, client, onSuccess }: any) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    address: client?.address || '',
    email: client?.email || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('clients')
      .upsert({
        id: client?.id,
        ...formData,
      })

    if (error) {
      alert('ত্রুটি: ' + error.message)
    } else {
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary font-bangla">
            {client ? 'কাস্টমার এডিট করুন' : 'নতুন কাস্টমার যোগ করুন'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-1">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">নাম *</label>
            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="কাস্টমারের নাম" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">ফোন নম্বর</label>
            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="017XXXXXXXX" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">ঠিকানা</label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="ঠিকানা লিখুন" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-bangla">ইমেইল</label>
            <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
          </div>

          <div className="pt-6 flex gap-3">
            <Button variant="outline" className="flex-1 font-bangla" onClick={onClose}>বাতিল</Button>
            <Button type="submit" className="flex-1 font-bangla" isLoading={loading}>সংরক্ষণ</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function X(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
