// import React, { useState } from 'react';
// import Navbar from './components/Navbar';
// import SearchBox from './components/SearchBox/SearchBox';
// import DisplaySection from './components/DisplaySection';
// import './styles/App.css';
// import './styles/responsive.css';

// function App() {
//   const [searchText, setSearchText] = useState('');
//   const [searchResults, setSearchResults] = useState(null);

//   const handleSearchResults = (results) => {
//     setSearchResults(results);
//   };

//   return (
//     <div className="App">
//       <Navbar />
//       <main className="main-content">
//         <SearchBox 
//           searchText={searchText} 
//           setSearchText={setSearchText}
//           onSearchResults={handleSearchResults}
//         />
//         <div className="pros-cons-container">
//           <DisplaySection displayData={searchResults?.genre || []} />
//         </div>
//       </main>
//     </div>
//   );
// }


import React, { useState } from 'react';
import { SettingsProvider } from './components/Contexts/SettingContext';
import Navbar from './components/Navbar';
import SearchBox from './components/SearchBox';
import ComparisionParameter from './components/ComparisonPrameters';
import DataDisplay from './components/DataDisplay';
import SettingsSidebar from './components/SettingsSidebar';
import './styles/App.css';

const App = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <SettingsProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <SearchBox 
            searchText={searchText}
            setSearchText={setSearchText}
          />
          <ComparisionParameter />
          <DataDisplay />
        </main>
        <SettingsSidebar />
      </div>
    </SettingsProvider>
  );
};

export default App;
