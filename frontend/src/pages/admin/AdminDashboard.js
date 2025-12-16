import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getUsers();
      const users = response.data;
      setStats({
        totalUsers: users.length,
        verifiedUsers: users.filter(u => u.is_verified).length,
        adminUsers: users.filter(u => u.is_admin).length
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Admin Dashboard</h2>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              {loading ? (
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <>
                  <h2>{stats.totalUsers}</h2>
                  <p className="text-muted mb-0">Total Users</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              {loading ? (
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <>
                  <h2 className="text-success">{stats.verifiedUsers}</h2>
                  <p className="text-muted mb-0">Verified Users</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              {loading ? (
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <>
                  <h2 className="text-warning">{stats.adminUsers}</h2>
                  <p className="text-muted mb-0">Admin Users</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/admin/users">
                👥 Manage Users
              </ListGroup.Item>
              <ListGroup.Item action as={Link} to="/admin/email">
                📧 Email Settings
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">System Information</h5>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Application</td>
                    <td>CrewLog</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Version</td>
                    <td>1.0.0</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Environment</td>
                    <td>{process.env.NODE_ENV}</td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;