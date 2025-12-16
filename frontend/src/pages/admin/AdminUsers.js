import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Alert, Badge, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      await adminApi.toggleAdmin(userId);
      setSuccess('Admin status updated');
      fetchUsers();
    } catch (err) {
      setError('Failed to update admin status');
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await adminApi.verifyUser(userId);
      setSuccess('User verified successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to verify user');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await adminApi.deleteUser(userId);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setEditUser({ ...user });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      await adminApi.updateUser(editUser.id, {
        email: editUser.username,
        firstName: editUser.first_name,
        lastName: editUser.last_name,
        isAdmin: editUser.is_admin,
        isVerified: editUser.is_verified
      });
      setSuccess('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const openResetModal = (user) => {
    setResetUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    
    try {
      await adminApi.resetPassword(resetUser.id, newPassword);
      setSuccess('Password reset successfully');
      setShowResetModal(false);
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <Link to="/admin" className="btn btn-outline-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>
                      {user.is_admin && <Badge bg="warning" className="me-1">Admin</Badge>}
                      {user.is_verified ? (
                        <Badge bg="success">Verified</Badge>
                      ) : (
                        <Badge bg="secondary">Unverified</Badge>
                      )}
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                        onClick={() => openResetModal(user)}
                      >
                        Reset Password
                      </Button>
                      {!user.is_verified && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          onClick={() => handleVerifyUser(user.id)}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
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

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="editEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={editUser?.username || ''}
                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editFirstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={editUser?.first_name || ''}
                onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editLastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={editUser?.last_name || ''}
                onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editIsAdmin">
              <Form.Check
                type="checkbox"
                label="Admin privileges"
                checked={editUser?.is_admin || false}
                onChange={(e) => setEditUser({ ...editUser, is_admin: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editIsVerified">
              <Form.Check
                type="checkbox"
                label="Email verified"
                checked={editUser?.is_verified || false}
                onChange={(e) => setEditUser({ ...editUser, is_verified: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResetPassword}>
          <Modal.Body>
            <p>Reset password for: <strong>{resetUser?.username}</strong></p>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <Form.Text className="text-muted">
                Minimum 6 characters
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={resetLoading}>
              {resetLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminUsers;