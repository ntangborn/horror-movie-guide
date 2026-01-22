import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
  const searchTerm = process.argv[2] || 'wicker man'

  const { data, error } = await supabase
    .from('availability_cards')
    .select('id, title, year, trailer_status, trailer_youtube_id, trailer_video_title')
    .ilike('title', '%' + searchTerm + '%')

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('Search results for "' + searchTerm + '":\n')
  for (const row of data || []) {
    console.log(row.title + ' (' + row.year + ')')
    console.log('  ID: ' + row.id)
    console.log('  trailer_status: ' + (row.trailer_status || '(null)'))
    console.log('  trailer_youtube_id: ' + (row.trailer_youtube_id || '(null)'))
    console.log('  trailer_video_title: ' + (row.trailer_video_title || '(null)'))
    console.log('')
  }
}

check()
