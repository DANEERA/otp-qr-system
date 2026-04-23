import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>Dashboard 🔥</h1>

      <button onClick={logout}>Logout</button>
    </div>
  );
}