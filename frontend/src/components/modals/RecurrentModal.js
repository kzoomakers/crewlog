import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { eventApi } from '../../services/api';

const RecurrentModal = ({ show, onHide, event, onSave }) => {
  const [recurrentChange, setRecurrentChange] = useState('this');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        recurrentChange: recurrentChange,
        recurId: event?.recurId || '',
        eventId: event?.id || '',
        start: event?.start?.toISOString() || '',
        end: event?.end?.toISOString() || '',
        initStart: event?.initStart?.toISOString() || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        eventTitle: event?.title || '',
        description: event?.description || '',
        allDay: event?.allDay || false
      };

      await eventApi.updateRecurrentEvent(data);
      onSave();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Recurring Event</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <p>This is a recurring event. How would you like to apply your changes?</p>

          <Form.Group className="mb-3">
            <Form.Check
              type="radio"
              id="change-this"
              name="recurrentChange"
              label="This event only"
              value="this"
              checked={recurrentChange === 'this'}
              onChange={(e) => setRecurrentChange(e.target.value)}
            />
            <Form.Text className="text-muted ms-4">
              Only this occurrence will be modified
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="radio"
              id="change-following"
              name="recurrentChange"
              label="This and following events"
              value="following"
              checked={recurrentChange === 'following'}
              onChange={(e) => setRecurrentChange(e.target.value)}
            />
            <Form.Text className="text-muted ms-4">
              This and all future occurrences will be modified
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Apply'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RecurrentModal;