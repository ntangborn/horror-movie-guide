import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
  console.log('Checking Analytics Tables...\n')

  // Test the same queries the analytics API uses
  console.log('=== Testing Analytics API Queries ===\n')

  // Total clicks
  const { count: totalClicks, error: totalError } = await supabase
    .from('click_events')
    .select('*', { count: 'exact', head: true })

  console.log('Total clicks:', totalClicks, totalError ? 'Error: ' + totalError.message : '')

  // By service
  const { data: clickData } = await supabase
    .from('click_events')
    .select('service')

  if (clickData) {
    const counts: Record<string, number> = {}
    clickData.forEach((row: { service: string }) => {
      counts[row.service] = (counts[row.service] || 0) + 1
    })
    console.log('By service:', counts)
  }

  // Unique users
  const { data: uniqueUsers } = await supabase
    .from('click_events')
    .select('user_id')
    .not('user_id', 'is', null)

  const uniqueUserCount = uniqueUsers
    ? new Set(uniqueUsers.map((u: { user_id: string }) => u.user_id)).size
    : 0
  console.log('Unique users:', uniqueUserCount)

  // Unique sessions
  const { data: uniqueSessions } = await supabase
    .from('click_events')
    .select('session_id')
    .not('session_id', 'is', null)

  const uniqueSessionCount = uniqueSessions
    ? new Set(uniqueSessions.map((s: { session_id: string }) => s.session_id)).size
    : 0
  console.log('Unique sessions:', uniqueSessionCount)

  console.log('\n=== click_events ===')
  const { data: clickDataFull, error: clickError, count: clickCount } = await supabase
    .from('click_events')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (clickError) {
    console.log('Error:', clickError.message)
  } else {
    console.log('Total rows:', clickCount)
    console.log('Sample data:', JSON.stringify(clickData, null, 2))
  }

  // Check session_events
  console.log('\n=== session_events ===')
  const { data: sessionData, error: sessionError, count: sessionCount } = await supabase
    .from('session_events')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (sessionError) {
    console.log('Error:', sessionError.message)
  } else {
    console.log('Total rows:', sessionCount)
    console.log('Sample data:', JSON.stringify(sessionData, null, 2))
  }


  // Check users table
  console.log('\n=== users table ===')
  const { data: userData, error: userError, count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (userError) {
    console.log('Error:', userError.message)
  } else {
    console.log('Total users:', userCount)
    console.log('Sample:', userData?.map(u => ({ id: u.id, email: u.email })))
  }
}

check()
