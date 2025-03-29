import React from 'react';
import { useSettings } from '../Contexts/SettingContext';
import './QueryReformulation.css';

const QueryReformulation = () => {
  const { settings, setSettings } = useSettings();

  const handleEnableReformulation = (e) => {
    setSettings(prev => ({
      ...prev,
      queryReformulation: {
        ...prev.queryReformulation,
        isEnabled: e.target.checked
      }
    }));
  };

  const handlePromptChange = (e) => {
    setSettings(prev => ({
      ...prev,
      queryReformulation: {
        ...prev.queryReformulation,
        prompt: e.target.value
      }
    }));
  };

  const handleResetPrompt = () => {
    setSettings(prev => ({
      ...prev,
      queryReformulation: {
        ...prev.queryReformulation,
        prompt: 'Analyze the user query and reformulate it to improve search results while maintaining the original intent.'
      }
    }));
  };

  return (
    <div className="query-reformulation">
      <div className="reformulation-content">
        <label className="enable-reformulation">
          <input
            type="checkbox"
            checked={settings.queryReformulation.isEnabled}
            onChange={handleEnableReformulation}
            className="reformulation-checkbox"
          />
          <span className="checkbox-text">Enable Query Reformulation</span>
        </label>

        {settings.queryReformulation.isEnabled && (
          <div className="prompt-section">
            <div className="prompt-controls">
              <button 
                className="reset-button"
                onClick={handleResetPrompt}
              >
                Reset to Default
              </button>
            </div>
            <textarea
              className="prompt-input"
              value={settings.queryReformulation.prompt}
              onChange={handlePromptChange}
              placeholder="Enter reformulation prompt..."
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryReformulation;