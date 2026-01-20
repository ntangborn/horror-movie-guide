import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Admin email list
const ADMIN_EMAILS = ['ntangborn@gmail.com', 'admin@example.com']

// Auth client for checking user session
async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}

// Service client for admin operations (bypasses RLS)
function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

/**
 * POST /api/admin/lists
 * Create a new curated list
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, slug, description, cover_image, cards, featured, published } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('curated_lists')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'A list with this slug already exists' }, { status: 409 })
    }

    // Insert new list
    const { data, error: insertError } = await supabase
      .from('curated_lists')
      .insert({
        title,
        slug,
        description: description || '',
        cover_image: cover_image || null,
        cards: cards || [],
        type: 'editorial',
        author: user.email,
        featured: featured || false,
        published: published || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, list: data })
  } catch (error) {
    console.error('Create list error:', error)
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/lists
 * Update an existing curated list
 */
export async function PUT(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, slug, description, cover_image, cards, featured, published } = body

    if (!id) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = createAdminClient()

    // Check if slug already exists (for a different list)
    if (slug) {
      const { data: existing } = await supabase
        .from('curated_lists')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'A list with this slug already exists' }, { status: 409 })
      }
    }

    // Update list
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (cover_image !== undefined) updateData.cover_image = cover_image
    if (cards !== undefined) updateData.cards = Array.from(new Set(cards)) // Dedupe
    if (featured !== undefined) updateData.featured = featured
    if (published !== undefined) updateData.published = published

    const { data, error: updateError } = await supabase
      .from('curated_lists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, list: data })
  } catch (error) {
    console.error('Update list error:', error)
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/lists
 * Delete curated lists
 */
export async function DELETE(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'List IDs are required' }, { status: 400 })
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = createAdminClient()

    const { error: deleteError } = await supabase
      .from('curated_lists')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error) {
    console.error('Delete list error:', error)
    return NextResponse.json({ error: 'Failed to delete lists' }, { status: 500 })
  }
}
