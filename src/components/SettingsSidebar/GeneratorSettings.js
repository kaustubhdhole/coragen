import React from 'react';
import { useSettings } from '../Contexts/SettingContext';
import { HelpCircle } from 'lucide-react';
import './GeneratorSettings.css';

const GeneratorSettings = () => {
  const { settings, setSettings } = useSettings();
  
  const models = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI\'s advanced model',
      versions: ['gpt-4-turbo', 'gpt-4-32k', 'gpt-4']
    },
    {
      id: 'claude',
      name: 'Claude',
      provider: 'Anthropic\'s AI model',
      versions: ['claude-3-opus', 'claude-3-sonnet', 'claude-2']
    },
    {
      id: 'llama',
      name: 'Llama',
      provider: 'Meta\'s open source LLM',
      versions: ['llama-3.1-8b', 'llama-3-8b', 'llama-2-70b', 'llama-2-13b', 'llama-2-7b']
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      provider: 'HuggingFace\'s open source LLMs',
      versions: ['Mistral-7B']
    }
  ];

  return (
    <div className="generator-settings">
      <div className="generator-header">
        <h2 className="section-title">Generator Settings</h2>
        <p className="section-subtitle">Choose your preferred AI model</p>
      </div>

      <div className="model-options">
        {models.map((model) => (
          <label
            key={model.id}
            className={`model-option ${settings.generator === model.id ? 'selected' : ''}`}
          >
            <div className="model-content">
              <div className="radio-control">
                <input
                  type="radio"
                  name="generator"
                  checked={settings.generator === model.id}
                  onChange={() => setSettings(prev => ({
                    ...prev,
                    generator: model.id,
                    model: model.versions[0]
                  }))}
                  className="sr-only"
                />
                <div className="radio-check" />
              </div>

              <div className="model-info">
                <span className="model-name">{model.name}</span>
                <span className="model-provider">{model.provider}</span>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="model-config">
        <div className="config-group">
          <label className="config-label" htmlFor="modelVersion">
            Model Version
          </label>
          <select
            id="modelVersion"
            className="config-select"
            value={settings.model}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              model: e.target.value
            }))}
          >
            {models
              .find(m => m.id === settings.generator)
              ?.versions.map(version => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
          </select>
        </div>

        <div className="config-group">
          <label className="config-label" htmlFor="apiKey">
            API Key
            <button 
              type="button" 
              className="help-button"
              title="Required for API access"
            >
              <HelpCircle size={16} />
            </button>
          </label>
          <input
            id="apiKey"
            type="password"
            className="config-input"
            placeholder="Enter your API key"
            value={settings.apiKey}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              apiKey: e.target.value
            }))}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratorSettings;