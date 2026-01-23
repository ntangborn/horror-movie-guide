import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Wrong -> Correct mappings
const fixes = [
  { wrong: 'a8c40117-d916-4e82-af52-0772c4d25f7c', correct: 'a9fc29e7-7b07-403f-b5d3-c2c014b7d1f2', name: 'The Ring Virus -> The Ring (2002)' },
  { wrong: 'b0b93e4c-9cb8-44a5-be57-7111d5609509', correct: 'd083cf19-d834-46bb-bd0c-58a75894e294', name: 'File Under Misc -> Cell (2016)' },
]

// IDs to remove (wrong matches with no correct version in DB)
const toRemove = [
  { id: 'e913a0e6-7dba-4c6a-88c6-184d84c2f22b', name: 'Christine (1983) - wrong film, 2016 not in DB' },
  { id: '4d10ccd1-bf0b-4b47-aafa-ddca7a22dbd7', name: 'Impulse (1984) - wrong film, Kairo not in DB' },
]

async function fixList() {
  const { data: list, error: fetchError } = await supabase
    .from('curated_lists')
    .select('cards')
    .eq('slug', 'media-panic-horror')
    .single()

  if (fetchError || !list) {
    console.log('Error fetching list:', fetchError?.message)
    return
  }

  console.log('Current cards:', list.cards.length)

  let newCards = [...(list.cards as string[])]

  // Apply fixes
  for (const fix of fixes) {
    const idx = newCards.indexOf(fix.wrong)
    if (idx !== -1) {
      newCards[idx] = fix.correct
      console.log('✓ Fixed:', fix.name)
    } else {
      console.log('○ Not found:', fix.name)
    }
  }

  // Remove wrong matches
  for (const item of toRemove) {
    const idx = newCards.indexOf(item.id)
    if (idx !== -1) {
      newCards.splice(idx, 1)
      console.log('✗ Removed:', item.name)
    }
  }

  console.log('New cards:', newCards.length)

  const { error: updateError } = await supabase
    .from('curated_lists')
    .update({ cards: newCards, updated_at: new Date().toISOString() })
    .eq('slug', 'media-panic-horror')

  if (updateError) {
    console.log('Error updating:', updateError.message)
  } else {
    console.log('\n✅ List fixed!')
  }
}

fixList()
