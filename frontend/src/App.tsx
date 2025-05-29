import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import './index.css';

/**
 * Main application component with React Router setup
 * Provides routing structure for the GMATHS platform
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Additional routes will be added in subsequent steps */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
