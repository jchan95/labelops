import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'

function AccuracyChart() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      try {
        // Get all labelers
        const { data: allLabelers } = await supabase
          .from('labelers')
          .select('*')
          .order('experience_level', { ascending: false })

        // Get all labels
        const { data: allLabels } = await supabase
          .from('labels')
          .select('labeler_id, is_correct')

        // Calculate accuracy for each labeler
        const data = allLabelers.map(labeler => {
          const labelerLabels = allLabels.filter(l => l.labeler_id === labeler.id)
          const correctLabels = labelerLabels.filter(l => l.is_correct).length
          const accuracy = labelerLabels.length > 0 
            ? (correctLabels / labelerLabels.length * 100) 
            : 0

          return {
            name: labeler.name.replace('_', ' '),
            accuracy: parseFloat(accuracy.toFixed(1)),
            level: labeler.experience_level,
            totalLabels: labelerLabels.length
          }
        })

        setChartData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading chart...</div>
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>📊 Accuracy by Labeler</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Visual comparison of labeler accuracy rates
      </p>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      backgroundColor: 'white',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].payload.name}</p>
                      <p style={{ margin: '0.25rem 0', color: '#16a34a' }}>
                        Accuracy: {payload[0].value}%
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                        Level: {payload[0].payload.level}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                        Total labels: {payload[0].payload.totalLabels}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              payload={[{ value: 'Labeler Accuracy', type: 'square', color: '#3b82f6' }]}
            />
            <Bar 
              dataKey="accuracy" 
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ 
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <strong>💡 Insight:</strong> Expert labelers consistently achieve 88%+ accuracy, 
        while novice labelers range from 68-73%. This demonstrates the value of experience 
        in labeling quality.
      </div>
    </div>
  )
}

export default AccuracyChart