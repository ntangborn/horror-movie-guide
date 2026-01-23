import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function checkColumns() {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.log('Error:', error.message)
    return
  }

  console.log('Available columns in availability_cards:')
  Object.keys(data).sort().forEach(col => console.log('  -', col))
}

checkColumns()
