# Scripts

This directory contains utility scripts for managing the Horror Movie Guide database.

## seed-from-csv.ts

Seeds the database with horror films from a Wikidata export CSV.

### Prerequisites

1. **Supabase Service Key**: You need the service role key (not the anon key) for admin access.

   Add to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

2. **CSV File**: Place `query.csv` in the project root directory.

### Expected CSV Format

The CSV should have these columns (order doesn't matter):

| Column | Required | Description |
|--------|----------|-------------|
| imdb_id | Yes | IMDB ID (e.g., tt0087800) |
| title | Yes | Film title |
| year | Yes | Release year (or full date) |
| director | No | Director name |
| country | No | Country of origin |
| runtime | No | Runtime in minutes |
| rt_id | No | Rotten Tomatoes ID |

See `sample-query.csv` for an example.

### Getting Horror Films from Wikidata

Run this SPARQL query at https://query.wikidata.org/:

```sparql
SELECT DISTINCT ?imdb_id ?title ?year ?director ?country ?runtime
WHERE {
  ?film wdt:P31 wd:Q11424 .           # Instance of film
  ?film wdt:P136 wd:Q200092 .         # Genre: horror
  ?film wdt:P345 ?imdb_id .           # Has IMDB ID
  ?film rdfs:label ?title .
  FILTER(LANG(?title) = "en")

  OPTIONAL { ?film wdt:P577 ?date . }
  BIND(YEAR(?date) AS ?year)

  OPTIONAL {
    ?film wdt:P57 ?directorEntity .
    ?directorEntity rdfs:label ?director .
    FILTER(LANG(?director) = "en")
  }

  OPTIONAL {
    ?film wdt:P495 ?countryEntity .
    ?countryEntity rdfs:label ?country .
    FILTER(LANG(?country) = "en")
  }

  OPTIONAL { ?film wdt:P2047 ?runtime . }
}
ORDER BY DESC(?year)
```

Export as CSV and save as `query.csv` in the project root.

### Running the Seed Script

```bash
# Install dependencies first
npm install

# Run the seed script
npm run seed

# Or run directly with ts-node
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-from-csv.ts
```

### What It Does

1. Reads the CSV file and parses all rows
2. Validates each row (requires valid IMDB ID, title, year)
3. Checks Supabase for existing entries to avoid duplicates
4. Inserts new entries in batches of 100
5. Logs progress every 100 titles
6. Reports final statistics

### Expected Output

```
🎬 Horror Movie Guide - CSV Seed Script
==================================================

📁 Reading CSV file: .../query.csv

📊 Parsed 14,932 rows from CSV

🔄 Processing rows...

✅ Valid cards created: 12,847
⏭️ Skipped (no valid IMDB ID): 2,085

🔍 Checking for existing entries in database...
  Found 0 existing entries

📝 New cards to insert: 12,847
⏭️ Skipped (already in DB): 0

🚀 Inserting cards in batches of 100...

  Progress: 100/12,847 (0.8%) | Inserted: 100 | Rate: 45/sec | Elapsed: 0m 2s
  Progress: 200/12,847 (1.6%) | Inserted: 200 | Rate: 48/sec | Elapsed: 0m 4s
  ...

==================================================
📊 SEED COMPLETE
==================================================

  Total rows in CSV:     14,932
  Skipped (no IMDB):     2,085
  Skipped (duplicate):   0
  Successfully inserted: 12,847
  Errors:                0

  Total time: 4m 32s
  Average rate: 47 records/second

✨ Database now has titles ready for enrichment via OMDB/Watchmode APIs!
```

### Troubleshooting

**Error: Missing Supabase credentials**
- Make sure `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

**Error: CSV file not found**
- Place `query.csv` in the project root (same level as `package.json`)

**Error: relation "availability_cards" does not exist**
- Run the Supabase migrations first to create the database tables

**Slow performance**
- The script inserts in batches of 100 for optimal performance
- Expected rate: ~40-50 records/second depending on connection
