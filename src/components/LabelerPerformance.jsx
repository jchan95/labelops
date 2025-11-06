import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function LabelerPerformance() {
  const [labelers, setLabelers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLabelerStats() {
      try {
        // Get all labelers with their labels
        const { data: allLabelers } = await supabase
          .from('labelers')
          .select('*')
          .order('base_accuracy', { ascending: false })

        // Get all labels
        const { data: allLabels } = await supabase
          .from('labels')
          .select('labeler_id, is_correct, time_spent_seconds')

        // Calculate stats for each labeler
        const stats = allLabelers.map(labeler => {
          const labelerLabels = allLabels.filter(l => l.labeler_id === labeler.id)
          const correctLabels = labelerLabels.filter(l => l.is_correct).length
          const accuracy = labelerLabels.length > 0 
            ? (correctLabels / labelerLabels.length * 100) 
            : 0
          
          const avgTime = labelerLabels.length > 0
            ? labelerLabels.reduce((sum, l) => sum + l.time_spent_seconds, 0) / labelerLabels.length
            : 0

          const totalCost = labeler.labels_per_hour > 0
            ? (labelerLabels.length / labeler.labels_per_hour) * labeler.hourly_rate
            : 0

          return {
            name: labeler.name,
            experienceLevel: labeler.experience_level,
            totalLabels: labelerLabels.length,
            accuracy: accuracy.toFixed(1),
            avgTimeSeconds: Math.round(avgTime),
            labelsPerHour: labeler.labels_per_hour,
            hourlyRate: labeler.hourly_rate,
            totalCost: totalCost
          }
        })

        setLabelers(stats)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching labeler stats:', error)
        setLoading(false)
      }
    }

    fetchLabelerStats()
  }, [])

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading labeler performance...</div>
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>👥 Labeler Performance</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Individual performance metrics for all {labelers.length} labelers
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Level</th>
              <th style={tableHeaderStyle}>Total Labels</th>
              <th style={tableHeaderStyle}>Accuracy</th>
              <th style={tableHeaderStyle}>Avg Time (sec)</th>
              <th style={tableHeaderStyle}>Rate (labels/hr)</th>
              <th style={tableHeaderStyle}>Hourly Rate</th>
              <th style={tableHeaderStyle}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {labelers.map((labeler, index) => (
              <tr 
                key={index}
                style={{ 
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <td style={tableCellStyle}>
                  <strong>{labeler.name.replace('_', ' ')}</strong>
                </td>
                <td style={tableCellStyle}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: 
                      labeler.experienceLevel === 'expert' ? '#dcfce7' :
                      labeler.experienceLevel === 'intermediate' ? '#fef9c3' : '#fee2e2',
                    color:
                      labeler.experienceLevel === 'expert' ? '#166534' :
                      labeler.experienceLevel === 'intermediate' ? '#854d0e' : '#991b1b'
                  }}>
                    {labeler.experienceLevel}
                  </span>
                </td>
                <td style={tableCellStyle}>{labeler.totalLabels.toLocaleString()}</td>
                <td style={tableCellStyle}>
                  <strong style={{ 
                    color: parseFloat(labeler.accuracy) >= 85 ? '#16a34a' : 
                           parseFloat(labeler.accuracy) >= 75 ? '#ca8a04' : '#dc2626'
                  }}>
                    {labeler.accuracy}%
                  </strong>
                </td>
                <td style={tableCellStyle}>{labeler.avgTimeSeconds}s</td>
                <td style={tableCellStyle}>{labeler.labelsPerHour}</td>
                <td style={tableCellStyle}>${labeler.hourlyRate}/hr</td>
                <td style={tableCellStyle}>
                  <strong>${labeler.totalCost.toFixed(2)}</strong>
                </td>
              </tr>
            ))}
            {labelers.length > 0 && (
              <tr style={{ 
                backgroundColor: '#f3f4f6',
                borderTop: '2px solid #9ca3af',
                fontWeight: '600'
              }}>
                <td style={{ ...tableCellStyle, fontWeight: '700' }}>Total</td>
                <td style={tableCellStyle}>—</td>
                <td style={{ ...tableCellStyle, fontWeight: '700' }}>
                  {labelers.reduce((sum, l) => sum + l.totalLabels, 0).toLocaleString()}
                </td>
                <td style={tableCellStyle}>
                  <strong style={{ 
                    color: '#16a34a'
                  }}>
                    {(() => {
                      const totalLabels = labelers.reduce((sum, l) => sum + l.totalLabels, 0)
                      const weightedAccuracy = labelers.reduce((sum, l) => 
                        sum + (parseFloat(l.accuracy) * l.totalLabels), 0)
                      return totalLabels > 0 
                        ? (weightedAccuracy / totalLabels).toFixed(1) 
                        : '0.0'
                    })()}%
                  </strong>
                </td>
                <td style={tableCellStyle}>
                  {(() => {
                    const totalLabels = labelers.reduce((sum, l) => sum + l.totalLabels, 0)
                    const weightedTime = labelers.reduce((sum, l) => 
                      sum + (l.avgTimeSeconds * l.totalLabels), 0)
                    return totalLabels > 0 
                      ? Math.round(weightedTime / totalLabels) 
                      : 0
                  })()}s
                </td>
                <td style={tableCellStyle}>
                  {labelers.reduce((sum, l) => sum + l.labelsPerHour, 0).toLocaleString()}
                </td>
                <td style={tableCellStyle}>
                  ${(labelers.reduce((sum, l) => sum + l.hourlyRate, 0) / labelers.length).toFixed(2)}/hr
                </td>
                <td style={{ ...tableCellStyle, fontWeight: '700' }}>
                  <strong style={{ color: '#059669', fontSize: '1rem' }}>
                    ${labelers.reduce((sum, l) => sum + l.totalCost, 0).toFixed(2)}
                  </strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const tableHeaderStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#374151'
}

const tableCellStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: '#111827'
}

export default LabelerPerformance