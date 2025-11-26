// client/src/admin/ManageUsers.jsx
import React, { useEffect, useState } from 'react';
import './admin.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load users');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      alert('User deleted');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Users</h1>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Type</th><th>Points</th><th>Joined</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6">Loading...</td></tr> :
              users.map(u => (
                <tr key={u.user_id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>{u.user_type}</td>
                  <td>{u.total_points}</td>
                  <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger small" onClick={() => handleDelete(u.user_id)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
