import React, { useState } from 'react';
import { Modal, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { calendarApi } from '../../services/api';

const ShareModal = ({ show, onHide }) => {
  const [roleName, setRoleName] = useState('10');
  const [expirationDays, setExpirationDays] = useState(7);
  const [noExpiration, setNoExpiration] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const roleOptions = [
    { value: '10', label: 'User - Can view and sign up for shifts' },
    { value: '50', label: 'Manager - Can edit events and manage shares' },
    { value: '100', label: 'Owner - Full access including delete' }
  ];

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setError('');
    setShareUrl('');
    setLoading(true);

    try {
      const response = await calendarApi.shareCalendar(roleName, expirationDays, noExpiration);
      setShareUrl(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setError('');
    setCopied(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Share Calendar</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleGenerateLink}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="shareRole">
            <Form.Label>Permission Level</Form.Label>
            <Form.Select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="shareExpiration">
            <Form.Label>Link Expiration</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={expirationDays}
              onChange={(e) => setExpirationDays(parseInt(e.target.value))}
              disabled={noExpiration}
            />
            <Form.Text className="text-muted">Days until link expires</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="shareNoExpiration">
            <Form.Check
              type="checkbox"
              label="Link never expires"
              checked={noExpiration}
              onChange={(e) => setNoExpiration(e.target.checked)}
            />
          </Form.Group>

          {shareUrl && (
            <Form.Group className="mb-3" controlId="shareUrl">
              <Form.Label>Share Link</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  value={shareUrl}
                  readOnly
                />
                <Button 
                  variant={copied ? 'success' : 'outline-secondary'}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Share this link with others to give them access to your calendar
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Link'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ShareModal;