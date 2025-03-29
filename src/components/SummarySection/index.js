// import React from 'react';
// import './SummarySection.css';

// const SummarySection = ({ data, judgements }) => {
//   const renderScore = (score, category) => {
//     const getScoreLevel = (value, thresholds) => {
//       if (value >= thresholds.high) return 'high';
//       if (value >= thresholds.medium) return 'medium';
//       return 'low';
//     };

//     const thresholds = judgements?.[category] || { low: 0.3, medium: 0.6, high: 0.8 };
//     const level = getScoreLevel(score, thresholds);

//     return (
//       <div className={`score-indicator ${level}`}>
//         <span className="score-value">{(score * 100).toFixed(1)}%</span>
//         <span className="score-label">{level}</span>
//       </div>
//     );
//   };

//   if (!data || data.length === 0) {
//     return <div className="summary-section empty">No summary available</div>;
//   }

//   return (
//     <div className="summary-section">
//       <h3 className="summary-title">Summary</h3>
//       <div className="summary-content">
//         {data.map((item, index) => (
//           <div key={index} className="summary-item">
//             <div className="summary-text">
//               <p>{item.text}</p>
//               {item.source && (
//                 <span className="source-info">Source: {item.source}</span>
//               )}
//             </div>
//             {item.scores && (
//               <div className="score-metrics">
//                 {Object.entries(item.scores).map(([category, score]) => (
//                   <div key={category} className="score-category">
//                     <span className="category-label">{category}</span>
//                     {renderScore(score, category)}
//                   </div>
//                 ))}
//               </div>
//             )}
//             {item.confidence && (
//               <div className="confidence-indicator">
//                 <span className="confidence-label">Confidence</span>
//                 {renderScore(item.confidence, 'confidence')}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default SummarySection;

import React from 'react';
import './SummarySection.css';

const SummarySection = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="summary-section empty">No summary available</div>;
  }

  return (
    <div className="summary-section">
      <h3 className="section-title">Summary</h3>
      <div className="summary-content">
        {data.map((item, index) => (
          <div key={index} className="summary-item">
            <p className="summary-text">{item.text}</p>
            {/* Commented evaluation scoring system
            {item.evaluation && (
              <div className="evaluation-scores">
                <div className="score-item">
                  <span className="score-label">Context Relevance:</span>
                  <span className="score-value">{(item.evaluation.contextRelevance * 100).toFixed(1)}%</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Answer Relevance:</span>
                  <span className="score-value">{(item.evaluation.answerRelevance * 100).toFixed(1)}%</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Groundedness:</span>
                  <span className="score-value">{(item.evaluation.groundedness * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
            */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummarySection;