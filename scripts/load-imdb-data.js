// scripts/load-imdb-data.js
// Loads IMDB movie reviews into Supabase

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function loadIMDBData() {
  console.log('🎬 Loading IMDB dataset...\n')

  // Read the CSV file
  const csvPath = path.join(__dirname, '../data/IMDB Dataset.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: IMDB Dataset.csv not found in data/ folder')
    console.error('   Expected location:', csvPath)
    process.exit(1)
  }

  const csvData = fs.readFileSync(csvPath, 'utf8')

  // Parse CSV
  const { data: rows } = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  })

  console.log(`📊 Total reviews in dataset: ${rows.length}`)
  console.log(`📝 Taking first 1,000 reviews\n`)

  // Take first 1,000 and prepare for Supabase
  const samplesToInsert = rows.slice(0, 1000).map(row => {
    const text = row.review || row.Review || row.text || ''
    const sentiment = (row.sentiment || row.Sentiment || '').toLowerCase()
    
    // Calculate complexity score based on text length and word count
    const wordCount = text.split(/\s+/).length
    const complexityScore = Math.min(10, Math.max(1, Math.floor(wordCount / 50)))

    return {
      text: text.trim(),
      true_sentiment: sentiment === 'positive' ? 'positive' : 'negative',
      complexity_score: complexityScore,
      word_count: wordCount,
      source: 'imdb'
    }
  }).filter(sample => sample.text.length > 0) // Remove empty reviews

  console.log(`✅ Prepared ${samplesToInsert.length} samples for upload\n`)

  // Insert in batches of 100 (Supabase has limits)
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < samplesToInsert.length; i += batchSize) {
    const batch = samplesToInsert.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('text_samples')
      .insert(batch)
      .select()

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message)
      continue
    }

    inserted += batch.length
    console.log(`   Uploaded batch ${i / batchSize + 1}: ${inserted}/${samplesToInsert.length} samples`)
  }

  console.log(`\n✅ Successfully loaded ${inserted} text samples into Supabase!`)
  console.log(`\n📊 Sample breakdown:`)
  
  // Get sentiment counts
  const { data: posCount } = await supabase
    .from('text_samples')
    .select('id', { count: 'exact', head: true })
    .eq('true_sentiment', 'positive')

  const { data: negCount } = await supabase
    .from('text_samples')
    .select('id', { count: 'exact', head: true })
    .eq('true_sentiment', 'negative')

  console.log(`   Positive: ${posCount?.length || 0}`)
  console.log(`   Negative: ${negCount?.length || 0}`)
  console.log(`\n🎉 IMDB data loaded successfully!\n`)
}

// Run the script
loadIMDBData().catch(console.error)