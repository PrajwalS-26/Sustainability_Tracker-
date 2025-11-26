// client/src/admin/ManageChallenges.jsx
import React, { useEffect, useState } from 'react';
import './admin.css';

const defaultForm = {
  challenge_name: '',
  description: '',
  category: 'lifestyle',
  target_reduction: 0.0,
  reward_points: 0,
  start_date: '',
  end_date: '',
  is_active: 1
};

const ManageChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchChallenges(); }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/challenges', { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setChallenges(data.data || []);
    } catch (err) {
      console.error(err); alert('Failed to fetch challenges');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/admin/challenges/${editingId}` : '/api/admin/challenges';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      alert(data.message);
      setForm(defaultForm); setEditingId(null); fetchChallenges();
    } catch (err) { console.error(err); alert(err.message || 'Failed'); }
  };

  const edit = (c) => {
    setEditingId(c.challenge_id);
    setForm({
      challenge_name: c.challenge_name,
      description: c.description,
      category: c.category,
      target_reduction: c.target_reduction,
      reward_points: c.reward_points,
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      is_active: c.is_active ? 1 : 0
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete challenge?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      alert('Deleted');
      fetchChallenges();
    } catch (err) { console.error(err); alert('Failed'); }
  };

  return (
    <div className="admin-container">
      <div className="admin-header"><h1>Manage Challenges</h1></div>

      <div className="card">
        <form onSubmit={submit}>
          <div className="form-row">
            <input name="challenge_name" placeholder="Challenge name" value={form.challenge_name} onChange={handleChange} required />
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="transport">transport</option>
              <option value="diet">diet</option>
              <option value="energy">energy</option>
              <option value="lifestyle">lifestyle</option>
            </select>
          </div>

          <div className="form-row">
            <input name="target_reduction" type="number" step="0.01" value={form.target_reduction} onChange={handleChange} placeholder="target reduction" />
            <input name="reward_points" type="number" value={form.reward_points} onChange={handleChange} placeholder="reward points" />
          </div>

          <div className="form-row">
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required />
          </div>

          <div style={{marginBottom: '0.5rem'}}>
            <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} style={{minHeight: '80px'}} required />
          </div>

          <button className="btn btn-primary" type="submit">{editingId ? 'Update Challenge' : 'Add Challenge'}</button>
          {editingId && <button type="button" className="btn small" onClick={() => { setEditingId(null); setForm(defaultForm); }}>Cancel</button>}
        </form>
      </div>

      <div className="card" style={{marginTop:'1rem'}}>
        <h3>Existing Challenges</h3>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Category</th><th>Dates</th><th>Points</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5">Loading...</td></tr> :
              challenges.map(c => (
                <tr key={c.challenge_id}>
                  <td>{c.challenge_name}</td>
                  <td>{c.category}</td>
                  <td>{c.start_date} → {c.end_date}</td>
                  <td>{c.reward_points}</td>
                  <td>
                    <button className="btn btn-primary small" onClick={() => edit(c)}>Edit</button>{' '}
                    <button className="btn btn-danger small" onClick={() => remove(c.challenge_id)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageChallenges;
