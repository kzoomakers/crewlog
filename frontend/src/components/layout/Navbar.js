import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import NewCalendarModal from '../modals/NewCalendarModal';
import ShareModal from '../modals/ShareModal';

const Navbar = () => {
  const { user, currentCalendar, calendars, logout, switchCalendar } = useAuth();
  const navigate = useNavigate();
  const [showNewCalendarModal, setShowNewCalendarModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCalendarSwitch = async (calendarId) => {
    try {
      await switchCalendar(calendarId);
      window.location.reload(); // Refresh to load new calendar data
    } catch (error) {
      console.error('Failed to switch calendar:', error);
    }
  };

  const getCurrentRole = () => {
    if (!currentCalendar || !calendars) return null;
    const role = calendars.find(c => c.calendar_id === currentCalendar.id);
    return role;
  };

  const currentRole = getCurrentRole();
  const isManager = currentRole && currentRole.type >= 50;
  const isOwner = currentRole && currentRole.type >= 100;

  return (
    <>
      <BsNavbar bg="dark" variant="dark" expand="md" className="py-1">
        <Container fluid>
          <BsNavbar.Brand as={Link} to="/">CrewLog</BsNavbar.Brand>
          <BsNavbar.Toggle aria-controls="navbar-nav" />
          <BsNavbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <NavDropdown 
                title={`📅 Calendar: ${currentCalendar?.name || 'None'}`} 
                id="calendar-dropdown"
              >
                {calendars.map((cal) => (
                  <NavDropdown.Item
                    key={cal.calendar_id}
                    active={currentCalendar?.id === cal.calendar_id}
                    onClick={() => handleCalendarSwitch(cal.calendar_id)}
                  >
                    {cal.calendar_name}
                  </NavDropdown.Item>
                ))}
                <NavDropdown.Divider />
                {isOwner && (
                  <NavDropdown.Item as={Link} to="/shares">
                    Shares
                  </NavDropdown.Item>
                )}
                {isManager && (
                  <NavDropdown.Item as={Link} to="/report">
                    Report
                  </NavDropdown.Item>
                )}
                <NavDropdown.Item onClick={() => setShowNewCalendarModal(true)}>
                  Create new...
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>

            <Nav>
              {isManager && (
                <Button 
                  variant="secondary" 
                  className="me-2"
                  onClick={() => setShowShareModal(true)}
                >
                  🔗 Share
                </Button>
              )}
              
              <NavDropdown 
                title={`👤 ${user?.username}`} 
                id="user-dropdown"
                align="end"
              >
                {user?.is_admin && (
                  <>
                    <NavDropdown.Item as={Link} to="/admin">
                      🛠️ Admin
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                  </>
                )}
                {isOwner && (
                  <NavDropdown.Item as={Link} to="/settings">
                    Settings
                  </NavDropdown.Item>
                )}
                <NavDropdown.Item as={Link} to="/profile">
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </BsNavbar.Collapse>
        </Container>
      </BsNavbar>

      <NewCalendarModal 
        show={showNewCalendarModal} 
        onHide={() => setShowNewCalendarModal(false)} 
      />
      
      <ShareModal 
        show={showShareModal} 
        onHide={() => setShowShareModal(false)} 
      />
    </>
  );
};

export default Navbar;