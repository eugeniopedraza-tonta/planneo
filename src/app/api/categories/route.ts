import { NextResponse } from 'next/server'
import { createStaticClient } from '@/lib/supabase/server'
import { CATEGORY_SLUGS, sortByCategoryTree } from '@/lib/constants'

export async function GET() {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon_url')
    .in('slug', CATEGORY_SLUGS as unknown as string[])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ categories: sortByCategoryTree(data ?? []) })
}
