import { createClient } from '@/lib/supabase/client'
import { useRef } from 'react'

export function useBusinessId() {
  const supabase = createClient()
  const cachedBusinessId = useRef<string | null>(null)

  const getBusinessId = async (): Promise<string | null> => {
    if (cachedBusinessId.current) return cachedBusinessId.current

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single()

    cachedBusinessId.current = profile?.business_id || null
    return cachedBusinessId.current
  }

  const clearCache = () => {
    cachedBusinessId.current = null
  }

  return { getBusinessId, clearCache }
}