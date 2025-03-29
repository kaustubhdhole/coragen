import React from 'react';
import { useSettings } from '../Contexts/SettingContext';
import { Chrome, Database, Server, Settings } from 'lucide-react';
import './RetrieverSettings.css';

const RetrieverSettings = () => {
  const { settings, setSettings } = useSettings();

  const browsers = [
    {
      id: 'google',
      name: 'Google',
      description: 'Web search using Google API',
      icon: Chrome,
      requiresAlgorithm: false
    },
    {
      id: 'pyterrier',
      name: 'Pyterrier',
      description: 'Local search engine',
      icon: Database,
      requiresAlgorithm: true
    },
    {
      id: 'pyserini',
      name: 'Pyserini',
      description: 'Local search indexing',
      icon: Server,
      requiresAlgorithm: true
    }
  ];

  const algorithms = [
    { id: 'TFIDF', name: 'TF-IDF' },
    { id: 'BM25', name: 'BM25' },
    { id: 'DPR', name: 'Dense Passage Retrieval' }
  ];

  return (
    <div className="retriever-settings">
      <div className="settings-section-header">
        <Settings size={20} />
        <h3>Search Engine</h3>
      </div>

      <div className="browser-options">
        {browsers.map((browser) => (
          <label 
            key={browser.id}
            className={`browser-option ${settings.browser === browser.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="browser"
              value={browser.id}
              checked={settings.browser === browser.id}
              onChange={() => {
                setSettings(prev => ({
                  ...prev,
                  browser: browser.id
                }));
              }}
              className="sr-only"
            />
            <div className="browser-content">
              <div className="browser-icon">
                <browser.icon size={20} />
              </div>
              <div className="browser-info">
                <div className="browser-name">{browser.name}</div>
                <div className="browser-description">{browser.description}</div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {(settings.browser === 'pyterrier' || settings.browser === 'pyserini') && (
        <div className="algorithm-section">
          <label className="algorithm-label">Search Algorithm</label>
          <select
            value={settings.searchAlgorithm}
            onChange={(e) => {
              setSettings(prev => ({
                ...prev,
                searchAlgorithm: e.target.value
              }));
            }}
            className="algorithm-select"
          >
            {algorithms.map(algo => (
              <option key={algo.id} value={algo.id}>
                {algo.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default RetrieverSettings;