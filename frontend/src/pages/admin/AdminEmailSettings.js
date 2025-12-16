import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Badge, Modal, Form, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

const AdminEmailSettings = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editConfig, setEditConfig] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEmailConfigs();
      setConfigs(response.data);
    } catch (err) {
      setError('Failed to load email configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (configId) => {
    try {
      await adminApi.activateEmailConfig(configId);
      setSuccess('Email configuration activated');
      fetchConfigs();
    } catch (err) {
      setError('Failed to activate configuration');
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }
    
    try {
      await adminApi.deleteEmailConfig(configId);
      setSuccess('Configuration deleted');
      fetchConfigs();
    } catch (err) {
      setError('Failed to delete configuration');
    }
  };

  const openCreateModal = () => {
    setEditConfig({
      provider: 'smtp',
      is_active: false,
      smtp_server: '',
      smtp_port: 587,
      smtp_login: '',
      smtp_password: '',
      smtp_mailbox: '',
      smtp_use_tls: true,
      sendgrid_api_key: '',
      sendgrid_from_email: '',
      sendgrid_from_name: '',
      smtp2go_api_key: '',
      smtp2go_sender: ''
    });
    setShowModal(true);
  };

  const openEditModal = (config) => {
    setEditConfig({ ...config });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    
    try {
      if (editConfig.id) {
        await adminApi.updateEmailConfig(editConfig.id, editConfig);
        setSuccess('Configuration updated');
      } else {
        await adminApi.createEmailConfig(editConfig);
        setSuccess('Configuration created');
      }
      setShowModal(false);
      fetchConfigs();
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setModalLoading(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    
    try {
      await adminApi.testEmail(testEmail);
      setSuccess(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (err) {
      setError('Failed to send test email');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      await adminApi.testConnection();
      setSuccess('Connection test successful');
    } catch (err) {
      setError('Connection test failed');
    }
  };

  const getProviderLabel = (provider) => {
    switch (provider) {
      case 'smtp': return 'SMTP';
      case 'sendgrid': return 'SendGrid';
      case 'smtp2go': return 'SMTP2GO';
      default: return provider;
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Email Settings</h2>
        <Link to="/admin" className="btn btn-outline-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Email Configurations</h5>
              <Button variant="primary" size="sm" onClick={openCreateModal}>
                Add Configuration
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : configs.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No email configurations found. Add one to enable email functionality.
                </p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Status</th>
                      <th>Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config) => (
                      <tr key={config.id}>
                        <td>{getProviderLabel(config.provider)}</td>
                        <td>
                          {config.is_active ? (
                            <Badge bg="success">Active</Badge>
                          ) : (
                            <Badge bg="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td>
                          {config.provider === 'smtp' && config.smtp_server}
                          {config.provider === 'sendgrid' && config.sendgrid_from_email}
                          {config.provider === 'smtp2go' && config.smtp2go_sender}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => openEditModal(config)}
                          >
                            Edit
                          </Button>
                          {!config.is_active && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1"
                              onClick={() => handleActivate(config.id)}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Test Email</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleTestEmail}>
                <Form.Group className="mb-3" controlId="testEmail">
                  <Form.Label>Recipient Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    required
                  />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={testLoading}>
                    {testLoading ? 'Sending...' : 'Send Test Email'}
                  </Button>
                  <Button variant="outline-secondary" onClick={handleTestConnection}>
                    Test Connection
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Configuration Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editConfig?.id ? 'Edit Configuration' : 'New Configuration'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="provider">
              <Form.Label>Provider</Form.Label>
              <Form.Select
                value={editConfig?.provider || 'smtp'}
                onChange={(e) => setEditConfig({ ...editConfig, provider: e.target.value })}
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="smtp2go">SMTP2GO</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="isActive">
              <Form.Check
                type="checkbox"
                label="Active (only one configuration can be active)"
                checked={editConfig?.is_active || false}
                onChange={(e) => setEditConfig({ ...editConfig, is_active: e.target.checked })}
              />
            </Form.Group>

            <Tabs defaultActiveKey={editConfig?.provider || 'smtp'} className="mb-3">
              <Tab eventKey="smtp" title="SMTP">
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3" controlId="smtpServer">
                      <Form.Label>SMTP Server</Form.Label>
                      <Form.Control
                        type="text"
                        value={editConfig?.smtp_server || ''}
                        onChange={(e) => setEditConfig({ ...editConfig, smtp_server: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="smtpPort">
                      <Form.Label>Port</Form.Label>
                      <Form.Control
                        type="number"
                        value={editConfig?.smtp_port || 587}
                        onChange={(e) => setEditConfig({ ...editConfig, smtp_port: parseInt(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="smtpLogin">
                      <Form.Label>Login</Form.Label>
                      <Form.Control
                        type="text"
                        value={editConfig?.smtp_login || ''}
                        onChange={(e) => setEditConfig({ ...editConfig, smtp_login: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="smtpPassword">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={editConfig?.smtp_password || ''}
                        onChange={(e) => setEditConfig({ ...editConfig, smtp_password: e.target.value })}
                        placeholder={editConfig?.id ? '(unchanged)' : ''}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3" controlId="smtpMailbox">
                  <Form.Label>From Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={editConfig?.smtp_mailbox || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp_mailbox: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="smtpUseTls">
                  <Form.Check
                    type="checkbox"
                    label="Use TLS"
                    checked={editConfig?.smtp_use_tls !== false}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp_use_tls: e.target.checked })}
                  />
                </Form.Group>
              </Tab>

              <Tab eventKey="sendgrid" title="SendGrid">
                <Form.Group className="mb-3" controlId="sendgridApiKey">
                  <Form.Label>API Key</Form.Label>
                  <Form.Control
                    type="password"
                    value={editConfig?.sendgrid_api_key || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, sendgrid_api_key: e.target.value })}
                    placeholder={editConfig?.id ? '(unchanged)' : ''}
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="sendgridFromEmail">
                      <Form.Label>From Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={editConfig?.sendgrid_from_email || ''}
                        onChange={(e) => setEditConfig({ ...editConfig, sendgrid_from_email: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="sendgridFromName">
                      <Form.Label>From Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={editConfig?.sendgrid_from_name || ''}
                        onChange={(e) => setEditConfig({ ...editConfig, sendgrid_from_name: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="smtp2go" title="SMTP2GO">
                <Form.Group className="mb-3" controlId="smtp2goApiKey">
                  <Form.Label>API Key</Form.Label>
                  <Form.Control
                    type="password"
                    value={editConfig?.smtp2go_api_key || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp2go_api_key: e.target.value })}
                    placeholder={editConfig?.id ? '(unchanged)' : ''}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="smtp2goSender">
                  <Form.Label>Sender Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={editConfig?.smtp2go_sender || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, smtp2go_sender: e.target.value })}
                  />
                </Form.Group>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminEmailSettings;