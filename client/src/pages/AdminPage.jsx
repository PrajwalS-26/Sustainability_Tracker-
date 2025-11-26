import { useEffect, useState } from "react";
import { getAdminUsers, getAdminChallenges, createChallenge, deleteChallenge } from "../utils/api";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [form, setForm] = useState({
    challenge_name: "",
    description: "",
    category: "transport",
    start_date: "",
    end_date: "",
    target_reduction: 0,
    reward_points: 0
  });

  useEffect(() => {
    loadUsers();
    loadChallenges();
  }, []);

  const loadUsers = async () => {
    const data = await getAdminUsers();
    setUsers(data);
  };

  const loadChallenges = async () => {
    const data = await getAdminChallenges();
    setChallenges(data);
  };

  const handleDelete = async (id) => {
    await deleteChallenge(id);
    loadChallenges();
  };

  const handleCreate = async () => {
    await createChallenge(form);
    alert("Challenge created");
    loadChallenges();
  };

  return (
    <div className="admin-page">
      <h1>Admin Panel</h1>

      <section>
        <h2>Registered Users</h2>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Type</th>
              <th>Date Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.user_type}</td>
                <td>{u.date_joined.split("T")[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Create Challenge</h2>
        <input placeholder="Name" onChange={e => setForm({ ...form, challenge_name: e.target.value })} />
        <input placeholder="Description" onChange={e => setForm({ ...form, description: e.target.value })} />
        <select onChange={e => setForm({ ...form, category: e.target.value })}>
          <option>transport</option>
          <option>energy</option>
          <option>diet</option>
          <option>waste</option>
        </select>
        <input type="number" placeholder="Target Reduction" onChange={e => setForm({ ...form, target_reduction: e.target.value })} />
        <input type="number" placeholder="Reward Points" onChange={e => setForm({ ...form, reward_points: e.target.value })} />
        <input type="date" onChange={e => setForm({ ...form, start_date: e.target.value })} />
        <input type="date" onChange={e => setForm({ ...form, end_date: e.target.value })} />

        <button onClick={handleCreate}>Create Challenge</button>
      </section>

      <section>
        <h2>Existing Challenges</h2>
        {challenges.map(c => (
          <div key={c.challenge_id}>
            <b>{c.challenge_name}</b> — {c.start_date} → {c.end_date}
            <button onClick={() => handleDelete(c.challenge_id)}>Delete</button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminPage;
