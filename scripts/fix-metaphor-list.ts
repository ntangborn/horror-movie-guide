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
  { wrong: 'ccb01adb-1607-4214-a794-58d3308e4ab4', correct: '1c522b5a-bd12-401e-87f8-6054e101d367', name: 'The Host (2013 -> 2007)' },
  { wrong: '02866387-f81d-401c-bd52-64ab79fb6284', correct: '8626dd82-b7c6-4ec9-bb42-8899bc160e03', name: 'The Fly (1958 -> 1987)' },
  { wrong: 'e59ae87f-eb2a-4ff8-b54d-54cae00046e7', correct: '0bec54bc-20d8-4cbc-a7fd-0fbc4d96666f', name: 'Candyman (2021 -> 1993)' },
  { wrong: '57ba110d-1df6-4c13-be62-570871922cd1', correct: '82b24536-427b-412f-9ead-884b1dd4c979', name: 'Society (Justice Society -> Society 1992)' },
]

async function fixList() {
  const { data: list, error: fetchError } = await supabase
    .from('curated_lists')
    .select('cards')
    .eq('slug', 'monsters-as-metaphor')
    .single()

  if (fetchError || !list) {
    console.log('Error fetching list:', fetchError?.message)
    return
  }

  console.log('Current cards:', list.cards.length)

  let newCards = [...(list.cards as string[])]

  for (const fix of fixes) {
    const idx = newCards.indexOf(fix.wrong)
    if (idx !== -1) {
      newCards[idx] = fix.correct
      console.log('✓ Fixed:', fix.name)
    } else {
      console.log('○ Not found:', fix.name)
    }
  }

  const { error: updateError } = await supabase
    .from('curated_lists')
    .update({ cards: newCards, updated_at: new Date().toISOString() })
    .eq('slug', 'monsters-as-metaphor')

  if (updateError) {
    console.log('Error updating:', updateError.message)
  } else {
    console.log('\n✅ List fixed!')
  }
}

fixList()
