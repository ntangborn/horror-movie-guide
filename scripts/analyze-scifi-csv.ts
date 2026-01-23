import * as fs from 'fs'
import * as path from 'path'

const csvPath = path.resolve(__dirname, '../scifi_query.csv')
const csv = fs.readFileSync(csvPath, 'utf-8')
const lines = csv.trim().split('\n')

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

const header = parseCSVLine(lines[0])
console.log('Header:', header.join(' | '))
console.log('')

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

console.log('Total rows:', rows.length)
console.log('')

// Count unique films by Wikidata ID
const uniqueFilms = new Set(rows.map(r => r.film))
console.log('Unique Wikidata IDs:', uniqueFilms.size)

// Count duplicates
const duplicateCount = rows.length - uniqueFilms.size
console.log('Duplicate rows (same film, diff country/director):', duplicateCount)
console.log('')

// Check for missing data
const missingTitle = rows.filter(r => !r.filmLabel || r.filmLabel.startsWith('Q')).length
const missingYear = rows.filter(r => !r.year).length
const missingImdb = rows.filter(r => !r.imdbID).length
const missingTmdb = rows.filter(r => !r.tmdbID).length
const qCodeDirectors = rows.filter(r => r.directorLabel && r.directorLabel.startsWith('Q')).length

console.log('Data quality issues:')
console.log('  Missing/Q-code titles:', missingTitle)
console.log('  Missing year:', missingYear)
console.log('  Missing IMDB ID:', missingImdb)
console.log('  Missing TMDB ID:', missingTmdb)
console.log('  Q-code directors:', qCodeDirectors)
console.log('')

// Count with year
const withYear = rows.filter(r => r.year)
const years = withYear.map(r => parseInt(r.year)).filter(y => !isNaN(y))
if (years.length > 0) {
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  console.log('Year range:', minYear, '-', maxYear)
}

// With IMDB ID (importable)
const withImdb = rows.filter(r => r.imdbID)
const uniqueImdbIds = new Set(withImdb.map(r => r.imdbID))
console.log('')
console.log('Rows with IMDB ID:', withImdb.length)
console.log('Unique IMDB IDs:', uniqueImdbIds.size)
console.log('')

// Deduplicated view - group by film, keep best data
const filmMap = new Map<string, any>()
for (const row of rows) {
  const existing = filmMap.get(row.film)
  if (!existing) {
    filmMap.set(row.film, {
      ...row,
      countries: row.countryLabel ? [row.countryLabel] : [],
      directors: row.directorLabel && !row.directorLabel.startsWith('Q') ? [row.directorLabel] : []
    })
  } else {
    // Merge data - keep non-empty values
    if (!existing.filmLabel || existing.filmLabel.startsWith('Q')) existing.filmLabel = row.filmLabel
    if (!existing.year) existing.year = row.year
    if (!existing.imdbID) existing.imdbID = row.imdbID
    if (!existing.tmdbID) existing.tmdbID = row.tmdbID
    if (row.countryLabel && !existing.countries.includes(row.countryLabel)) {
      existing.countries.push(row.countryLabel)
    }
    if (row.directorLabel && !row.directorLabel.startsWith('Q') && !existing.directors.includes(row.directorLabel)) {
      existing.directors.push(row.directorLabel)
    }
  }
}

const deduplicated = Array.from(filmMap.values())
console.log('After deduplication:', deduplicated.length, 'unique films')

// Stats on deduplicated
const dedupWithTitle = deduplicated.filter(r => r.filmLabel && !r.filmLabel.startsWith('Q'))
const dedupWithYear = deduplicated.filter(r => r.year)
const dedupWithImdb = deduplicated.filter(r => r.imdbID)
const dedupImportable = deduplicated.filter(r => r.imdbID && r.filmLabel && !r.filmLabel.startsWith('Q'))

console.log('  With proper title:', dedupWithTitle.length)
console.log('  With year:', dedupWithYear.length)
console.log('  With IMDB ID:', dedupWithImdb.length)
console.log('  Importable (title + IMDB):', dedupImportable.length)
