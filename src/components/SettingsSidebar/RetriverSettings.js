import React from 'react';
import BrowserSelector from './BrowserSelector';
import Reranker from './Reranker';
import QueryReformulation from './QueryReformulation';
import './RetrieverSettings.css';

const RetrieverSettings = () => {
  return (
    <div className="retriever-settings">
      <div className="retriever-header">
        <h2 className="section-title">Retriever Settings</h2>
        <p className="section-subtitle">Configure search and retrieval parameters</p>
      </div>

      <div className="retriever-sections">
        <div className="subsection">
          <h3 className="subsection-title">Search Engine</h3>
          <BrowserSelector />
        </div>

        <div className="section-divider" />

        <div className="subsection">
          <h3 className="subsection-title">Reranker</h3>
          <Reranker />
        </div>

        <div className="section-divider" />

        <div className="subsection">
          <h3 className="subsection-title">Query Reformulation</h3>
          <QueryReformulation />
        </div>
      </div>
    </div>
  );
};

export default RetrieverSettings;