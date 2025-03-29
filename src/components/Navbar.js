import React from 'react';
import { useSettings } from './Contexts/SettingContext';
import { Settings } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
  const { settings, setSettings } = useSettings();

  const toggleSettings = () => {
    setSettings(prev => ({
      ...prev, 
      isSettingsOpen: !prev.isSettingsOpen
    }));
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-highlight">CoRAGen</span>
        </div>

        <div className="navbar-links">
          <button 
            className="settings-button"
            onClick={toggleSettings}
            aria-label="Toggle settings panel"
          >
            <Settings 
              size={24} 
              className={`settings-icon ${settings.isSettingsOpen ? 'active' : ''}`}
            />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;