import React from 'react';
import { useSettings } from '../Contexts/SettingContext';
import './RetrieverSettings.css';

const Reranker = () => {
  const { settings, setSettings } = useSettings();

  const rerankMethods = [
    { id: 'pointwise', name: 'Point-wise', description: 'Score documents independently' },
    { id: 'pairwise', name: 'Pair-wise', description: 'Compare document pairs' },
    { id: 'listwise', name: 'List-wise', description: 'Consider entire result list' }
  ];

  const handleEnableReranker = (e) => {
    setSettings(prev => ({
      ...prev,
      reranker: {
        ...prev.reranker,
        isEnabled: e.target.checked
      }
    }));
  };

  return (
    <div className="retrieval-component">
      <div className="component-header">
        <label className="enable-option">
          <input
            type="checkbox"
            checked={settings.reranker.isEnabled}
            onChange={handleEnableReranker}
            className="enable-checkbox"
          />
          <span className="checkbox-text">Enable Reranking</span>
        </label>
      </div>

      {settings.reranker.isEnabled && (
        <>
          <div className="prompt-section">
            <label className="prompt-label">Reranking Prompt</label>
            <div className="prompt-controls">
              <button 
                className="reset-button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  reranker: {
                    ...prev.reranker,
                    prompt: 'Rerank the documents based on relevance to the query while maintaining diversity of information.'
                  }
                }))}
              >
                Reset to Default
              </button>
            </div>
            <textarea
              value={settings.reranker.prompt}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reranker: {
                  ...prev.reranker,
                  prompt: e.target.value
                }
              }))}
              placeholder="Enter reranking prompt..."
              className="prompt-input"
              rows={4}
            />
          </div>

          <div className="method-section">
            <label className="method-label">Reranking Method</label>
            <div className="retrieval-options">
              {rerankMethods.map(method => (
                <label
                  key={method.id}
                  className={`retrieval-option method-option ${settings.reranker.method === method.id ? 'selected' : ''}`}
                >
                  <div className="option-content">
                    <div className="option-info">
                      <span className="option-name">{method.name}</span>
                      <span className="option-description">{method.description}</span>
                    </div>
                    <div className="radio-indicator">
                      <div className="radio-inner" />
                    </div>
                    <input
                      type="radio"
                      name="rerankMethod"
                      value={method.id}
                      checked={settings.reranker.method === method.id}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reranker: {
                          ...prev.reranker,
                          method: e.target.value
                        }
                      }))}
                      className="sr-only"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reranker;