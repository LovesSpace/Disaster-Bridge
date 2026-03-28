import React, { useState } from 'react'
import InputPanel from './components/InputPanel'
import OutputPanel from './components/OutputPanel'
import './App.css'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleAnalyze = async (formData) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setShowModal(true)

    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed. Please check your connection.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
      setShowModal(false)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setResult(null)
    setError(null)
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">DISASTERBRIDGE</div>
        <div className="nav-info label-small" style={{ color: 'var(--color-primary)' }}>
          Gemini-Powered Triage
        </div>
      </nav>

      <main className="main-content">
        <div className="info-section">
          <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 700 }}>
            Precision Response <br/> 
            <span style={{ color: 'var(--color-primary)' }}>Zero Lag.</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', maxWidth: '500px', lineHeight: 1.6 }}>
            Convert messy real-world inputs into structured, life-saving action plans. Supporting Text, Voice, Image, and Location inputs.
          </p>
          
          <div style={{ marginTop: '40px' }}>
            <InputPanel onAnalyze={handleAnalyze} loading={loading} />
          </div>
        </div>

        <div className="visual-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: '100%', 
            height: '400px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '24px', 
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-light)',
            fontSize: '14px',
            textAlign: 'center',
            padding: '40px'
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="mic-button recording" style={{ width: '40px', height: '40px', border: 'none' }}></div>
                <p>Intelligence Engine Running...</p>
              </div>
            ) : (
              <p>Ready to receive input.<br/>Triage results will appear in a card overlay.</p>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <OutputPanel 
          result={result} 
          loading={loading} 
          onClose={closeModal} 
        />
      )}

      {error && (
        <div style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          background: '#ef4444', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          zIndex: 1100
        }}>
          Error: {error}
        </div>
      )}
    </div>
  )
}

export default App
