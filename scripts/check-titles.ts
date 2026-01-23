import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function check() {
  // Check specific titles that keep appearing
  const imdbIds = ['tt9000310', 'tt38263629', 'tt33003764', 'tt35849306']

  for (const imdbId of imdbIds) {
    const { data } = await supabase
      .from('availability_cards')
      .select('title, year, watchmode_id, availability_checked_at, poster_url, sources')
      .eq('imdb_id', imdbId)
      .single()

    if (data) {
      console.log(`${data.title} (${data.year}):`)
      console.log(`  watchmode_id: ${data.watchmode_id || 'null'}`)
      console.log(`  availability_checked_at: ${data.availability_checked_at || 'null'}`)
      console.log(`  poster_url: ${data.poster_url ? 'SET' : 'null'}`)
      console.log(`  sources: ${data.sources && Array.isArray(data.sources) && data.sources.length > 0 ? 'SET' : 'null/empty'}`)
      console.log('')
    }
  }
}

check()
