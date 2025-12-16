import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { eventApi } from '../../services/api';

const EventModal = ({ show, onHide, event, dateRange, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [recurrent, setRecurrent] = useState('');
  const [recurrentInterval, setRecurrentInterval] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isEdit = !!event?.id || !!event?.recurId;

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setStart(formatDateTimeLocal(event.start));
      setEnd(formatDateTimeLocal(event.end || event.start));
      setAllDay(event.allDay || false);
    } else if (dateRange) {
      setTitle('');
      setDescription('');
      setStart(formatDateTimeLocal(dateRange.start));
      setEnd(formatDateTimeLocal(dateRange.end));
      setAllDay(dateRange.allDay || false);
      setRecurrent('');
      setRecurrentInterval(1);
    }
  }, [event, dateRange]);

  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        eventTitle: title,
        description: description,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay: allDay,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        eventId: event?.id || '',
        recurId: event?.recurId || '',
        recurrent: recurrent,
        recurrentInterval: recurrentInterval
      };

      if (event?.initStart) {
        data.initStart = event.initStart.toISOString();
      }

      await eventApi.createEvent(data);
      onSave();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    setDeleteLoading(true);
    try {
      const data = {
        eventId: event?.id || '',
        recurId: event?.recurId || '',
        start: event?.start?.toISOString() || ''
      };
      await eventApi.deleteEvent(data);
      onSave();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const recurrenceOptions = [
    { value: '', label: 'Does not repeat' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Event' : 'New Event'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="eventTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="eventDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description (optional)"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="eventStart">
                <Form.Label>Start</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="eventEnd">
                <Form.Label>End</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="eventAllDay">
            <Form.Check
              type="checkbox"
              label="All day event"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
          </Form.Group>

          {!isEdit && (
            <>
              <Form.Group className="mb-3" controlId="eventRecurrent">
                <Form.Label>Repeat</Form.Label>
                <Form.Select
                  value={recurrent}
                  onChange={(e) => setRecurrent(e.target.value)}
                >
                  {recurrenceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {recurrent && (
                <Form.Group className="mb-3" controlId="eventInterval">
                  <Form.Label>Repeat every</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={recurrentInterval}
                    onChange={(e) => setRecurrentInterval(parseInt(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    {recurrent === 'DAILY' && 'day(s)'}
                    {recurrent === 'WEEKLY' && 'week(s)'}
                    {recurrent === 'MONTHLY' && 'month(s)'}
                    {recurrent === 'YEARLY' && 'year(s)'}
                  </Form.Text>
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEdit && (
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={deleteLoading}
              className="me-auto"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EventModal;