import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function check() {
  console.log('=== Users Table ===')
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  console.log('Total users in public.users:', count)
  if (data) {
    data.forEach(u => {
      console.log('  -', u.email, '| created:', u.created_at, '| last_active:', u.last_active)
    })
  }
  if (error) console.log('Error:', error.message)

  console.log('\n=== Auth Users (Supabase Auth) ===')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  if (authData) {
    console.log('Total auth users:', authData.users.length)
    authData.users.forEach(u => {
      console.log('  -', u.email, '| id:', u.id, '| created:', u.created_at)
    })
  }
  if (authError) console.log('Auth error:', authError.message)
}

check()
