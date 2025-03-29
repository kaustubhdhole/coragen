import React, { useState } from 'react';
import { useSettings } from './Contexts/SettingContext';
import { Tag, Plus, X } from 'lucide-react';
import '../styles/ComparisonParameters.css';

const ComparisionParameter = () => {
  const { settings, setSettings } = useSettings();
  const [newParameter, setNewParameter] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newParameter.trim()) return;

    setSettings(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters || [],
        { id: Date.now(), name: newParameter.trim(), selected: true }
      ]
    }));
    setNewParameter('');
  };

  const toggleParameter = (parameterId) => {
    setSettings(prev => ({
      ...prev,
      parameters: prev.parameters.map(param =>
        param.id === parameterId ? { ...param, selected: !param.selected } : param
      )
    }));
  };

  return (
    <div className="parameter-container">
      <div className="parameter-header">
        <h2>Aspects</h2>
        <form onSubmit={handleAdd} className="parameter-form">
          <div className="input-wrapper">
            <Tag className="input-icon" size={18} />
            <input
              type="text"
              value={newParameter}
              onChange={(e) => setNewParameter(e.target.value)}
              placeholder="Add new aspect like pro, con or male, female, etc."
              className="parameter-input"
            />
          </div>
          <button type="submit" className="add-parameter-btn">
            <Plus size={16} />
            Add
          </button>
        </form>
      </div>

      <div className="parameters-list">
        {settings.parameters?.length > 0 ? (
          <div className="parameter-tags">
            {settings.parameters.map(param => (
              <div 
                key={param.id}
                className={`parameter-tag ${param.selected ? 'selected' : ''}`}
                onClick={() => toggleParameter(param.id)}
              >
                <span className="parameter-name">{param.name}</span>
                <button
                  className="remove-parameter"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettings(prev => ({
                      ...prev,
                      parameters: prev.parameters.filter(p => p.id !== param.id)
                    }));
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-parameters">
            Add parameters to compare search results
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisionParameter;