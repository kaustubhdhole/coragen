import React from 'react';
import './ArticlesSection.css';

const ArticlesSection = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="articles-section empty">No articles available</div>;
  }

  return (
    <div className="articles-section">
      <h3 className="section-title">Articles</h3>
      <div className="articles-list">
        {data.map((article, index) => (
          <div key={index} className="article-item">
            <h4 className="article-title">{article.title}</h4>
            <p className="article-content">{article.content}</p>
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
        ))}
      </div>
    </div>
  );
};

export default ArticlesSection;