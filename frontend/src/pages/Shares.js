import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import api, { calendarApi } from '../services/api';

const Shares = () => {
  const { currentCalendar } = useAuth();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchShares();
  }, [currentCalendar]);

  const fetchShares = async () => {
    if (!currentCalendar) return;
    
    setLoading(true);
    try {
      const response = await api.get('/api/v1/calendars/shares');
      setShares(response.data || []);
    } catch (err) {
      setError('Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccess('');
    
    try {
      await calendarApi.changeShare(userId, newRole);
      setSuccess('Role updated successfully');
      fetchShares();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const getRoleName = (roleType) => {
    switch (roleType) {
      case 100: return 'Owner';
      case 50: return 'Manager';
      case 10: return 'User';
      default: return 'Unknown';
    }
  };

  const getRoleBadgeVariant = (roleType) => {
    switch (roleType) {
      case 100: return 'danger';
      case 50: return 'warning';
      case 10: return 'info';
      default: return 'secondary';
    }
  };

  const roleOptions = [
    { value: 10, label: 'User' },
    { value: 50, label: 'Manager' },
    { value: 100, label: 'Owner' }
  ];

  return (
    <Container className="py-4">
      <h2 className="mb-4">Calendar Shares</h2>
      <p className="text-muted mb-4">
        Manage who has access to "{currentCalendar?.name}"
      </p>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Shared With</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : shares.length === 0 ? (
            <p className="text-muted text-center py-4">
              This calendar hasn't been shared with anyone yet.
              Use the Share button in the navigation to generate a share link.
            </p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((share) => (
                  <tr key={share.user_id}>
                    <td>
                      {share.first_name} {share.last_name}
                    </td>
                    <td>{share.username}</td>
                    <td>
                      <Badge bg={getRoleBadgeVariant(share.role_type)}>
                        {getRoleName(share.role_type)}
                      </Badge>
                    </td>
                    <td>
                      {share.role_type !== 100 ? (
                        <Form.Select
                          size="sm"
                          value={share.role_type}
                          onChange={(e) => handleRoleChange(share.user_id, e.target.value)}
                          style={{ width: 'auto' }}
                        >
                          {roleOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        <span className="text-muted">Cannot change owner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Role Permissions</h5>
        </Card.Header>
        <Card.Body>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>Permission</th>
                <th className="text-center">User</th>
                <th className="text-center">Manager</th>
                <th className="text-center">Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>View calendar</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>Sign up for shifts</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>Create/edit events</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>Generate share links</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>View reports</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-success">✓</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>Manage shares</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>Calendar settings</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-success">✓</td>
              </tr>
              <tr>
                <td>Delete calendar</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-danger">✗</td>
                <td className="text-center text-success">✓</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Shares;