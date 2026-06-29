import { createClient } from '@/lib/supabase/client'

let cachedBusinessId: string | null = null

export function useBusinessId() {
  const supabase = createClient()
  
  const getBusinessId = async (): Promise<string | null> => {
    if (cachedBusinessId) return cachedBusinessId

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single()

    cachedBusinessId = profile?.business_id || null
    return cachedBusinessId
  }

  const clearCache = () => {
    cachedBusinessId = null
  }

  return { getBusinessId, clearCache }
}
