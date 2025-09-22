import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard' || path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-white border-end d-flex flex-column shadow-sm ${isCollapsed ? 'collapsed' : ''}`} 
         style={{ 
           width: isCollapsed ? '60px' : '240px', 
           minHeight: '100vh', 
           transition: 'width 0.3s',
           position: 'sticky',
           top: 0
         }}>
      
      {/* Brand/Logo Section */}
      <div className="p-3 border-bottom">
        <LinkContainer to="/dashboard">
          <div className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-2" 
                 style={{ width: '32px', height: '32px', minWidth: '32px' }}>
              <i className="bi bi-check text-white"></i>
            </div>
            {!isCollapsed && (
              <span className="fw-bold text-dark h5 mb-0">testportal</span>
            )}
          </div>
        </LinkContainer>
      </div>

      {/* Hide/Show button */}
      <div className="p-3 border-bottom">
        <button 
          className="btn btn-link text-muted p-0 border-0 bg-transparent d-flex align-items-center"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} me-1`}></i>
          {!isCollapsed && <span className="small">Hide</span>}
        </button>
      </div>

      {/* Navigation */}
      <Nav className="flex-column flex-grow-1">
        <LinkContainer to="/dashboard">
          <Nav.Link className={`d-flex align-items-center px-3 py-3 text-decoration-none ${
            isActive('/dashboard') 
              ? 'active bg-light text-success border-end border-3 border-success fw-medium' 
              : 'text-dark'
          }`}>
            <i className={`bi bi-grid-3x3-gap ${isActive('/dashboard') ? 'text-success' : 'text-muted'}`}></i>
            {!isCollapsed && <span className="ms-3">My tests</span>}
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/respondents">
          <Nav.Link className={`d-flex align-items-center px-3 py-3 text-decoration-none ${
            isActive('/respondents') 
              ? 'active bg-light text-success border-end border-3 border-success fw-medium' 
              : 'text-dark'
          }`}>
            <i className={`bi bi-people ${isActive('/respondents') ? 'text-success' : 'text-muted'}`}></i>
            {!isCollapsed && <span className="ms-3">Respondents</span>}
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/results-database">
          <Nav.Link className={`d-flex align-items-center px-3 py-3 text-decoration-none ${
            isActive('/results-database') 
              ? 'active bg-light text-success border-end border-3 border-success fw-medium' 
              : 'text-dark'
          }`}>
            <i className={`bi bi-database ${isActive('/results-database') ? 'text-success' : 'text-muted'}`}></i>
            {!isCollapsed && <span className="ms-3">Results database</span>}
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/shared-results">
          <Nav.Link className={`d-flex align-items-center px-3 py-3 text-decoration-none ${
            isActive('/shared-results') 
              ? 'active bg-light text-success border-end border-3 border-success fw-medium' 
              : 'text-dark'
          }`}>
            <i className={`bi bi-share ${isActive('/shared-results') ? 'text-success' : 'text-muted'}`}></i>
            {!isCollapsed && <span className="ms-3">Shared Link Results</span>}
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/my-account">
          <Nav.Link className={`d-flex align-items-center px-3 py-3 text-decoration-none ${
            isActive('/my-account') 
              ? 'active bg-light text-success border-end border-3 border-success fw-medium' 
              : 'text-dark'
          }`}>
            <i className={`bi bi-gear ${isActive('/my-account') ? 'text-success' : 'text-muted'}`}></i>
            {!isCollapsed && <span className="ms-3">My account</span>}
          </Nav.Link>
        </LinkContainer>
        
        <LinkContainer to="/help">
          <Nav.Link className={`d-flex align-items-center px-3 py-3 text-decoration-none ${
            isActive('/help') 
              ? 'active bg-light text-success border-end border-3 border-success fw-medium' 
              : 'text-dark'
          }`}>
            <i className={`bi bi-question-circle ${isActive('/help') ? 'text-success' : 'text-muted'}`}></i>
            {!isCollapsed && <span className="ms-3">Help</span>}
          </Nav.Link>
        </LinkContainer>
        
        {/* Sign out at bottom */}
        <div className="mt-auto border-top pt-3">
          <Nav.Link href="#" className="d-flex align-items-center px-3 py-2 text-decoration-none text-danger">
            <i className="bi bi-box-arrow-right text-danger"></i>
            {!isCollapsed && <span className="ms-3">Sign out</span>}
          </Nav.Link>
        </div>
      </Nav>
    </div>
  );
}

export default Sidebar;