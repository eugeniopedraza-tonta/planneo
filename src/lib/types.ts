export type Category = {
  id: string
  name: string
  slug: string
  icon_url?: string | null
}

export type ProviderStatus = 'draft' | 'published' | 'claimed'
export type EventType = 'bodas' | 'xv' | 'corporativo' | 'graduacion'
export type PriceRange = '$' | '$$' | '$$$'

export type Provider = {
  id: string
  slug: string
  name: string
  category_id: string | null
  status: ProviderStatus
  claimed_by: string | null
  whatsapp: string | null
  email: string | null
  description: string | null
  zona: string | null
  event_types: EventType[] | null
  photos: string[] | null
  instagram_handle: string | null
  price_range: PriceRange | null
  created_at: string
  updated_at: string
}

export type ProviderWithCategory = Provider & {
  categories: Category | null
}

export type Lead = {
  id: string
  provider_id: string | null
  type: 'whatsapp_click' | 'profile_view'
  session_id: string | null
  referrer: string | null
  created_at: string
}

export type ClaimToken = {
  id: string
  provider_id: string | null
  token: string
  expires_at: string
  used_at: string | null
}
