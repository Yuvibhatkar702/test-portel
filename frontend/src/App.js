import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateTest from './pages/CreateTest';
import ImportTest from './pages/ImportTest';
import TakeTest from './pages/TakeTest';
import TakeExamByLink from './components/TakeExamByLink';
import TestResults from './pages/TestResults';
import Respondents from './pages/Respondents';
import ResultsDatabase from './pages/ResultsDatabase';
import SharedLinkResultsDashboard from './pages/SharedLinkResultsDashboard';
import MyAccount from './pages/MyAccount';
import Help from './pages/Help';

function App() {
  return (
    <Router>
      <Routes>
        {/* Shared Exam Route - No Sidebar */}
        <Route path="/take-exam/:shareableLink" element={<TakeExamByLink />} />
        
        {/* Admin Routes - With Sidebar */}
        <Route path="/*" element={
          <div className="App" style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="main-content" style={{ 
              flex: 1, 
              minHeight: '100vh', 
              overflow: 'auto',
              backgroundColor: '#f8f9fa'
            }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-test" element={<CreateTest />} />
                <Route path="/import-test" element={<ImportTest />} />
                <Route path="/test/:id" element={<TakeTest />} />
                <Route path="/results" element={<TestResults />} />
                <Route path="/results/:testId" element={<TestResults />} />
                <Route path="/test-result" element={<TestResults />} />
                <Route path="/respondents" element={<Respondents />} />
                <Route path="/results-database" element={<ResultsDatabase />} />
                <Route path="/shared-results" element={<SharedLinkResultsDashboard />} />
                <Route path="/my-account" element={<MyAccount />} />
                <Route path="/help" element={<Help />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;