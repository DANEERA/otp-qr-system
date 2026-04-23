import { useNavigate } from "react-router-dom";

export default function QRLogin() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>QR Login 🔳</h1>

      <p>OTP verified ✅ Now scan QR</p>

      <button onClick={() => navigate("/dashboard")}>
        Go Dashboard
      </button>
    </div>
  );
}