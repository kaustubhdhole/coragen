import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    browser: 'google',
    searchAlgorithm: 'TFIDF',

    // Reranker settings
    reranker: {
      isEnabled: false,
      prompt: 'Rerank the documents based on relevance to the query while maintaining diversity of information.',
      method: 'pointwise'
    },

    // Query Reformulation settings
    queryReformulation: {
      isEnabled: false,
      prompt: 'Analyze the user query and reformulate it to improve search results while maintaining the original intent.'
    },

    generator: 'gpt-4',
    model: 'gpt-4-turbo',
    apiKey: '',
    
    // Controls the settings sidebar visibility
    isSettingsOpen: false,
    isLoading: false,
    
    attributes: [],
    
    // HuggingFace settings
    huggingface: {
      // Generator settings
      generatorDeployment: 'api',
      apiKey: '',
      generatorModels: [],
      selectedGeneratorModel: null,
      generatorLoading: null,
      generatorParams: {
        maxNewTokens: 512,
        temperature: 0.7,
        topP: 0.95
      },
      
      // Evaluator settings
      evaluatorEnabled: false,
      evaluatorDeployment: 'api',
      useGeneratorApiKey: true,
      evaluatorApiKey: '',
      evaluatorModels: [],
      selectedEvaluatorModel: null,
      evaluatorLoading: null,
      evaluatorParams: {
        batchSize: 4,
        temperature: 0.3,
        maxTokens: 128
      }
    },
    
    llmJudge: {
      evaluator: {
        model: 'gpt-4',
        modelVersion: 'gpt-4-turbo',
        apiKey: ''
      },
    
      enabledCategories: {
        'Context Relevance': true,
        'Answer Relevance': true,
        'Answer Groundedness': true
      },
      
      prompts: {
        'Context Relevance': 'Is the retrieved context relevant to the query?',
        'Answer Relevance': 'Is the answer relevant to the query?',
        'Answer Groundedness': 'Is the response supported by the context?'
      }
    },

    searchResults: null
  });

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      setSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export default SettingsContext;
