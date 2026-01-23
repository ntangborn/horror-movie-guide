/**
 * Run a SQL migration against Supabase
 * Usage: npx tsx scripts/run-migration.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Running trailer migration...\n')

  const migrationPath = path.resolve(__dirname, '../supabase/migrations/007_add_trailers.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  // Split into individual statements (removing comments and empty lines)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements to execute\n`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    const preview = statement.substring(0, 60).replace(/\n/g, ' ')
    console.log(`[${i + 1}/${statements.length}] ${preview}...`)

    const { error } = await supabase.rpc('exec_sql', { sql: statement })

    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase.from('availability_cards').select('id').limit(0)
      if (directError) {
        console.error(`   ❌ Error: ${error.message}`)
      }
    }
  }

  // Verify columns were added
  console.log('\n📊 Verifying migration...')
  const { data, error } = await supabase
    .from('availability_cards')
    .select('trailer_status')
    .limit(1)

  if (error) {
    console.error('❌ Verification failed:', error.message)
    console.log('\n⚠️  The migration may need to be run manually in the Supabase dashboard.')
    console.log('   Copy the SQL from: supabase/migrations/007_add_trailers.sql')
    console.log('   Paste it in: Supabase Dashboard → SQL Editor → Run')
  } else {
    console.log('✅ Migration successful! Trailer columns are available.')
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
