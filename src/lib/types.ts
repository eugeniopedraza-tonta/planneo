export type Category = {
  id: string
  name: string
  slug: string
  icon_url?: string | null
}

export type ProviderStatus = 'draft' | 'pending' | 'published' | 'claimed'
export type EventType = 'bodas' | 'xv' | 'corporativo' | 'graduacion'
export type PriceRange = '$' | '$$' | '$$$'
export type PriceUnit = 'por_evento' | 'por_hora' | 'por_persona'
export type MediaType = 'photo' | 'audio' | 'video'
export type AvailabilityStatus = 'available' | 'booked' | 'tentative'
export type InquiryStatus = 'new' | 'read' | 'replied' | 'confirmed' | 'closed'
export type MenuCourse = 'entrada' | 'sopa' | 'plato_principal' | 'postre' | 'bebidas' | 'extras'

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

export type ServicePackage = {
  id: string
  provider_id: string
  name: string
  description: string | null
  price_from: number | null
  price_to: number | null
  price_unit: PriceUnit | null
  includes: string[] | null
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProviderMedia = {
  id: string
  provider_id: string
  type: MediaType
  bucket: string
  path: string
  url: string
  title: string | null
  alt_text: string | null
  mime_type: string | null
  size_bytes: number | null
  sort_order: number
  created_at: string
}

export type VenueDetails = {
  id: string
  provider_id: string
  capacity_min: number | null
  capacity_max: number | null
  address: string | null
  indoor: boolean | null
  outdoor: boolean | null
  parking: boolean | null
  catering_allowed: boolean | null
  amenities: string[] | null
  floor_plan_url: string | null
  created_at: string
  updated_at: string
}

export type CateringMenu = {
  id: string
  provider_id: string
  name: string
  description: string | null
  price_per_person: number | null
  min_guests: number | null
  event_types: EventType[] | null
  created_at: string
  updated_at: string
}

export type CateringMenuItem = {
  id: string
  menu_id: string
  course: MenuCourse | null
  name: string
  description: string | null
  sort_order: number
}

export type CateringMenuWithItems = CateringMenu & {
  catering_menu_items: CateringMenuItem[]
}

export type ProviderAvailability = {
  id: string
  provider_id: string
  date: string
  status: AvailabilityStatus
  note: string | null
  created_at: string
}

export type Inquiry = {
  id: string
  provider_id: string
  name: string
  email: string | null
  phone: string | null
  event_type: string | null
  event_date: string | null
  event_location: string | null
  guest_count: number | null
  message: string | null
  status: InquiryStatus
  access_token: string
  client_user_id: string | null
  created_at: string
  updated_at: string
}

export type InquiryMessage = {
  id: string
  inquiry_id: string
  sender: 'provider' | 'client'
  body: string
  quote_amount: number | null
  created_at: string
}

export type InquiryWithMessages = Inquiry & {
  inquiry_messages: InquiryMessage[]
}
