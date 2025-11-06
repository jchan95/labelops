// scripts/simulate-labeling.js
// Simulates realistic labeling work by 10 labelers over time

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: Random number in range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min
}

// Helper: Randomly pick from array
function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper: Should labeler make a mistake?
function shouldMakeError(labelerAccuracy, sampleComplexity) {
  // Higher complexity = more likely to make errors
  const complexityFactor = sampleComplexity / 10 // 0.1 to 1.0
  const adjustedAccuracy = labelerAccuracy * (1 - complexityFactor * 0.15)
  return Math.random() > adjustedAccuracy
}

// Helper: Get wrong sentiment
function getWrongSentiment(correctSentiment) {
  const sentiments = ['positive', 'negative', 'neutral']
  const wrong = sentiments.filter(s => s !== correctSentiment)
  return randomPick(wrong)
}

// Helper: Generate realistic timestamp (spread over last 7 days)
function generateTimestamp(baseDate, labelerIndex, labelIndex) {
  // Spread labels over 7 days, with some labelers working different times
  const daysAgo = 7 - Math.floor(labelIndex / 100) // Earlier labels are older
  const hoursOffset = labelerIndex * 2 // Different labelers work different hours
  const randomMinutes = Math.random() * 120 // Add some randomness
  
  const timestamp = new Date(baseDate)
  timestamp.setDate(timestamp.getDate() - daysAgo)
  timestamp.setHours(timestamp.getHours() - hoursOffset)
  timestamp.setMinutes(timestamp.getMinutes() - randomMinutes)
  
  return timestamp.toISOString()
}

async function simulateLabeling() {
  console.log('🏷️  Starting label simulation...\n')

  // Fetch all samples
  const { data: samples, error: samplesError } = await supabase
    .from('text_samples')
    .select('*')
    .order('id')

  if (samplesError || !samples) {
    console.error('❌ Error fetching samples:', samplesError?.message)
    process.exit(1)
  }

  console.log(`📊 Found ${samples.length} text samples\n`)

  // Fetch all labelers
  const { data: labelers, error: labelersError } = await supabase
    .from('labelers')
    .select('*')
    .order('base_accuracy', { ascending: false })

  if (labelersError || !labelers) {
    console.error('❌ Error fetching labelers:', labelersError?.message)
    process.exit(1)
  }

  console.log(`👥 Found ${labelers.length} labelers\n`)
  console.log('⚙️  Generating labels...\n')

  // Each sample gets 5-7 labels from different labelers
  const labelsToCreate = []
  const baseDate = new Date()
  let totalLabels = 0

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    const numLabelsForSample = Math.floor(randomInRange(5, 8)) // 5-7 labels per sample
    
    // Pick random labelers (no duplicates for same sample)
    const shuffledLabelers = [...labelers].sort(() => Math.random() - 0.5)
    const selectedLabelers = shuffledLabelers.slice(0, numLabelsForSample)

    for (let j = 0; j < selectedLabelers.length; j++) {
      const labeler = selectedLabelers[j]
      
      // Determine if this label is correct
      const makeError = shouldMakeError(labeler.base_accuracy, sample.complexity_score)
      const predictedSentiment = makeError 
        ? getWrongSentiment(sample.true_sentiment)
        : sample.true_sentiment

      // Calculate time spent (faster labelers take less time)
      // Base time: 30-180 seconds, adjusted by speed
      const baseTime = randomInRange(30, 180)
      const speedFactor = labeler.labels_per_hour / 10 // Normalize to 0.5 - 1.0
      const timeSpent = Math.floor(baseTime / speedFactor)

      // Confidence score (higher for correct labels, higher for experts)
      let confidenceScore
      if (makeError) {
        // Incorrect labels have lower confidence
        confidenceScore = randomInRange(0.5, 0.75)
      } else {
        // Correct labels have higher confidence, experts more confident
        const baseConfidence = labeler.experience_level === 'expert' ? 0.85 : 
                              labeler.experience_level === 'intermediate' ? 0.75 : 0.65
        confidenceScore = randomInRange(baseConfidence, 0.95)
      }

      labelsToCreate.push({
        sample_id: sample.id,
        labeler_id: labeler.id,
        predicted_sentiment: predictedSentiment,
        confidence_score: Number(confidenceScore.toFixed(2)),
        time_spent_seconds: timeSpent,
        is_correct: !makeError,
        labeled_at: generateTimestamp(baseDate, j, totalLabels)
      })

      totalLabels++
    }

    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`   Processed ${i + 1}/${samples.length} samples (${totalLabels} labels generated)`)
    }
  }

  console.log(`\n✅ Generated ${labelsToCreate.length} labels\n`)
  console.log('📤 Uploading to Supabase...\n')

  // Insert in batches of 500
  const batchSize = 500
  let inserted = 0

  for (let i = 0; i < labelsToCreate.length; i += batchSize) {
    const batch = labelsToCreate.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('labels')
      .insert(batch)

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message)
      continue
    }

    inserted += batch.length
    console.log(`   Uploaded batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${labelsToCreate.length} labels`)
  }

  console.log(`\n✅ Successfully inserted ${inserted} labels!\n`)

  // Calculate and display statistics
  const correctLabels = labelsToCreate.filter(l => l.is_correct).length
  const overallAccuracy = (correctLabels / labelsToCreate.length * 100).toFixed(1)

  console.log('📊 Labeling Statistics:')
  console.log(`   Total labels: ${labelsToCreate.length}`)
  console.log(`   Correct: ${correctLabels}`)
  console.log(`   Incorrect: ${labelsToCreate.length - correctLabels}`)
  console.log(`   Overall accuracy: ${overallAccuracy}%`)
  console.log(`   Avg labels per sample: ${(labelsToCreate.length / samples.length).toFixed(1)}`)
  
  // Calculate per-labeler stats
  console.log('\n👥 Per-Labeler Performance:')
  for (const labeler of labelers) {
    const labelerLabels = labelsToCreate.filter(l => l.labeler_id === labeler.id)
    const labelerCorrect = labelerLabels.filter(l => l.is_correct).length
    const labelerAccuracy = labelerLabels.length > 0 
      ? (labelerCorrect / labelerLabels.length * 100).toFixed(1)
      : 0
    
    console.log(`   ${labeler.name}: ${labelerLabels.length} labels, ${labelerAccuracy}% accurate`)
  }

  console.log('\n🎉 Label simulation complete!\n')
}

simulateLabeling().catch(console.error)