import React from 'react';
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

function Navbar() {
  return (
    <BSNavbar bg="white" expand="lg" className="border-bottom shadow-sm" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
      <Container fluid>
        <LinkContainer to="/dashboard">
          <BSNavbar.Brand className="d-flex align-items-center">
            <div className="bg-gradient rounded-circle d-flex align-items-center justify-content-center me-2" 
                 style={{ 
                   width: '36px', 
                   height: '36px', 
                   background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                   boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                 }}>
              <i className="bi bi-check-lg text-white fw-bold"></i>
            </div>
            <span className="fw-bold" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              testportal
            </span>
          </BSNavbar.Brand>
        </LinkContainer>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <LinkContainer to="/dashboard">
              <Nav.Link>My tests</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/respondents">
              <Nav.Link>Respondents</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/results-database">
              <Nav.Link>Results database</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/my-account">
              <Nav.Link>My account</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/help">
              <Nav.Link>Help</Nav.Link>
            </LinkContainer>
            <Nav.Link href="#" className="text-danger">Sign out</Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;