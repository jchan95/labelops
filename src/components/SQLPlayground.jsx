import { useState } from 'react'
import { supabase } from '../lib/supabase'

function SQLPlayground() {
  const [selectedTable, setSelectedTable] = useState('labelers')
  const [selectedColumns, setSelectedColumns] = useState(['*'])
  const [limit, setLimit] = useState(10)
  const [orderBy, setOrderBy] = useState(null)
  const [whereConditions, setWhereConditions] = useState([]) 
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const tables = {
    labelers: {
      description: 'Worker information',
      columns: ['id', 'name', 'experience_level', 'base_accuracy', 'labels_per_hour', 'hourly_rate']
    },
    labels: {
      description: 'All label records',
      columns: ['id', 'sample_id', 'labeler_id', 'predicted_sentiment', 'confidence_score', 'is_correct', 'time_spent_seconds']
    },
    text_samples: {
      description: 'Movie reviews',
      columns: ['id', 'text', 'true_sentiment', 'complexity_score', 'word_count']
    }
  }

  const whereFilters = {
    labelers: [
      { column: 'experience_level', operator: '=', values: ['expert', 'intermediate', 'novice'] },
      { column: 'base_accuracy', operator: '>', type: 'number' }
    ],
    labels: [
      { column: 'predicted_sentiment', operator: '=', values: ['positive', 'negative', 'neutral'] },
      { column: 'is_correct', operator: '=', values: ['true', 'false'] },
      { column: 'confidence_score', operator: '>', type: 'number' }
    ],
    text_samples: [
      { column: 'true_sentiment', operator: '=', values: ['positive', 'negative', 'neutral'] },
      { column: 'complexity_score', operator: '>', type: 'number' }
    ]
  }

  const buildQuery = () => {
    const cols = selectedColumns.includes('*') ? '*' : selectedColumns.join(', ')
    let query = `SELECT ${cols}\nFROM ${selectedTable}`
    
    if (whereConditions.length > 0) {
      const conditions = whereConditions.map(w => `${w.column} ${w.operator} ${w.value}`).join(' AND ')
      query += `\nWHERE ${conditions}`
    }
    
    if (orderBy) {
      query += `\nORDER BY ${orderBy} DESC`
    }
    query += `\nLIMIT ${limit};`
    return query
  }

  const runQuery = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
  
    try {
      let query = supabase
        .from(selectedTable)
        .select(selectedColumns.includes('*') ? '*' : selectedColumns.join(','))
        .limit(limit)
  
      // Apply WHERE conditions
      whereConditions.forEach(condition => {
        if (condition.operator === '=') {
          query = query.eq(condition.column, condition.value.replace(/'/g, ''))
        } else if (condition.operator === '>') {
          query = query.gt(condition.column, parseFloat(condition.value))
        } else if (condition.operator === '<') {
          query = query.lt(condition.column, parseFloat(condition.value))
        } else if (condition.operator === '>=') {
          query = query.gte(condition.column, parseFloat(condition.value))
        } else if (condition.operator === '<=') {
          query = query.lte(condition.column, parseFloat(condition.value))
        }
      })
  
      if (orderBy) {
        query = query.order(orderBy, { ascending: false })
      }
  
      const { data, error: queryError } = await query
  
      if (queryError) {
        setError(queryError.message)
      } else {
        setResults(data)
      }
    } catch (err) {
      setError(err.message)
    }
  
    setLoading(false)
  }

  const toggleColumn = (col) => {
    if (col === '*') {
      setSelectedColumns(['*'])
    } else {
      setSelectedColumns(prev => {
        // If * is selected, replace it with this column
        if (prev.includes('*')) {
          return [col]
        }
        
        // If this column is already selected, remove it
        if (prev.includes(col)) {
          const filtered = prev.filter(c => c !== col)
          // If no columns left, go back to *
          return filtered.length > 0 ? filtered : ['*']
        }
        
        // Add this column
        return [...prev, col]
      })
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>🔧 SQL Query Builder</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Build SQL queries visually by selecting options
      </p>

   {/* Step 1: FROM table */}
   <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1.5rem', 
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '0.875rem',
            color: '#3b82f6',
            marginRight: '0.5rem'
          }}>
            FROM
          </span>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            Choose a table
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.keys(tables).map(table => (
            <button
              key={table}
              onClick={() => {
                setSelectedTable(table)
                setSelectedColumns(['*'])
                setOrderBy(null)
              }}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: selectedTable === table ? '#3b82f6' : 'white',
                color: selectedTable === table ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {table}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: SELECT columns */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1.5rem', 
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '0.875rem',
            color: '#3b82f6',
            marginRight: '0.5rem'
          }}>
            SELECT
          </span>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            Choose columns to return
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => toggleColumn('*')}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: selectedColumns.includes('*') ? '#3b82f6' : 'white',
              color: selectedColumns.includes('*') ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            * (all columns)
          </button>
          {selectedTable && tables[selectedTable].columns.map(col => (
  <button
    key={col}
    onClick={() => toggleColumn(col)}
    style={{
      padding: '0.5rem 0.75rem',
      backgroundColor: selectedColumns.includes(col) ? '#3b82f6' : 'white',
      color: selectedColumns.includes(col) ? 'white' : '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.875rem'
    }}
  >
    {col}
  </button>
))}
        </div>
      </div>


      {/* Step 3: ORDER BY */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1.5rem', 
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '0.875rem',
            color: '#3b82f6',
            marginRight: '0.5rem'
          }}>
            ORDER BY
          </span>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            Sort results (optional)
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setOrderBy(null)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: !orderBy ? '#3b82f6' : 'white',
              color: !orderBy ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            None
          </button>
          {selectedTable && tables[selectedTable].columns
            .filter(col => ['accuracy', 'score', 'count', 'rate', 'time', 'id'].some(word => col.includes(word)))
            .map(col => (
            <button
              key={col}
              onClick={() => setOrderBy(col)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: orderBy === col ? '#3b82f6' : 'white',
                color: orderBy === col ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {col} ↓
            </button>
          ))}
        </div>
      </div>

{/* Step 4: WHERE clause */}
<div style={{ 
  marginBottom: '1.5rem', 
  padding: '1.5rem', 
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px'
}}>
  <div style={{ marginBottom: '0.75rem' }}>
    <span style={{ 
      fontWeight: '600', 
      fontSize: '0.875rem',
      color: '#3b82f6',
      marginRight: '0.5rem'
    }}>
      WHERE
    </span>
    <span style={{ fontSize: '0.875rem', color: '#666' }}>
      Filter results (optional)
    </span>
  </div>
  
  {whereConditions.length > 0 && (
    <div style={{ marginBottom: '1rem' }}>
      {whereConditions.map((condition, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
            {condition.column} {condition.operator} {condition.value}
          </span>
          <button
            onClick={() => {
              setWhereConditions(prev => prev.filter((_, i) => i !== index))
            }}
            style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  {selectedTable && whereFilters[selectedTable] && (
    <div>
      <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        Add Filter:
      </div>
      {whereFilters[selectedTable].map((filter, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            {filter.column}:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filter.values ? (
              // Predefined values (like sentiment, experience_level)
              filter.values.map(value => (
                <button
                  key={value}
                  onClick={() => {
                    const newCondition = {
                      column: filter.column,
                      operator: filter.operator,
                      value: `'${value}'`
                    }
                    setWhereConditions(prev => [...prev, newCondition])
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  = {value}
                </button>
              ))
            ) : (
              // Number input (like accuracy, confidence_score)
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  id={`operator-${filter.column}`}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value=">">{'>'}</option>
                  <option value="<">{'<'}</option>
                  <option value=">=">{'>='}</option>
                  <option value="<=">{'<='}</option>
                  <option value="=">=</option>
                </select>
                <input
                  type="number"
                  id={`value-${filter.column}`}
                  step="0.01"
                  placeholder="Value"
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    width: '100px'
                  }}
                />
                <button
                  onClick={() => {
                    const operator = document.getElementById(`operator-${filter.column}`).value
                    const value = document.getElementById(`value-${filter.column}`).value
                    if (value) {
                      const newCondition = {
                        column: filter.column,
                        operator: operator,
                        value: value
                      }
                      setWhereConditions(prev => [...prev, newCondition])
                      document.getElementById(`value-${filter.column}`).value = ''
                    }
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {/* Step 5: LIMIT */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1.5rem', 
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '0.875rem',
            color: '#3b82f6',
            marginRight: '0.5rem'
          }}>
            LIMIT
          </span>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            Number of rows to return
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[5, 10, 25, 50, 100].map(num => (
            <button
              key={num}
              onClick={() => setLimit(num)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: limit === num ? '#3b82f6' : 'white',
                color: limit === num ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Query Display */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#1f2937',
        color: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        whiteSpace: 'pre',
        overflowX: 'auto'
      }}>
        {buildQuery()}
      </div>

      {/* Run Button */}
      <button
        onClick={runQuery}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: loading ? '#9ca3af' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {loading ? 'Running Query...' : '▶ Run Query'}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '1rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#065f46'
          }}>
            ✓ Query executed successfully. Returned {results.length} rows.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {Object.keys(results[0]).map(key => (
                    <th key={key} style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      whiteSpace: 'nowrap'
                    }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: i < results.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{
                        padding: '0.75rem',
                        color: '#111827'
                      }}>
                        {val === null ? 
                          <span style={{ color: '#9ca3af' }}>null</span> : 
                          String(val).length > 50 ? 
                            String(val).slice(0, 50) + '...' : 
                            String(val)
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default SQLPlayground