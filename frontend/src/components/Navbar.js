import React from 'react';
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

function Navbar() {
  return (
    <BSNavbar bg="white" expand="lg" className="border-bottom">
      <Container fluid>
        <LinkContainer to="/dashboard">
          <BSNavbar.Brand className="d-flex align-items-center">
            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center me-2" 
                 style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-check text-white"></i>
            </div>
            testportal
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