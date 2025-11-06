import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function EdgeCases() {
  const [edgeCases, setEdgeCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCases, setExpandedCases] = useState(new Set())

  useEffect(() => {
    async function fetchEdgeCases() {
      try {
        // Get all labels with sample info
        const { data: allLabels } = await supabase
          .from('labels')
          .select(`
            sample_id,
            predicted_sentiment,
            text_samples (
              text,
              true_sentiment
            )
          `)

        if (!allLabels) return

        // Group labels by sample_id
        const sampleGroups = {}
        allLabels.forEach(label => {
          if (!sampleGroups[label.sample_id]) {
            sampleGroups[label.sample_id] = {
              sample_id: label.sample_id,
              text: label.text_samples?.text,
              true_sentiment: label.text_samples?.true_sentiment,
              labels: []
            }
          }
          sampleGroups[label.sample_id].labels.push(label.predicted_sentiment)
        })

        // Find samples with disagreement
        const cases = Object.values(sampleGroups)
          .filter(sample => {
            const uniqueLabels = new Set(sample.labels)
            return uniqueLabels.size >= 2 && sample.labels.length >= 3
          })
          .map(sample => {
            const labelCounts = {}
            sample.labels.forEach(label => {
              labelCounts[label] = (labelCounts[label] || 0) + 1
            })
            
            const totalLabels = sample.labels.length
            const maxAgreement = Math.max(...Object.values(labelCounts))
            const agreementRate = (maxAgreement / totalLabels * 100).toFixed(1)

            return {
              ...sample,
              labelCounts,
              totalLabels,
              agreementRate: parseFloat(agreementRate)
            }
          })
          .sort((a, b) => a.agreementRate - b.agreementRate)
          .slice(0, 20) // Top 20 most contentious

        setEdgeCases(cases)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching edge cases:', error)
        setLoading(false)
      }
    }

    fetchEdgeCases()
  }, [])

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading edge cases...</div>
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>🚩 Edge Cases - Low Agreement Samples</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Reviews where labelers disagreed (potential quality issues or ambiguous content)
      </p>

      <div style={{ 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <strong>💡 Why this matters:</strong> Low-agreement samples indicate ambiguous or difficult content. 
        These should be reviewed by experts or used for labeler training.
      </div>

      {edgeCases.length === 0 ? (
        <p style={{ color: '#666' }}>No significant disagreements found!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {edgeCases.map((sample, index) => {
            const isExpanded = expandedCases.has(sample.sample_id)
            const textPreview = sample.text?.slice(0, 100) || ''
            
            const toggleExpanded = () => {
              setExpandedCases(prev => {
                const next = new Set(prev)
                if (next.has(sample.sample_id)) {
                  next.delete(sample.sample_id)
                } else {
                  next.add(sample.sample_id)
                }
                return next
              })
            }

            return (
              <div 
                key={sample.sample_id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Collapsed single-line view */}
                <div 
                  onClick={toggleExpanded}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    flex: 1, 
                    minWidth: 0
                  }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#666',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: sample.true_sentiment === 'positive' ? '#dcfce7' : 
                                      sample.true_sentiment === 'negative' ? '#fee2e2' : '#e0e7ff',
                      color: sample.true_sentiment === 'positive' ? '#166534' :
                             sample.true_sentiment === 'negative' ? '#991b1b' : '#3730a3',
                      flexShrink: 0
                    }}>
                      {sample.true_sentiment}
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem',
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {textPreview}
                      {sample.text?.length > 100 && '...'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 'bold',
                        color: sample.agreementRate < 50 ? '#dc2626' : 
                               sample.agreementRate < 70 ? '#f59e0b' : '#16a34a'
                      }}>
                        {sample.agreementRate}%
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.875rem',
                      color: '#666',
                      userSelect: 'none'
                    }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ 
                    padding: '1rem',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <p style={{ margin: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{sample.text}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap', maxWidth: '100%', boxSizing: 'border-box' }}>
                      <div>
                        <strong>Label Distribution:</strong>
                      </div>
                      {Object.entries(sample.labelCounts).map(([label, count]) => (
                        <span 
                          key={label}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#e5e7eb',
                            color: '#374151'
                          }}
                        >
                          {label}: {count}/{sample.totalLabels}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EdgeCases