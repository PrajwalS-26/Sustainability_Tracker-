// client/src/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to load admin stats');
      }
      const payload = await res.json();
      setStats(payload.data);
    } catch (err) {
      console.error('Admin stats error:', err);
      alert('Failed to load admin stats. Make sure you are an admin and logged in.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-container"><p>Loading admin dashboard...</p></div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div>
          <button className="btn btn-primary small" onClick={() => navigate('/admin/users')}>Manage Users</button>
          {' '}
          <button className="btn btn-primary small" onClick={() => navigate('/admin/challenges')}>Manage Challenges</button>
          {' '}
          <button className="btn btn-primary small" onClick={() => navigate('/admin/rewards')}>Manage Rewards</button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="card">
          <h3>Total Users</h3>
          <p style={{fontSize: '1.6rem', fontWeight:700}}>{stats.total_users}</p>
        </div>
        <div className="card">
          <h3>Total Challenges</h3>
          <p style={{fontSize: '1.6rem', fontWeight:700}}>{stats.total_challenges}</p>
        </div>
        <div className="card">
          <h3>Total Rewards</h3>
          <p style={{fontSize: '1.6rem', fontWeight:700}}>{stats.total_rewards}</p>
        </div>
      </div>

      <div className="card">
        <h3>Recent Activities</h3>
        <div className="admin-list">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Activity</th>
                <th>Emission</th>
                <th>Points</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivities.map(a => (
                <tr key={a.activity_id}>
                  <td>{a.first_name} {a.last_name}</td>
                  <td>{a.activity_name}</td>
                  <td>{a.calculated_emission}</td>
                  <td>{a.points_earned}</td>
                  <td>{new Date(a.activity_date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
