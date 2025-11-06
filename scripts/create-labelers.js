// scripts/create-labelers.js
// Creates 10 simulated labelers with different skill levels

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createLabelers() {
  console.log('👥 Creating simulated labelers...\n')

  // Define 10 labelers with varying skill levels
  const labelers = [
    // Expert labelers (3) - High accuracy, fast
    {
      name: 'Expert_Alice',
      experience_level: 'expert',
      base_accuracy: 0.950,
      labels_per_hour: 10.0,
      hourly_rate: 25.00
    },
    {
      name: 'Expert_Bob',
      experience_level: 'expert',
      base_accuracy: 0.935,
      labels_per_hour: 9.5,
      hourly_rate: 24.00
    },
    {
      name: 'Expert_Carol',
      experience_level: 'expert',
      base_accuracy: 0.920,
      labels_per_hour: 9.0,
      hourly_rate: 23.00
    },
    
    // Intermediate labelers (4) - Moderate accuracy, moderate speed
    {
      name: 'Intermediate_David',
      experience_level: 'intermediate',
      base_accuracy: 0.880,
      labels_per_hour: 8.0,
      hourly_rate: 18.00
    },
    {
      name: 'Intermediate_Emma',
      experience_level: 'intermediate',
      base_accuracy: 0.860,
      labels_per_hour: 7.5,
      hourly_rate: 17.00
    },
    {
      name: 'Intermediate_Frank',
      experience_level: 'intermediate',
      base_accuracy: 0.840,
      labels_per_hour: 7.0,
      hourly_rate: 16.00
    },
    {
      name: 'Intermediate_Grace',
      experience_level: 'intermediate',
      base_accuracy: 0.800,
      labels_per_hour: 6.5,
      hourly_rate: 15.00
    },
    
    // Novice labelers (3) - Lower accuracy, slower
    {
      name: 'Novice_Henry',
      experience_level: 'novice',
      base_accuracy: 0.780,
      labels_per_hour: 6.0,
      hourly_rate: 12.00
    },
    {
      name: 'Novice_Iris',
      experience_level: 'novice',
      base_accuracy: 0.750,
      labels_per_hour: 5.5,
      hourly_rate: 11.00
    },
    {
      name: 'Novice_Jack',
      experience_level: 'novice',
      base_accuracy: 0.720,
      labels_per_hour: 5.0,
      hourly_rate: 10.00
    }
  ]

  console.log(`📊 Creating ${labelers.length} labelers:\n`)
  
  // Display what we're creating
  labelers.forEach((labeler, index) => {
    console.log(`   ${index + 1}. ${labeler.name}`)
    console.log(`      Level: ${labeler.experience_level}`)
    console.log(`      Accuracy: ${(labeler.base_accuracy * 100).toFixed(1)}%`)
    console.log(`      Speed: ${labeler.labels_per_hour} labels/hour`)
    console.log(`      Rate: $${labeler.hourly_rate}/hour\n`)
  })

  // Insert into Supabase
  const { data, error } = await supabase
    .from('labelers')
    .insert(labelers)
    .select()

  if (error) {
    console.error('❌ Error creating labelers:', error.message)
    process.exit(1)
  }

  console.log(`✅ Successfully created ${data.length} labelers!\n`)

  // Show summary by experience level
  const expertCount = labelers.filter(l => l.experience_level === 'expert').length
  const intermediateCount = labelers.filter(l => l.experience_level === 'intermediate').length
  const noviceCount = labelers.filter(l => l.experience_level === 'novice').length

  console.log('📈 Labeler breakdown:')
  console.log(`   Expert: ${expertCount} (92-95% accuracy)`)
  console.log(`   Intermediate: ${intermediateCount} (80-88% accuracy)`)
  console.log(`   Novice: ${noviceCount} (72-78% accuracy)`)
  console.log('\n🎉 Labelers created successfully!\n')
}

createLabelers().catch(console.error)