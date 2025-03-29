
import React, { useState } from 'react';
import { useSettings } from '../Contexts/SettingContext';
import { 
  X, Chrome, Database, Server, Settings, SortDesc, 
  FileSearch, HelpCircle, Zap, Terminal, Cpu, 
  Download, Globe, HardDrive
} from 'lucide-react';
import './SettingsSidebar.css';

const SettingsSidebar = () => {
  const { settings, setSettings } = useSettings();
  const [generatorModelInput, setGeneratorModelInput] = useState('');
  const [evaluatorModelInput, setEvaluatorModelInput] = useState('');

  const browsers = [
    {
      id: 'google',
      name: 'Google',
      description: 'Web search using Google API',
      icon: Chrome,
      requiresAlgorithm: false
    },
    {
      id: 'bing',
      name: 'Microsoft Bing',
      description: 'Web search using Bing API',
      icon: Database,
      requiresAlgorithm: false
    },
    {
      id: 'pyterrier',
      name: 'Pyterrier',
      description: 'Local search engine',
      icon: Database,
      requiresAlgorithm: true
    }
    
    
  ];
  const algorithms = [
    { id: 'TFIDF', name: 'TF-IDF' },
    { id: 'BM25', name: 'BM25' },
    { id: 'DPR', name: 'Dense Passage Retrieval' }
  ];

  const rerankMethods = [
    { 
      id: 'pointwise', 
      name: 'Point-wise', 
      description: 'Score documents independently' 
    },
    { 
      id: 'pairwise', 
      name: 'Pair-wise', 
      description: 'Compare document pairs' 
    },
    { 
      id: 'listwise', 
      name: 'List-wise', 
      description: 'Consider entire result list' 
    }
  ];

  const models = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: "OpenAI's advanced model",
      versions: ['gpt-4-turbo', 'gpt-4']
    },
    {
      id: 'claude',
      name: 'Claude',
      description: "Anthropic's AI model",
      versions: ['claude-3', 'claude-2']
    },
    {
      id: 'llama',
      name: 'Llama',
      description: "Meta's open source LLM",
      versions: ['llama-2-70b', 'llama-2-13b']
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      description: "Custom HuggingFace models",
      versions: ['custom']
    }
  ];

  const modelDeploymentTypes = [
    {
      id: 'api',
      name: 'API',
      description: 'Use HuggingFace Inference API',
      icon: Globe
    },
    {
      id: 'local',
      name: 'Local',
      description: 'Use locally deployed model',
      icon: HardDrive
    }
  ];

  const judgeCategories = [
    {
      name: 'Context Relevance',
      description: 'How well the response relates to the context',
      defaultPrompt: 'How well the response relates to the context?'
    },
    {
      name: 'Answer Relevance',
      description: 'How well the response addresses the query',
      defaultPrompt: 'How well the response relates to the context?'
    },
    {
      name: 'Answer Groundedness',
      description: 'How well the response is supported by facts',
      defaultPrompt: 'Is the response supported by the context?'
    },
    {
      name: 'Cross Attribute Relatedness',
      description: 'How well the response is supported by facts',
      defaultPrompt: "On a scale of 0 to 5, where 0 means completely unrelated and 5 means highly related,\nrate how relevant or similar these two summaries are to each other:\n\nSummary 1: {summary1}\n\nSummary 2: {summary2}\n\nConsider conceptual similarities, shared topics, and logical connections.\nProvide only a numerical score between 0 and 5, with one decimal place precision."
    }

  ];

  const handleAddHuggingFaceGeneratorModel = (e) => {
    e.preventDefault();
    if (!generatorModelInput.trim()) return;
    
    // Update the settings with the new model
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        huggingface: {
          ...prev.huggingface,
          generatorModels: [
            ...(prev.huggingface?.generatorModels || []),
            {
              id: generatorModelInput,
              name: generatorModelInput,
              isLoaded: false
            }
          ]
        }
      };
      
      // If this is the first model, set it as the selected model
      if (!prev.huggingface?.generatorModels?.length) {
        updatedSettings.huggingface.selectedGeneratorModel = generatorModelInput;
      }
      
      return updatedSettings;
    });
    
    setGeneratorModelInput('');
  };

  const handleAddHuggingFaceEvaluatorModel = (e) => {
    e.preventDefault();
    if (!evaluatorModelInput.trim()) return;
    
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        huggingface: {
          ...prev.huggingface,
          evaluatorModels: [
            ...(prev.huggingface?.evaluatorModels || []),
            {
              id: evaluatorModelInput,
              name: evaluatorModelInput,
              isLoaded: false
            }
          ]
        }
      };
      
      // If this is the first model, set it as the selected model
      if (!prev.huggingface?.evaluatorModels?.length) {
        updatedSettings.huggingface.selectedEvaluatorModel = evaluatorModelInput;
      }
      
      return updatedSettings;
    });
    
    setEvaluatorModelInput('');
  };

  const removeHuggingFaceModel = (modelId, type) => {
    setSettings(prev => {
      const modelListKey = type === 'generator' ? 'generatorModels' : 'evaluatorModels';
      const selectedModelKey = type === 'generator' ? 'selectedGeneratorModel' : 'selectedEvaluatorModel';
      
      const updatedModels = prev.huggingface?.[modelListKey].filter(model => model.id !== modelId) || [];
      
      // If the removed model was selected, update the selected model
      let selectedModel = prev.huggingface?.[selectedModelKey];
      if (selectedModel === modelId && updatedModels.length > 0) {
        selectedModel = updatedModels[0].id;
      } else if (updatedModels.length === 0) {
        selectedModel = null;
      }
      
      return {
        ...prev,
        huggingface: {
          ...prev.huggingface,
          [modelListKey]: updatedModels,
          [selectedModelKey]: selectedModel
        }
      };
    });
  };

  const loadHuggingFaceModel = async (modelId, type) => {
    // Here we'll update the UI to show loading state
    setSettings(prev => {
      const modelListKey = type === 'generator' ? 'generatorModels' : 'evaluatorModels';
      
      return {
        ...prev,
        huggingface: {
          ...prev.huggingface,
          [`${type}Loading`]: modelId
        }
      };
    });

    // In a real implementation, we would make an API call to the backend
    // to load the model. Here we'll just simulate it with a timeout.
    try {
      // This would be replaced with an actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update model state after successful loading
      setSettings(prev => {
        const modelListKey = type === 'generator' ? 'generatorModels' : 'evaluatorModels';
        
        return {
          ...prev,
          huggingface: {
            ...prev.huggingface,
            [`${type}Loading`]: null,
            [modelListKey]: prev.huggingface[modelListKey].map(model => 
              model.id === modelId ? { ...model, isLoaded: true } : model
            )
          }
        };
      });
    } catch (error) {
      console.error(`Error loading ${type} model:`, error);
      
      // Update UI on error
      setSettings(prev => ({
        ...prev,
        huggingface: {
          ...prev.huggingface,
          [`${type}Loading`]: null
        }
      }));
    }
  };

  const renderBrowserSelector = () => (
    <div className="settings-section">
      <div className="section-header">
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
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  browser: e.target.value
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
          <label className="section-label">Search Algorithm</label>
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

  const renderGeneratorSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <Zap size={20} />
        <h3>Generator Settings</h3>
      </div>

      <div className="model-options">
        {models.map((model) => (
          <label
            key={model.id}
            className={`model-option ${settings.generator === model.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="generator"
              checked={settings.generator === model.id}
              onChange={() => setSettings(prev => ({
                ...prev,
                generator: model.id,
                model: model.id === 'huggingface' ? 'custom' : model.versions[0]
              }))}
              className="sr-only"
            />
            <div className="model-content">
              <div className="model-info">
                <div className="model-name">{model.name}</div>
                <div className="model-description">{model.description}</div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {settings.generator === 'huggingface' ? (
        <div className="huggingface-section">
          {/* Deployment Type Selection */}
          <div className="deployment-section">
            <label className="section-label">Deployment Type</label>
            <div className="deployment-options">
              {modelDeploymentTypes.map(type => (
                <label
                  key={type.id}
                  className={`deployment-option ${settings.huggingface?.generatorDeployment === type.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="generatorDeployment"
                    value={type.id}
                    checked={settings.huggingface?.generatorDeployment === type.id}
                    onChange={() => {
                      setSettings(prev => ({
                        ...prev,
                        huggingface: {
                          ...prev.huggingface,
                          generatorDeployment: type.id
                        }
                      }));
                    }}
                    className="sr-only"
                  />
                  <div className="deployment-content">
                    <div className="deployment-icon">
                      <type.icon size={20} />
                    </div>
                    <div className="deployment-info">
                      <div className="deployment-name">{type.name}</div>
                      <div className="deployment-description">{type.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* API Key for API deployment */}
          {settings.huggingface?.generatorDeployment === 'api' && (
            <div className="config-group">
              <label className="section-label" htmlFor="huggingfaceApiKey">
                HuggingFace API Key
              </label>
              <input
                id="huggingfaceApiKey"
                type="password"
                className="api-input"
                placeholder="Enter your HuggingFace API key"
                value={settings.huggingface?.apiKey || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  huggingface: {
                    ...prev.huggingface,
                    apiKey: e.target.value
                  }
                }))}
              />
            </div>
          )}

          {/* Model Selection and Management */}
          <div className="model-management">
            <h4 className="management-title">Generator Models</h4>
            
            <form onSubmit={handleAddHuggingFaceGeneratorModel} className="add-model-form">
              <input
                type="text"
                value={generatorModelInput}
                onChange={(e) => setGeneratorModelInput(e.target.value)}
                placeholder="Enter model name or path"
                className="model-input"
              />
              <button 
                type="submit" 
                className="add-model-btn"
                disabled={!generatorModelInput.trim()}
              >
                Add Model
              </button>
            </form>
            
            <div className="models-list">
              {settings.huggingface?.generatorModels?.length > 0 ? (
                settings.huggingface.generatorModels.map(model => (
                  <div key={model.id} className="model-item">
                    <div className="model-item-info">
                      <input
                        type="radio"
                        name="selectedGeneratorModel"
                        checked={settings.huggingface?.selectedGeneratorModel === model.id}
                        onChange={() => {
                          setSettings(prev => ({
                            ...prev,
                            huggingface: {
                              ...prev.huggingface,
                              selectedGeneratorModel: model.id
                            }
                          }));
                        }}
                      />
                      <span className="model-item-name">{model.name}</span>
                      <span className={`model-status ${model.isLoaded ? 'loaded' : 'not-loaded'}`}>
                        {model.isLoaded ? 'Loaded' : 'Not Loaded'}
                      </span>
                    </div>
                    <div className="model-item-actions">
                      {!model.isLoaded && (
                        <button 
                          className="load-model-btn"
                          onClick={() => loadHuggingFaceModel(model.id, 'generator')}
                          disabled={settings.huggingface?.generatorLoading === model.id}
                        >
                          {settings.huggingface?.generatorLoading === model.id ? (
                            <span className="loading-spinner">Loading...</span>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Load</span>
                            </>
                          )}
                        </button>
                      )}
                      <button 
                        className="remove-model-btn"
                        onClick={() => removeHuggingFaceModel(model.id, 'generator')}
                        disabled={settings.huggingface?.generatorLoading === model.id}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-models">
                  No generator models added. Add a model to get started.
                </div>
              )}
            </div>
          </div>

          {/* Generator Parameters */}
          <div className="model-parameters">
            <h4 className="parameters-title">Generation Parameters</h4>
            <div className="parameter-fields">
              <div className="parameter-group">
                <label className="param-label" htmlFor="maxNewTokens">Max New Tokens</label>
                <input
                  id="maxNewTokens"
                  type="number"
                  min="1"
                  max="4096"
                  className="param-input"
                  value={settings.huggingface?.generatorParams?.maxNewTokens || 512}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      generatorParams: {
                        ...prev.huggingface?.generatorParams,
                        maxNewTokens: parseInt(e.target.value)
                      }
                    }
                  }))}
                />
              </div>

              <div className="parameter-group">
                <label className="param-label" htmlFor="temperature">Temperature</label>
                <input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  className="param-input"
                  value={settings.huggingface?.generatorParams?.temperature || 0.7}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      generatorParams: {
                        ...prev.huggingface?.generatorParams,
                        temperature: parseFloat(e.target.value)
                      }
                    }
                  }))}
                />
              </div>

              <div className="parameter-group">
                <label className="param-label" htmlFor="topP">Top P</label>
                <input
                  id="topP"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  className="param-input"
                  value={settings.huggingface?.generatorParams?.topP || 0.95}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      generatorParams: {
                        ...prev.huggingface?.generatorParams,
                        topP: parseFloat(e.target.value)
                      }
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="model-config">
          <div className="config-group">
            <label className="section-label" htmlFor="modelVersion">
              Model Version
            </label>
            <select
              id="modelVersion"
              className="model-select"
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
            <label className="section-label" htmlFor="apiKey">
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
              className="api-input"
              placeholder="Enter your API key"
              value={settings.apiKey}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                apiKey: e.target.value
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderReranker = () => (
    <div className="settings-section">
      <div className="section-header">
        <SortDesc size={20} />
        <h3>Reranking</h3>
      </div>

      <div className="reranker-content">
        <label className="enable-option">
          <input
            type="checkbox"
            checked={settings.reranker?.isEnabled}
            onChange={(e) => {
              setSettings(prev => ({
                ...prev,
                reranker: {
                  ...prev.reranker,
                  isEnabled: e.target.checked
                }
              }));
            }}
            className="enable-checkbox"
          />
          <span>Enable Reranking</span>
        </label>

        {settings.reranker?.isEnabled && (
          <>
            <div className="prompt-section">
              <label className="section-label">Reranking Prompt</label>
              <div className="prompt-controls">
                <button 
                  className="reset-button"
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      reranker: {
                        ...prev.reranker,
                        prompt: 'Rerank the documents based on relevance to the query while maintaining diversity of information.'
                      }
                    }));
                  }}
                >
                  Reset to Default
                </button>
              </div>
              <textarea
                value={settings.reranker?.prompt || ''}
                onChange={(e) => {
                  setSettings(prev => ({
                    ...prev,
                    reranker: {
                      ...prev.reranker,
                      prompt: e.target.value
                    }
                  }));
                }}
                placeholder="Enter reranking prompt..."
                className="prompt-input"
                rows={4}
              />
            </div>

            <div className="method-section">
              <label className="section-label">Reranking Method</label>
              <div className="method-options">
                {rerankMethods.map(method => (
                  <label
                    key={method.id}
                    className={`method-option ${settings.reranker?.method === method.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="rerankMethod"
                      value={method.id}
                      checked={settings.reranker?.method === method.id}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          reranker: {
                            ...prev.reranker,
                            method: e.target.value
                          }
                        }));
                      }}
                      className="sr-only"
                    />
                    <div className="method-content">
                      <div className="method-info">
                        <div className="method-name">{method.name}</div>
                        <div className="method-description">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderQueryReformulation = () => (
    <div className="settings-section">
      <div className="section-header">
        <FileSearch size={20} />
        <h3>Query Reformulation</h3>
      </div>

      <div className="reformulation-content">
        <label className="enable-option">
          <input
            type="checkbox"
            checked={settings.queryReformulation?.isEnabled}
            onChange={(e) => {
              setSettings(prev => ({
                ...prev,
                queryReformulation: {
                  ...prev.queryReformulation,
                  isEnabled: e.target.checked
                }
              }));
            }}
            className="enable-checkbox"
          />
          <span>Enable Query Reformulation</span>
        </label>

        {settings.queryReformulation?.isEnabled && (
          <div className="prompt-section">
            <label className="section-label">Reformulation Prompt</label>
            <div className="prompt-controls">
              <button 
                className="reset-button"
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    queryReformulation: {
                      ...prev.queryReformulation,
                      prompt: 'Analyze the user query and reformulate it to improve search results while maintaining the original intent.'
                    }
                  }));
                }}
              >
                Reset to Default
              </button>
            </div>
            <textarea
              value={settings.queryReformulation?.prompt || ''}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  queryReformulation: {
                    ...prev.queryReformulation,
                    prompt: e.target.value
                  }
                }));
              }}
              placeholder="Enter reformulation prompt..."
              className="prompt-input"
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderHuggingFaceEvaluator = () => (
    <div className="settings-section">
      <div className="section-header">
        <Cpu size={20} />
        <h3>HuggingFace Evaluator</h3>
      </div>
      
      <div className="enable-evaluator">
        <label className="enable-option">
          <input
            type="checkbox"
            checked={settings.huggingface?.evaluatorEnabled}
            onChange={(e) => {
              setSettings(prev => ({
                ...prev,
                huggingface: {
                  ...prev.huggingface,
                  evaluatorEnabled: e.target.checked
                }
              }));
            }}
            className="enable-checkbox"
          />
          <span>Use HuggingFace for Evaluation</span>
        </label>
      </div>

      {settings.huggingface?.evaluatorEnabled && (
        <>
          {/* Deployment Type Selection */}
          <div className="deployment-section">
            <label className="section-label">Deployment Type</label>
            <div className="deployment-options">
              {modelDeploymentTypes.map(type => (
                <label
                  key={type.id}
                  className={`deployment-option ${settings.huggingface?.evaluatorDeployment === type.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="evaluatorDeployment"
                    value={type.id}
                    checked={settings.huggingface?.evaluatorDeployment === type.id}
                    onChange={() => {
                      setSettings(prev => ({
                        ...prev,
                        huggingface: {
                          ...prev.huggingface,
                          evaluatorDeployment: type.id
                        }
                      }));
                    }}
                    className="sr-only"
                  />
                  <div className="deployment-content">
                    <div className="deployment-icon">
                      <type.icon size={20} />
                    </div>
                    <div className="deployment-info">
                      <div className="deployment-name">{type.name}</div>
                      <div className="deployment-description">{type.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* API Key for API deployment (only if different from generator) */}
          {settings.huggingface?.evaluatorDeployment === 'api' && (
            <div className="config-group">
              <label className="section-label" htmlFor="evaluatorApiKey">
                Use same API key as generator
                <input
                  type="checkbox"
                  checked={settings.huggingface?.useGeneratorApiKey}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      huggingface: {
                        ...prev.huggingface,
                        useGeneratorApiKey: e.target.checked
                      }
                    }));
                  }}
                  className="same-api-checkbox"
                />
              </label>
              
              {!settings.huggingface?.useGeneratorApiKey && (
                <input
                  id="evaluatorApiKey"
                  type="password"
                  className="api-input"
                  placeholder="Enter your HuggingFace API key for evaluation"
                  value={settings.huggingface?.evaluatorApiKey || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      evaluatorApiKey: e.target.value
                    }
                  }))}
                />
              )}
            </div>
          )}

          {/* Model Selection and Management */}
          <div className="model-management">
            <h4 className="management-title">Evaluator Models</h4>
            
            <form onSubmit={handleAddHuggingFaceEvaluatorModel} className="add-model-form">
              <input
                type="text"
                value={evaluatorModelInput}
                onChange={(e) => setEvaluatorModelInput(e.target.value)}
                placeholder="Enter model name or path"
                className="model-input"
              />
              <button 
                type="submit" 
                className="add-model-btn"
                disabled={!evaluatorModelInput.trim()}
              >
                Add Model
              </button>
            </form>
            
            <div className="models-list">
              {settings.huggingface?.evaluatorModels?.length > 0 ? (
                settings.huggingface.evaluatorModels.map(model => (
                  <div key={model.id} className="model-item">
                    <div className="model-item-info">
                      <input
                        type="radio"
                        name="selectedEvaluatorModel"
                        checked={settings.huggingface?.selectedEvaluatorModel === model.id}
                        onChange={() => {
                          setSettings(prev => ({
                            ...prev,
                            huggingface: {
                              ...prev.huggingface,
                              selectedEvaluatorModel: model.id
                            }
                          }));
                        }}
                      />
                      <span className="model-item-name">{model.name}</span>
                      <span className={`model-status ${model.isLoaded ? 'loaded' : 'not-loaded'}`}>
                        {model.isLoaded ? 'Loaded' : 'Not Loaded'}
                      </span>
                    </div>
                    <div className="model-item-actions">
                      {!model.isLoaded && (
                        <button 
                          className="load-model-btn"
                          onClick={() => loadHuggingFaceModel(model.id, 'evaluator')}
                          disabled={settings.huggingface?.evaluatorLoading === model.id}
                        >
                          {settings.huggingface?.evaluatorLoading === model.id ? (
                            <span className="loading-spinner">Loading...</span>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Load</span>
                            </>
                          )}
                        </button>
                      )}
                      <button 
                        className="remove-model-btn"
                        onClick={() => removeHuggingFaceModel(model.id, 'evaluator')}
                        disabled={settings.huggingface?.evaluatorLoading === model.id}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-models">
                  No evaluator models added. Add a model to get started.
                </div>
              )}
            </div>
          </div>

          {/* Evaluator Parameters */}
          <div className="model-parameters">
            <h4 className="parameters-title">Evaluation Parameters</h4>
            <div className="parameter-fields">
              <div className="parameter-group">
                <label className="param-label" htmlFor="evalBatchSize">Batch Size</label>
                <input
                  id="evalBatchSize"
                  type="number"
                  min="1"
                  max="32"
                  className="param-input"
                  value={settings.huggingface?.evaluatorParams?.batchSize || 4}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      evaluatorParams: {
                        ...prev.huggingface?.evaluatorParams,
                        batchSize: parseInt(e.target.value)
                      }
                    }
                  }))}
                />
              </div>

              <div className="parameter-group">
                <label className="param-label" htmlFor="evalTemperature">Temperature</label>
                <input
                  id="evalTemperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  className="param-input"
                  value={settings.huggingface?.evaluatorParams?.temperature || 0.3}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      evaluatorParams: {
                        ...prev.huggingface?.evaluatorParams,
                        temperature: parseFloat(e.target.value)
                      }
                    }
                  }))}
                />
              </div>

              <div className="parameter-group">
                <label className="param-label" htmlFor="evalMaxTokens">Max Tokens</label>
                <input
                  id="evalMaxTokens"
                  type="number"
                  min="1"
                  max="512"
                  className="param-input"
                  value={settings.huggingface?.evaluatorParams?.maxTokens || 128}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    huggingface: {
                      ...prev.huggingface,
                      evaluatorParams: {
                        ...prev.huggingface?.evaluatorParams,
                        maxTokens: parseInt(e.target.value)
                      }
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderLLMJudge = () => (
    <div className="settings-section">
      <div className="section-header">
        <Terminal size={20} />
        <h3>Evaluation Parameters</h3>
      </div>

      {judgeCategories.map((category) => (
        <div key={category.name} className="judge-category">
          <div className="category-header">
            <h4 className="category-title">{category.name}</h4>
            <p className="category-description">{category.description}</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.llmJudge?.enabledCategories?.[category.name] ?? true}
                onChange={() => {
                  setSettings(prev => ({
                    ...prev,
                    llmJudge: {
                      ...prev.llmJudge,
                      enabledCategories: {
                        ...prev.llmJudge?.enabledCategories,
                        [category.name]: !(prev.llmJudge?.enabledCategories?.[category.name] ?? true)
                      }
                    }
                  }));
                }}
                className="category-checkbox"
              />
              <span>Evaluate using this</span>
            </label>
          </div>
          
          <div className="prompt-section">
            <div className="prompt-controls">
              <button 
                className="reset-button"
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    llmJudge: {
                      ...prev.llmJudge,
                      prompts: {
                        ...prev.llmJudge?.prompts,
                        [category.name]: category.defaultPrompt
                      }
                    }
                  }));
                }}
                disabled={!settings.llmJudge?.enabledCategories?.[category.name]}
              >
                Reset to Default
              </button>
            </div>
            <textarea
              className="prompt-input"
              value={settings.llmJudge?.prompts?.[category.name] || category.defaultPrompt}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  llmJudge: {
                    ...prev.llmJudge,
                    prompts: {
                      ...prev.llmJudge?.prompts,
                      [category.name]: e.target.value
                    }
                  }
                }));
              }}
              placeholder={`Enter prompt for ${category.name} evaluation`}
              rows={4}
              disabled={!settings.llmJudge?.enabledCategories?.[category.name]}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {settings.isSettingsOpen && (
        <div className="settings-overlay" onClick={() => setSettings(prev => ({ ...prev, isSettingsOpen: false }))} />
      )}
      
      <aside className={`settings-sidebar ${settings.isSettingsOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button 
            className="close-button"
            onClick={() => setSettings(prev => ({ ...prev, isSettingsOpen: false }))}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {renderBrowserSelector()}
          <div className="settings-divider" />
          {renderGeneratorSettings()}
          <div className="settings-divider" />
          {renderReranker()}
          <div className="settings-divider" />
          {renderQueryReformulation()}
          <div className="settings-divider" />
          {renderHuggingFaceEvaluator()}
          <div className="settings-divider" />
          {renderLLMJudge()}
        </div>
      </aside>
    </>
  );
};

export default SettingsSidebar;