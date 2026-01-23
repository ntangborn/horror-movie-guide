import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function fixList() {
  // Get current list
  const { data: list, error: fetchError } = await supabase
    .from('curated_lists')
    .select('cards')
    .eq('slug', 'aging-monsters')
    .single()

  if (fetchError || !list) {
    console.log('Error fetching list:', fetchError?.message)
    return
  }

  console.log('Current cards:', list.cards.length)

  const wrongId = '1b3821ae-df4e-456c-996d-c1a8d5691c97' // Dracula: A Love Tale (2025)
  const correctId = '309db6a2-80d7-41d5-9f39-1c14371da7e1' // Bram Stoker's Dracula (1993)

  // Replace wrong with correct
  let newCards = (list.cards as string[]).filter((id: string) => id !== wrongId)
  if (!newCards.includes(correctId)) {
    newCards.push(correctId)
  }

  console.log('New cards:', newCards.length)

  // Update list
  const { error: updateError } = await supabase
    .from('curated_lists')
    .update({ cards: newCards, updated_at: new Date().toISOString() })
    .eq('slug', 'aging-monsters')

  if (updateError) {
    console.log('Error updating:', updateError.message)
  } else {
    console.log('✅ Fixed! Replaced wrong Dracula with Bram Stoker\'s Dracula')
  }
}

fixList()
