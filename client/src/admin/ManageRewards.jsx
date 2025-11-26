// client/src/admin/ManageRewards.jsx
import React, { useEffect, useState } from 'react';
import './admin.css';

const empty = { name: '', description: '', points_required: 0, stock_count: 0 };

const ManageRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRewards(); }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/rewards', { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setRewards(data.data || []);
    } catch (err) { console.error(err); alert('Failed to fetch rewards'); } finally { setLoading(false); }
  };

  const change = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/admin/rewards/${editingId}` : '/api/admin/rewards';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      alert(data.message);
      setForm(empty); setEditingId(null); fetchRewards();
    } catch (err) { console.error(err); alert(err.message || 'Failed'); }
  };

  const edit = (r) => {
    setEditingId(r.reward_id);
    setForm({ name: r.name, description: r.description, points_required: r.points_required, stock_count: r.stock_count });
  };

  const remove = async (id) => {
    if (!confirm('Delete reward?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/rewards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      alert('Deleted');
      fetchRewards();
    } catch (err) { console.error(err); alert('Failed'); }
  };

  return (
    <div className="admin-container">
      <div className="admin-header"><h1>Manage Rewards</h1></div>

      <div className="card">
        <form onSubmit={submit}>
          <div className="form-row">
            <input name="name" placeholder="Reward name" value={form.name} onChange={change} required />
            <input name="points_required" type="number" placeholder="Points required" value={form.points_required} onChange={change} required />
          </div>
          <div className="form-row">
            <input name="stock_count" type="number" placeholder="Stock count" value={form.stock_count} onChange={change} required />
          </div>
          <div style={{marginBottom:'0.5rem'}}>
            <textarea name="description" placeholder="Description" value={form.description} onChange={change} />
          </div>
          <button className="btn btn-primary" type="submit">{editingId ? 'Update Reward' : 'Add Reward'}</button>
          {editingId && <button type="button" className="btn small" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
        </form>
      </div>

      <div className="card" style={{marginTop:'1rem'}}>
        <h3>Available Rewards</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Points</th><th>Stock</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="4">Loading...</td></tr> :
              rewards.map(r => (
                <tr key={r.reward_id}>
                  <td>{r.name}</td>
                  <td>{r.points_required}</td>
                  <td>{r.stock_count}</td>
                  <td>
                    <button className="btn btn-primary small" onClick={() => edit(r)}>Edit</button>{' '}
                    <button className="btn btn-danger small" onClick={() => remove(r.reward_id)}>Delete</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRewards;
