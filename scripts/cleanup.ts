import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function cleanup() {
  console.log('🧹 Cleaning up database...')

  // Delete all entries
  const { error } = await supabase
    .from('availability_cards')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log(`✅ Deleted all entries`)
  }

  // Verify count
  const { count: remaining } = await supabase
    .from('availability_cards')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Remaining entries: ${remaining}`)
}

cleanup().then(() => process.exit(0)).catch(console.error)
