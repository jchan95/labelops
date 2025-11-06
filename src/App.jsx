import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LabelerPerformance from './components/LabelerPerformance'
import AccuracyChart from './components/AccuracyChart'
import EdgeCases from './components/EdgeCases'
import SQLPlayground from './components/SQLPlayground'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState({
    totalLabels: 0,
    totalSamples: 0,
    totalLabelers: 0,
    overallAccuracy: 0,
    loading: true
  })

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { count: labelCount } = await supabase
          .from('labels')
          .select('*', { count: 'exact', head: true })

        const { count: sampleCount } = await supabase
          .from('text_samples')
          .select('*', { count: 'exact', head: true })

        const { count: labelerCount } = await supabase
          .from('labelers')
          .select('*', { count: 'exact', head: true })

        const { data: labels } = await supabase
          .from('labels')
          .select('is_correct')

        const correctCount = labels?.filter(l => l.is_correct).length || 0
        const accuracy = labels?.length ? (correctCount / labels.length * 100) : 0

        setMetrics({
          totalLabels: labelCount || 0,
          totalSamples: sampleCount || 0,
          totalLabelers: labelerCount || 0,
          overallAccuracy: accuracy.toFixed(1),
          loading: false
        })
      } catch (error) {
        console.error('Error fetching metrics:', error)
        setMetrics(prev => ({ ...prev, loading: false }))
      }
    }

    fetchMetrics()
  }, [])

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'performance', label: '👥 Performance', icon: '👥' },
    { id: 'quality', label: '✅ Quality', icon: '✅' },
    { id: 'sql', label: '🔧 SQL Practice', icon: '🔧' }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
  backgroundColor: 'white',
  borderBottom: '1px solid #e5e7eb',
  padding: '2rem 2rem 1.5rem 2rem'
}}>
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827', marginBottom: '0.5rem' }}>
      🏷️ LabelOps
    </h1>
    <p style={{ margin: 0, color: '#666', fontSize: '1rem', marginBottom: '1rem' }}>
      Data Labeling Quality & Operations Dashboard
    </p>
    <div style={{
      padding: '1rem 1.5rem',
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      fontSize: '0.875rem',
      lineHeight: '1.6'
    }}>
      <strong style={{ color: '#1e40af' }}>Personal Portfolio Project by John Chan</strong>
      <p style={{ margin: '0.5rem 0 0 0', color: '#1e3a8a' }}>
        Built to demonstrate understanding of basic data labeling operations.
      </p>
    </div>
  </div>
</header>

      {/* Navigation Tabs */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e5e7eb',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 2rem 2rem' }}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {metrics.loading ? (
              <p>Loading metrics...</p>
            ) : (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <MetricCard 
                    title="Total Labels" 
                    value={metrics.totalLabels.toLocaleString()} 
                    icon="🏷️"
                  />
                  <MetricCard 
                    title="Text Samples" 
                    value={metrics.totalSamples.toLocaleString()} 
                    icon="📄"
                  />
                  <MetricCard 
                    title="Active Labelers" 
                    value={metrics.totalLabelers} 
                    icon="👥"
                  />
                  <MetricCard 
                    title="Overall Accuracy" 
                    value={`${metrics.overallAccuracy}%`} 
                    icon="✅"
                  />
                </div>

                <h2 style={{ marginTop: 0, color: '#111827' }}>📋 What I Built</h2>
  
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.75rem' }}>
      Database & Data Pipeline
    </h3>
    <ul style={{ color: '#666', lineHeight: '1.8', margin: 0 }}>
      <li>PostgreSQL database with 5 tables for tracking labeling work</li>
      <li>1,000 movie reviews with sentiment labels (positive/negative/neutral)</li>
      <li>10 simulated labelers with different accuracy levels</li>
      <li>6,000+ labeling records with timestamps and confidence scores</li>
    </ul>
  </div>

  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.75rem' }}>
      Dashboard & Visualizations
    </h3>
    <ul style={{ color: '#666', lineHeight: '1.8', margin: 0 }}>
      <li>Interactive React dashboard with real-time metrics and KPIs</li>
      <li>Charts for accuracy trends, throughput, and cost per label</li>
      <li>Edge case detection for samples that need review</li>
      <li>Filtering and sorting to explore the data</li>
    </ul>
  </div>

  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.75rem' }}>
      SQL Features
    </h3>
    <ul style={{ color: '#666', lineHeight: '1.8', margin: 0 }}>
      <li>Interactive query builder to explore the database</li>
      <li>Complex queries using JOINs, aggregations, and filtering</li>
      <li>Live results showing how different queries work</li>
    </ul>
  </div>

  <div>
    <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.75rem' }}>
      Technical Stack
    </h3>
    <div style={{ 
      display: 'flex', 
      gap: '0.5rem', 
      flexWrap: 'wrap',
      marginTop: '0.75rem'
    }}>
      {['React', 'JavaScript', 'Supabase', 'PostgreSQL', 'Recharts', 'SQL'].map(tech => (
        <span
          key={tech}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151'
          }}
        >
          {tech}
        </span>
      ))}
    </div>
  </div>

  <div style={{
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px'
  }}>
    <strong style={{ color: '#166534' }}>🎯 Key Outcomes:</strong>
    <p style={{ margin: '0.5rem 0 0 0', color: '#166534', fontSize: '0.875rem' }}>
      This project demonstrates my ability to understand complex operations systems, work with 
      databases at scale, build full-stack applications, and present data insights effectively—all 
      critical skills for technical roles at AI labeling companies.
    </p>
  </div>
              </>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <LabelerPerformance />
            <AccuracyChart />
          </div>
        )}

        {/* Quality Tab */}
        {activeTab === 'quality' && (
          <div>
            <EdgeCases />
          </div>
        )}

        {/* SQL Practice Tab */}
        {activeTab === 'sql' && (
          <div>
            <SQLPlayground />
          </div>
        )}
      </div>

    {/* Footer */}
    <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '2rem',
        marginTop: '4rem',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          Built by <strong>John Chan</strong>
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <a 
            href="https://linkedin.com/in/johnmchan" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            LinkedIn
          </a>
          {' • '}
          <a 
            href="https://github.com/jchan95/labelops" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
          Built with React, Supabase, and Recharts
        </p>
      </footer>
    </div>
  )
}

function MetricCard({ title, value, icon }) {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}

export default App