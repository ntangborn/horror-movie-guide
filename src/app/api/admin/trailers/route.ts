import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * PATCH /api/admin/trailers
 * Update trailer status (approve/reject)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('availability_cards')
      .update({
        trailer_status: status,
        trailer_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating trailer status:', error)
      return NextResponse.json(
        { error: 'Failed to update trailer status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id, status })
  } catch (error) {
    console.error('Error in PATCH /api/admin/trailers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/trailers/bulk
 * Bulk approve trailers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid ids array' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('availability_cards')
      .update({
        trailer_status: status,
        trailer_reviewed_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) {
      console.error('Error bulk updating trailer status:', error)
      return NextResponse.json(
        { error: 'Failed to bulk update trailer status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, count: ids.length, status })
  } catch (error) {
    console.error('Error in POST /api/admin/trailers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
