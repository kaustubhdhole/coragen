import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, ChevronDown, ChevronUp, FileText, Shuffle } from 'lucide-react';
import './DataSlide.css';

const MAX_CHARS = 300;

const ArticleContent = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowButton = content.length > MAX_CHARS;
  const displayText = isExpanded ? content : content.slice(0, MAX_CHARS);

  return (
    <div className="article-content-wrapper">
      <p className="article-content">
        {displayText}
        {!isExpanded && shouldShowButton && '...'}
      </p>
      {shouldShowButton && (
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="button-content">
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span>Show More</span>
              </>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

const DataSlide = ({ 
  type, 
  content, 
  isActive, 
  isFullscreen, 
  onToggleFullscreen,
  onCrossAttributeCompare,
  activeCrossComparison,
  otherSlidesData 
}) => {
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('articles'); // 'articles' or 'attributes'

  useEffect(() => {
    if (!isActive) {
      setSelectedSummary(null);
      setComparisonMode('articles');
    }
  }, [isActive]);

  const getScoreColor = (score, mode) => {
    // Ensure score is a number and between 0-5
    const normalizedScore = parseFloat(score) || 0;
    const opacity = 0.1 + ((normalizedScore / 5) * 0.5); // Adjusted opacity range
    
    // Blue for article relevance, Red for cross-attribute comparison
    return mode === 'articles' 
      ? `rgba(59, 130, 246, ${opacity})` // Blue for articles
      : `rgba(220, 38, 38, ${opacity})`; // Red for cross-attribute
  };

  const handleSummaryClick = (summary) => {
    // Check if clicking the same summary
    if (selectedSummary?.id === summary.id) {
      setSelectedSummary(null);
      setComparisonMode('articles');
      // Clear cross-attribute comparison
      if (onCrossAttributeCompare) {
        onCrossAttributeCompare(null, null, false);
      }
    } else {
      setSelectedSummary(summary);
      setComparisonMode('articles');
      // Clear cross-attribute comparison
      if (onCrossAttributeCompare) {
        onCrossAttributeCompare(null, null, false);
      }
    }
  };

  const toggleComparisonMode = (summary) => {
    if (selectedSummary?.id === summary.id) {
      // Toggle between article comparison and cross-attribute comparison
      const newMode = comparisonMode === 'articles' ? 'attributes' : 'articles';
      setComparisonMode(newMode);
      
      // Notify parent component about cross-attribute comparison
      if (onCrossAttributeCompare) {
        if (newMode === 'attributes') {
          onCrossAttributeCompare(type, summary, true);
        } else {
          onCrossAttributeCompare(null, null, false);
        }
      }
    } else {
      // Select this summary and set mode to attributes
      setSelectedSummary(summary);
      setComparisonMode('attributes');
      
      // Notify parent component
      if (onCrossAttributeCompare) {
        onCrossAttributeCompare(type, summary, true);
      }
    }
  };

  const getSortedArticles = () => {
    if (!selectedSummary || !content.articles) {
      return content.articles;
    }

    return [...content.articles].sort((a, b) => {
      // Get scores with fallback to 0
      const scoreA = selectedSummary.articleScores?.[a.id] || 0;
      const scoreB = selectedSummary.articleScores?.[b.id] || 0;
      // Sort in descending order (highest score first)
      return scoreB - scoreA;
    });
  };

  const sortedArticles = getSortedArticles();

  // Check if this slide is involved in cross-attribute comparison
  const isInCrossComparison = activeCrossComparison && 
                            activeCrossComparison.isActive && 
                            activeCrossComparison.sourceType !== type;

  if (!isActive && !isFullscreen) return null;

  return (
    <>
      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={onToggleFullscreen} />
      )}
      <div 
        className={`data-slide ${isActive ? 'active' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      >
        <div className="slide-header">
          <h2 className="slide-title">{type}</h2>
          <button 
            className="fullscreen-toggle"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
        
        <div className="slide-content">
          {isInCrossComparison && (
            <div className="cross-comparison-banner">
              <span>Showing relevance to {activeCrossComparison.sourceType} summary</span>
            </div>
          )}
          
          <section className="summary-section">
            <h3 className="section-title">Summary</h3>
            <div className="summary-list">
              {content.summary?.map((item) => {
                // Calculate background color for cross-attribute comparison
                let backgroundColor = 'white';
                if (isInCrossComparison && activeCrossComparison && activeCrossComparison.summary.crossAttributeScores) {
                  // Check for cross-attribute score in the active comparison summary
                  const crossScore = activeCrossComparison.summary.crossAttributeScores?.[type]?.[item.id] || 0;
                  backgroundColor = getScoreColor(crossScore, 'attributes');
                }
                
                return (
                <div 
                  key={item.id} 
                  className={`summary-item ${selectedSummary?.id === item.id ? 'selected' : ''}`}
                  onClick={() => handleSummaryClick(item)}
                  style={{ backgroundColor }}
                >
                  <p className="summary-text">{item.text}</p>
                  <div className="summary-metadata">
                    {item.confidence && (
                      <span className="metadata-item confidence">
                        Confidence: {(item.confidence * 100).toFixed(1)}%
                      </span>
                    )}
                    {item.source_count && (
                      <span className="metadata-item source-count">
                        Sources: {item.source_count}
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons for selected summary */}
                  {selectedSummary?.id === item.id && (
                    <div className="summary-actions">
                      <button 
                        className={`action-btn ${comparisonMode === 'articles' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setComparisonMode('articles');
                          if (onCrossAttributeCompare) {
                            onCrossAttributeCompare(null, null, false);
                          }
                        }}
                        title="Show article relevance (blue)"
                      >
                        <FileText size={16} />
                        <span>Article Relevance</span>
                      </button>
                      
                      <button 
                        className={`action-btn cross-comparison ${comparisonMode === 'attributes' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComparisonMode(item);
                        }}
                        title="Show cross-attribute relevance (red)"
                        disabled={!otherSlidesData || otherSlidesData.length === 0}
                      >
                        <Shuffle size={16} />
                        <span>Cross-Aspect Comparison</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Display relevance score for cross-comparison */}
                  {isInCrossComparison && activeCrossComparison && activeCrossComparison.summary.crossAttributeScores && (
                    <div className="cross-relevance-score">
                      Relevance: {(activeCrossComparison.summary.crossAttributeScores?.[type]?.[item.id] || 0).toFixed(1)}/5
                    </div>
                  )}
                </div>
              )})}
            </div>
          </section>

          <section className="articles-section">
            <h3 className="section-title">Articles</h3>
            <div className="articles-list">
              {sortedArticles?.map((article) => {
                // Only show coloring when in articles mode and a summary is selected
                let backgroundColor = 'white';
                if (comparisonMode === 'articles' && selectedSummary) {
                  const groundednessScore = selectedSummary?.articleScores?.[article.id] || 0;
                  backgroundColor = getScoreColor(groundednessScore, 'articles');
                }
                
                return (
                  <div 
                    key={article.id} 
                    className="article-item"
                    style={{ backgroundColor }}
                  >
                    {/* Show score if there's a selected summary in articles mode */}
                    {selectedSummary && comparisonMode === 'articles' && (
                      <div className="groundedness-score">
                        Relevance: {(selectedSummary.articleScores?.[article.id] || 0).toFixed(1)}/5
                      </div>
                    )}
                    <div className="article-header">
                      <h4 className="article-title">{article.title}</h4>
                    </div>
                    <ArticleContent content={article.content} />
                    {article.url && (
                      <a 
                        href={article.url} 
                        className="article-link" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Read more
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default DataSlide;