import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import { useSettings } from '../Contexts/SettingContext';
import './SearchBox.css';

const SearchBox = ({ searchText, setSearchText }) => {
  const { settings, setSettings } = useSettings();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;

    const selectedParameters = settings.parameters?.filter(param => param.selected)
                                                 .map(param => param.name) || [];
    
    if (selectedParameters.length === 0) {
      return;
    }

    setSettings(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('http://localhost:5001/api/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}` 
        },
        body: JSON.stringify({
          // Search query
          query: searchText.trim(),

          // Browser settings with algorithm for pyterrier/pyserini
          browser: {
            type: settings.browser || 'google',
            ...(settings.browser === 'pyterrier' || settings.browser === 'pyserini' 
              ? { algorithm: settings.searchAlgorithm } 
              : {})
          },

          // Reranker settings if enabled
          ...(settings.reranker?.isEnabled ? {
            reranker: {
              prompt: settings.reranker.prompt,
              method: settings.reranker.method
            }
          } : {}),

          ...(settings.queryReformulation?.isEnabled ? {
            queryReformulation: {
              prompt: settings.queryReformulation.prompt
            }
          } : {}),

          // Selected comparison parameters
          attributes: selectedParameters,

          // Generator settings
          generator: {
            model: settings.generator || 'gpt-4',
            version: settings.model || 'gpt-4-turbo',
            apiKey: settings.apiKey
          },

          // Evaluation settings
          evaluation: {
            evaluator: settings.llmJudge.evaluator,
            categories: [
              {
                name: 'Context Relevance',
                prompt: settings.llmJudge?.prompts?.['Context Relevance'],
                isEnabled: settings.llmJudge?.enabledCategories?.['Context Relevance'] ?? true
              },
              {
                name: 'Answer Relevance',
                prompt: settings.llmJudge?.prompts?.['Answer Relevance'],
                isEnabled: settings.llmJudge?.enabledCategories?.['Answer Relevance'] ?? true
              },
              {
                name: 'Answer Groundedness',
                prompt: settings.llmJudge?.prompts?.['Answer Groundedness'],
                isEnabled: settings.llmJudge?.enabledCategories?.['Answer Groundedness'] ?? true
              }
            ]
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      if (data && data.results) {
        setSettings(prev => ({
          ...prev,
          searchResults: data.results,
          isLoading: false
        }));
      }

    } catch (error) {
      console.error('Search error:', error);
      setSettings(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Determine button state class based on loading and validity
  const buttonStateClass = () => {
    if (settings.isLoading) return 'loading';
    if (!searchText.trim() || !settings.parameters?.some(p => p.selected)) {
      return 'disabled';
    }
    return '';
  };

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={24} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter your search query..."
            className="search-input"
            disabled={settings.isLoading}
          />
        </div>
        <button 
          type="submit" 
          className={`search-button ${buttonStateClass()}`}
          disabled={settings.isLoading || !searchText.trim() || !settings.parameters?.some(p => p.selected)}
        >
          {settings.isLoading ? (
            <Loader className="animate-spin" size={24} />
          ) : (
            'Search'
          )}
        </button>
      </form>
      <div className="search-info">
        Using {settings.browser || 'Google'} Search
        {(settings.browser === 'pyterrier' || settings.browser === 'pyserini') && 
          ` with ${settings.searchAlgorithm}`}
        {settings.reranker?.isEnabled && 
          ` | Reranking: ${settings.reranker.method}`}
      </div>
    </div>
  );
};

export default SearchBox;