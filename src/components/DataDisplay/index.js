import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '../Contexts/SettingContext';
import DataSlide from './DataSlide';
import './DataDisplay.css';

const DataDisplay = () => {
  const { settings } = useSettings();
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreenSlide, setFullscreenSlide] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeCrossComparison, setActiveCrossComparison] = useState(null);

  useEffect(() => {
    setCurrentPage(0);
  }, [settings.searchResults]);

  useEffect(() => {
    document.body.style.overflow = fullscreenSlide !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreenSlide]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && fullscreenSlide !== null) {
        setFullscreenSlide(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [fullscreenSlide]);

  // Function to handle cross-attribute comparison
  const handleCrossAttributeCompare = (sourceType, summary, isActive) => {
    // If it's already active and we're clicking the same summary again, toggle it off
    if (activeCrossComparison && 
        activeCrossComparison.sourceType === sourceType && 
        activeCrossComparison.summary.id === summary?.id && 
        !isActive) {
      setActiveCrossComparison(null);
      return;
    }
    
    // If there's no source type or summary, or isActive is false, clear the comparison
    if (!sourceType || !summary || !isActive) {
      setActiveCrossComparison(null);
      return;
    }

    // Otherwise, set the new active comparison
    setActiveCrossComparison({
      sourceType,
      summary,
      isActive: true
    });
  };

  if (!settings.searchResults) {
    return (
      <div className="data-display-empty">
        <p>No search results available</p>
      </div>
    );
  }

  const allSlides = Object.entries(settings.searchResults).map(([category, data]) => ({
    category,
    content: {
      summary: data.summary || [],
      articles: data.articles || []
    }
  }));

  // Handle single slide case
  if (allSlides.length === 1) {
    return (
      <div className="data-display single-slide">
        <div className="carousel">
          <div className="slide-container">
            <DataSlide
              key={allSlides[0].category}
              type={allSlides[0].category}
              content={allSlides[0].content}
              isActive={true}
              isFullscreen={fullscreenSlide === allSlides[0].category}
              onToggleFullscreen={() => setFullscreenSlide(
                fullscreenSlide === allSlides[0].category ? null : allSlides[0].category
              )}
              onCrossAttributeCompare={handleCrossAttributeCompare}
              otherSlidesData={[]}
              activeCrossComparison={activeCrossComparison}
            />
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(allSlides.length / 2);
  const currentSlides = allSlides.slice(currentPage * 2, (currentPage * 2) + 2);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage(newPage);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  return (
    <div className="data-display">
      <div className={`carousel ${fullscreenSlide ? 'fullscreen' : ''}`}>
        {totalPages > 1 && (
          <div className="carousel-controls">
            <button 
              className="carousel-button prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0 || isTransitioning}
              aria-label="Previous page"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="carousel-dots">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`carousel-dot ${currentPage === i ? 'active' : ''}`}
                  onClick={() => handlePageChange(i)}
                  disabled={isTransitioning}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            <button 
              className="carousel-button next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || isTransitioning}
              aria-label="Next page"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        <div className="carousel-track">
          <div className="slide-container">
            {currentSlides.map((slide) => (
              <DataSlide
                key={slide.category}
                type={slide.category}
                content={slide.content}
                isActive={true}
                isFullscreen={fullscreenSlide === slide.category}
                onToggleFullscreen={() => setFullscreenSlide(
                  fullscreenSlide === slide.category ? null : slide.category
                )}
                onCrossAttributeCompare={handleCrossAttributeCompare}
                otherSlidesData={allSlides.filter(s => s.category !== slide.category)}
                activeCrossComparison={activeCrossComparison}
                isInvolved={activeCrossComparison && activeCrossComparison.sourceType !== slide.category}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;