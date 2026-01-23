import * as fs from 'fs'
import * as path from 'path'

const inputPath = path.resolve(__dirname, '../scifi_query.csv')
const outputPath = path.resolve(__dirname, '../scifi_cleaned.csv')

// Parse CSV properly (handle commas in quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Escape CSV field (quote if contains comma, quote, or newline)
function escapeCSV(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

console.log('🎬 Sci-Fi CSV Cleanup Script')
console.log('=' .repeat(50))
console.log('')

// Read input
const csv = fs.readFileSync(inputPath, 'utf-8')
const lines = csv.trim().split('\n')

console.log(`📥 Reading ${inputPath}`)
console.log(`   Total rows: ${lines.length - 1}`)
console.log('')

// Parse rows
const rows = lines.slice(1).map(line => {
  const values = parseCSVLine(line)
  return {
    film: values[0] || '',
    filmLabel: values[1] || '',
    year: values[2] || '',
    imdbID: values[3] || '',
    tmdbID: values[4] || '',
    countryLabel: values[5] || '',
    directorLabel: values[6] || ''
  }
})

// Step 1: Deduplicate by Wikidata ID, merging data
console.log('🔄 Step 1: Deduplicating by Wikidata ID...')

interface MergedFilm {
  wikidataId: string
  title: string
  year: string
  imdbId: string
  tmdbId: string
  countries: string[]
  directors: string[]
}

const filmMap = new Map<string, MergedFilm>()

for (const row of rows) {
  const existing = filmMap.get(row.film)

  if (!existing) {
    // New film - create entry
    filmMap.set(row.film, {
      wikidataId: row.film.replace('http://www.wikidata.org/entity/', ''),
      title: row.filmLabel && !row.filmLabel.startsWith('Q') ? row.filmLabel : '',
      year: row.year,
      imdbId: row.imdbID,
      tmdbId: row.tmdbID,
      countries: row.countryLabel ? [row.countryLabel] : [],
      directors: row.directorLabel && !row.directorLabel.startsWith('Q') ? [row.directorLabel] : []
    })
  } else {
    // Merge data - keep non-empty values, accumulate countries/directors
    if (!existing.title && row.filmLabel && !row.filmLabel.startsWith('Q')) {
      existing.title = row.filmLabel
    }
    if (!existing.year && row.year) {
      existing.year = row.year
    }
    if (!existing.imdbId && row.imdbID) {
      existing.imdbId = row.imdbID
    }
    if (!existing.tmdbId && row.tmdbID) {
      existing.tmdbId = row.tmdbID
    }
    if (row.countryLabel && !existing.countries.includes(row.countryLabel)) {
      existing.countries.push(row.countryLabel)
    }
    if (row.directorLabel && !row.directorLabel.startsWith('Q') && !existing.directors.includes(row.directorLabel)) {
      existing.directors.push(row.directorLabel)
    }
  }
}

const deduplicated = Array.from(filmMap.values())
console.log(`   Deduplicated: ${deduplicated.length} unique films`)

// Step 2: Filter to importable records
console.log('')
console.log('🔍 Step 2: Filtering to importable records...')

const importable = deduplicated.filter(film => {
  // Must have proper title (not empty, not Q-code)
  if (!film.title || film.title.startsWith('Q')) return false
  // Must have IMDB ID
  if (!film.imdbId) return false
  return true
})

console.log(`   Importable: ${importable.length} films (have title + IMDB ID)`)

// Step 3: Additional cleanup
console.log('')
console.log('🧹 Step 3: Cleaning up data...')

const cleaned = importable.map(film => {
  // Clean up year (some have invalid years like 2115)
  let year = film.year
  const yearNum = parseInt(year)
  if (isNaN(yearNum) || yearNum < 1880 || yearNum > 2030) {
    year = ''
  }

  // Clean up IMDB ID (ensure it starts with tt)
  let imdbId = film.imdbId
  if (imdbId && !imdbId.startsWith('tt')) {
    imdbId = 'tt' + imdbId
  }

  return {
    ...film,
    year,
    imdbId,
    // Join multiple countries/directors with semicolon
    country: film.countries.slice(0, 3).join('; '), // Limit to 3
    director: film.directors.slice(0, 3).join('; ') // Limit to 3
  }
})

// Count stats
const withYear = cleaned.filter(f => f.year).length
const withTmdb = cleaned.filter(f => f.tmdbId).length
const withCountry = cleaned.filter(f => f.country).length
const withDirector = cleaned.filter(f => f.director).length

console.log(`   With year: ${withYear}`)
console.log(`   With TMDB ID: ${withTmdb}`)
console.log(`   With country: ${withCountry}`)
console.log(`   With director: ${withDirector}`)

// Step 4: Output clean CSV
console.log('')
console.log('📤 Step 4: Writing cleaned CSV...')

const header = 'imdb_id,title,year,tmdb_id,country,director,wikidata_id'
const csvLines = cleaned.map(film => {
  return [
    escapeCSV(film.imdbId),
    escapeCSV(film.title),
    escapeCSV(film.year),
    escapeCSV(film.tmdbId),
    escapeCSV(film.country),
    escapeCSV(film.director),
    escapeCSV(film.wikidataId)
  ].join(',')
})

const output = [header, ...csvLines].join('\n')
fs.writeFileSync(outputPath, output)

console.log(`   Written to: ${outputPath}`)
console.log(`   Total records: ${cleaned.length}`)

// Summary
console.log('')
console.log('=' .repeat(50))
console.log('✅ CLEANUP COMPLETE')
console.log('=' .repeat(50))
console.log('')
console.log('Summary:')
console.log(`  Input:  ${rows.length} rows`)
console.log(`  Output: ${cleaned.length} clean, importable records`)
console.log('')
console.log(`Removed:`)
console.log(`  - ${rows.length - deduplicated.length} duplicate rows (merged)`)
console.log(`  - ${deduplicated.length - importable.length} records without title or IMDB ID`)
console.log('')
console.log(`Output file: scifi_cleaned.csv`)
