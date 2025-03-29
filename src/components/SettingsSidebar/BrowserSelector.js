import React from 'react';
import { useSettings } from '../Contexts/SettingContext';
import { Chrome, MessageSquare, Database, Server } from 'lucide-react';
import './RetrieverSettings.css';

const BrowserSelector = () => {
  const { settings, setSettings } = useSettings();

  const browsers = [
    {
      id: 'google',
      name: 'Google',
      type: 'Web Search',
      description: 'Web search using Google API',
      icon: Chrome,
      color: '#4285F4'
    },
    {
      id: 'bing',
      name: 'Microsoft Bing',
      type: 'Web Search',
      description: 'Web search using Bing API',
      icon: MessageSquare,
      color: '#00A4EF'
    },
    {
      id: 'pyterrier',
      name: 'Pyterrier',
      type: 'Local Search',
      description: 'Information retrieval using Pyterrier',
      icon: Database,
      color: '#FF6B6B',
      requiresAlgorithm: true
    },
    {
      id: 'pyserini',
      name: 'Pyserini',
      type: 'Local Search',
      description: 'Information retrieval using Pyserini',
      icon: Server,
      color: '#4EA8DE',
      requiresAlgorithm: true
    }
  ];

  const algorithms = [
    { id: 'TFIDF', name: 'TF-IDF' },
    { id: 'BM25', name: 'BM25' },
    { id: 'colBERT', name: 'colBERT' }
  ];

  const showAlgorithmDropdown = settings.browser === 'pyterrier' || settings.browser === 'pyserini';

  return (
    <div className="retrieval-component">
      <div className="retrieval-options">
        {browsers.map((browser) => (
          <label 
            key={browser.id}
            className={`retrieval-option ${settings.browser === browser.id ? 'selected' : ''}`}
            style={{ '--highlight-color': browser.color }}
          >
            <div className="option-content">
              <div className="icon-wrapper">
                <browser.icon size={24} />
              </div>
              
              <div className="option-info">
                <span className="option-name">{browser.name}</span>
                <span className="option-type">
                  {browser.type}
                  <span className="option-description">
                    {browser.description}
                  </span>
                </span>
              </div>

              <div className="radio-indicator">
                <div className="radio-inner" />
              </div>

              <input
                type="radio"
                name="browserSelect"
                value={browser.id}
                checked={settings.browser === browser.id}
                onChange={() => setSettings(prev => ({...prev, browser: browser.id}))}
                className="sr-only"
              />
            </div>
          </label>
        ))}
      </div>

      {showAlgorithmDropdown && (
        <div className="algorithm-section">
          <label className="algorithm-label">Select Algorithm</label>
          <select
            value={settings.searchAlgorithm}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              searchAlgorithm: e.target.value
            }))}
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

export default BrowserSelector;