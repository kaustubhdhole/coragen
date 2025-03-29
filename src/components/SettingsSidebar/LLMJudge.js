// import React from 'react';
// import { useSettings } from '../Contexts/SettingContext';
// import { AlertCircle } from 'lucide-react';
// import './LLMJudge.css';

// const LLMJudge = () => {
//   const { settings, setSettings } = useSettings();
  
//   const judgeCategories = [
//     {
//       name: 'Context Relevance',
//       description: 'How well the response relates to the context',
//       defaultPrompt: 'Is the retrived context relevent to the query?',
//       isEnabled: settings.llmJudge?.enabledCategories?.['Context Relevance'] ?? true
//     },
//     {
//       name: 'Answer Relevance',
//       description: 'How well the response addresses the query',
//       defaultPrompt: 'Is the answer relevent to the query?',
//       isEnabled: settings.llmJudge?.enabledCategories?.['Answer Relevance'] ?? true
//     },
//     {
//       name: 'Answer Groundedness',
//       description: 'How well the response is supported by facts',
//       defaultPrompt: 'Is the response supported by the context?',
//       isEnabled: settings.llmJudge?.enabledCategories?.['Answer Groundedness'] ?? true
//     }
//   ];

//   const handlePromptChange = (category, value) => {
//     setSettings(prev => ({
//       ...prev,
//       llmJudge: {
//         ...prev.llmJudge,
//         prompts: {
//           ...prev.llmJudge?.prompts,
//           [category]: value
//         }
//       }
//     }));
//   };

//   const handleCheckboxChange = (category) => {
//     const newEnabledState = !settings.llmJudge?.enabledCategories?.[category];
//     setSettings(prev => ({
//       ...prev,
//       llmJudge: {
//         ...prev.llmJudge,
//         enabledCategories: {
//           ...prev.llmJudge?.enabledCategories,
//           [category]: newEnabledState
//         }
//       }
//     }));
    
//     // Update the judgeCategories array
//     const categoryIndex = judgeCategories.findIndex(cat => cat.name === category);
//     if (categoryIndex !== -1) {
//       judgeCategories[categoryIndex].isEnabled = newEnabledState;
//     }
//   };

//   const resetToDefault = (category) => {
//     const defaultPrompt = judgeCategories.find(cat => cat.name === category)?.defaultPrompt;
//     handlePromptChange(category, defaultPrompt);
//   };

//   return (
//     <div className="llm-judge">
//       {judgeCategories.map((category) => (
//         <div key={category.name} className="judge-category">
//           <div className="category-header">
//             <div className="category-title-row">
//               <label className="checkbox-label">
//                 <input
//                   type="checkbox"
//                   checked={category.isEnabled}
//                   onChange={() => handleCheckboxChange(category.name)}
//                   className="category-checkbox"
//                 />
//                 <span className="checkbox-text">Evaluate using this</span>
//               </label>
//               <h3 className="category-title">{category.name}</h3>
//             </div>
//             <p className="category-description">{category.description}</p>
//           </div>
          
//           <div className="prompt-wrapper">
//             <textarea
//               className="prompt-textarea"
//               value={settings.llmJudge?.prompts?.[category.name] || category.defaultPrompt}
//               onChange={(e) => handlePromptChange(category.name, e.target.value)}
//               placeholder={`Enter prompt for ${category.name} evaluation`}
//               rows={4}
//               disabled={!category.isEnabled}
//             />
//             <div className="resize-indicator">
//               <AlertCircle size={14} />
//             </div>
//             <button 
//               className="reset-button"
//               onClick={() => resetToDefault(category.name)}
//               disabled={!category.isEnabled}
//             >
//               Reset to Default
//             </button>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default LLMJudge;


import React from 'react';
import { useSettings } from '../Contexts/SettingContext';
import { AlertCircle } from 'lucide-react';
import './LLMJudge.css';

const LLMJudge = () => {
  const { settings, setSettings } = useSettings();
  
  const judgeCategories = [
    {
      name: 'Context Relevance',
      description: 'How well the response relates to the context',
      defaultPrompt: 'Is the retrived context relevent to the query?',
      isEnabled: settings.llmJudge?.enabledCategories?.['Context Relevance'] ?? true
    },
    {
      name: 'Answer Relevance',
      description: 'How well the response addresses the query',
      defaultPrompt: 'Is the answer relevent to the query?',
      isEnabled: settings.llmJudge?.enabledCategories?.['Answer Relevance'] ?? true
    },
    {
      name: 'Answer Groundedness',
      description: 'How well the response is supported by facts',
      defaultPrompt: 'Is the response supported by the context?',
      isEnabled: settings.llmJudge?.enabledCategories?.['Answer Groundedness'] ?? true
    }
  ];

  const handlePromptChange = (category, value) => {
    setSettings(prev => ({
      ...prev,
      llmJudge: {
        ...prev.llmJudge,
        prompts: {
          ...prev.llmJudge?.prompts,
          [category]: value
        }
      }
    }));
  };

  const handleCheckboxChange = (category) => {
    const newEnabledState = !settings.llmJudge?.enabledCategories?.[category];
    setSettings(prev => ({
      ...prev,
      llmJudge: {
        ...prev.llmJudge,
        enabledCategories: {
          ...prev.llmJudge?.enabledCategories,
          [category]: newEnabledState
        }
      }
    }));
    
    const categoryIndex = judgeCategories.findIndex(cat => cat.name === category);
    if (categoryIndex !== -1) {
      judgeCategories[categoryIndex].isEnabled = newEnabledState;
    }
  };

  const resetToDefault = (category) => {
    const defaultPrompt = judgeCategories.find(cat => cat.name === category)?.defaultPrompt;
    handlePromptChange(category, defaultPrompt);
  };

  return (
    <div className="llm-judge">
      <div className="evaluation-header">
        <h2 className="section-title">Evaluation Parameters</h2>
        <p className="section-subtitle">Configure response evaluation settings</p>
      </div>
      {judgeCategories.map((category) => (
        <div key={category.name} className="judge-category">
          <div className="category-header">
            <h3 className="category-title">{category.name}</h3>
            <p className="category-description">{category.description}</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={category.isEnabled}
                onChange={() => handleCheckboxChange(category.name)}
                className="category-checkbox"
              />
              <span className="checkbox-text">Evaluate using this</span>
            </label>
          </div>
          
          <div className="prompt-wrapper">
            <div className="prompt-controls">
              <button 
                className="reset-button"
                onClick={() => resetToDefault(category.name)}
                disabled={!category.isEnabled}
              >
                Reset to Default
              </button>
            </div>
            <textarea
              className="prompt-textarea"
              value={settings.llmJudge?.prompts?.[category.name] || category.defaultPrompt}
              onChange={(e) => handlePromptChange(category.name, e.target.value)}
              placeholder={`Enter prompt for ${category.name} evaluation`}
              rows={4}
              disabled={!category.isEnabled}
            />
            <div className="resize-indicator">
              <AlertCircle size={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LLMJudge;