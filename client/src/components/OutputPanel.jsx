import React from 'react';

const OutputPanel = ({ result, onClose, loading }) => {
  if (!loading && !result) return null;

  return (
    <div className="result-overlay">
      <div className="result-card">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="result-content">
          {loading ? (
            <>
              <div className="severity-badge skeleton" style={{ height: '60px' }}></div>
              <div className="summary-container">
                <div className="label-small skeleton" style={{ width: '80px', height: '14px' }}></div>
                <div className="summary-card skeleton" style={{ height: '100px' }}></div>
              </div>
              <div className="steps-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="step-card skeleton" style={{ height: '80px' }}></div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={`severity-badge severity-${result.severity}`}>
                {result.severity} EMERGENCY
              </div>

              <div className="summary-container">
                <div className="label-small">Situation Summary</div>
                <div className="summary-card">
                  {result.summary}
                </div>
              </div>

              <div className="steps-list">
                <div className="label-small">Escalation Steps</div>
                {result.steps?.map((step, index) => (
                  <div 
                    key={index} 
                    className="step-card"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`step-number severity-${result.severity}`}>
                      {index + 1}
                    </div>
                    <div className="step-text">
                      {step.action} 
                      <span style={{ 
                        fontSize: '11px', 
                        marginLeft: '8px', 
                        textTransform: 'uppercase', 
                        opacity: 0.6 
                      }}>
                        ({step.priority})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="agencies-container">
                <div className="label-small" style={{ marginBottom: '12px' }}>Agencies to Alert</div>
                <div className="agencies-row">
                  {result.agencies?.map((agency, index) => (
                    <span key={index} className="agency-tag">
                      {agency}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;
