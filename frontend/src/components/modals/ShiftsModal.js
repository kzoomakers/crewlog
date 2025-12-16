import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { eventApi } from '../../services/api';

const ShiftsModal = ({ show, onHide, event, onSave }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [newName, setNewName] = useState('');
  const [removedShifts, setRemovedShifts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (show && event) {
      fetchEventDetails();
    }
  }, [show, event]);

  const fetchEventDetails = async () => {
    if (!event?.id) {
      setVolunteers([]);
      return;
    }

    setFetchLoading(true);
    try {
      const response = await eventApi.getEventDetails(event.id);
      setVolunteers(response.data.volunteers || []);
      setRemovedShifts([]);
    } catch (err) {
      setError('Failed to load event details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleToggleShift = (shiftId) => {
    if (removedShifts.includes(shiftId)) {
      setRemovedShifts(removedShifts.filter(id => id !== shiftId));
    } else {
      setRemovedShifts([...removedShifts, shiftId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        eventId: event?.id || '',
        recurId: event?.recurId || '',
        start: event?.start?.toISOString() || '',
        end: event?.end?.toISOString() || '',
        newNameText: newName
      };

      // Add removed shifts to data
      removedShifts.forEach(shiftId => {
        data[`shiftIdCheckBox${shiftId}`] = 'false';
      });

      await eventApi.saveShift(data);
      onSave();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save shifts');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {event?.title || 'Event'}
          <small className="d-block text-muted" style={{ fontSize: '0.8rem' }}>
            {formatDateTime(event?.start)} - {formatDateTime(event?.end)}
          </small>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {fetchLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {event?.description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mb-0">{event.description}</p>
                </div>
              )}

              <div className="mb-3">
                <strong>Volunteers:</strong>
                {volunteers.length > 0 ? (
                  <ListGroup className="mt-2">
                    {volunteers.map((volunteer, index) => (
                      <ListGroup.Item 
                        key={index}
                        className="d-flex justify-content-between align-items-center"
                        action
                        onClick={() => volunteer.id && handleToggleShift(volunteer.id)}
                        style={{ 
                          textDecoration: removedShifts.includes(volunteer.id) ? 'line-through' : 'none',
                          opacity: removedShifts.includes(volunteer.id) ? 0.5 : 1
                        }}
                      >
                        {volunteer.person || volunteer}
                        {removedShifts.includes(volunteer.id) && (
                          <Badge bg="danger">Remove</Badge>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-muted mt-2">No volunteers assigned yet</p>
                )}
              </div>

              <Form.Group className="mb-3" controlId="newVolunteer">
                <Form.Label>Add Volunteer</Form.Label>
                <Form.Control
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter volunteer name"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading || fetchLoading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ShiftsModal;