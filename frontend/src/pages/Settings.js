import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { calendarApi } from '../services/api';

const Settings = () => {
  const { currentCalendar } = useAuth();
  const [settings, setSettings] = useState({
    scrollTime: '16:00:00',
    firstDay: '1',
    slotMinTime: '09:00:00',
    slotMaxTime: '22:00:00',
    nextDayThreshold: '00:00:00'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (currentCalendar?.settings) {
      const calSettings = typeof currentCalendar.settings === 'string' 
        ? JSON.parse(currentCalendar.settings) 
        : currentCalendar.settings;
      setSettings(calSettings);
    }
  }, [currentCalendar]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await calendarApi.saveSettings(settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await calendarApi.deleteCalendar();
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete calendar');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const dayOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' }
  ];

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Calendar Settings</h4>
              <small className="text-muted">{currentCalendar?.name}</small>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="firstDay">
                  <Form.Label>First Day of Week</Form.Label>
                  <Form.Select
                    value={settings.firstDay}
                    onChange={(e) => handleChange('firstDay', e.target.value)}
                  >
                    {dayOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="scrollTime">
                  <Form.Label>Default Scroll Time</Form.Label>
                  <Form.Control
                    type="time"
                    step="1"
                    value={settings.scrollTime}
                    onChange={(e) => handleChange('scrollTime', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    The calendar will scroll to this time when opened
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="slotMinTime">
                      <Form.Label>Day Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        step="1"
                        value={settings.slotMinTime}
                        onChange={(e) => handleChange('slotMinTime', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="slotMaxTime">
                      <Form.Label>Day End Time</Form.Label>
                      <Form.Control
                        type="time"
                        step="1"
                        value={settings.slotMaxTime}
                        onChange={(e) => handleChange('slotMaxTime', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3" controlId="nextDayThreshold">
                  <Form.Label>Next Day Threshold</Form.Label>
                  <Form.Control
                    type="time"
                    step="1"
                    value={settings.nextDayThreshold}
                    onChange={(e) => handleChange('nextDayThreshold', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Events ending after midnight but before this time will appear on the previous day
                  </Form.Text>
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <Button 
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Calendar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Calendar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Warning!</strong> This action cannot be undone.
          </Alert>
          <p>
            Are you sure you want to delete the calendar "{currentCalendar?.name}"? 
            All events and shares associated with this calendar will be permanently deleted.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Calendar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Settings;