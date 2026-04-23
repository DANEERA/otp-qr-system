import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8787/api";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  const sendOtp = async () => {
    await axios.post(`${API}/send-otp`, { phone });
    setStep(2);
  };

  const verifyOtp = async () => {
    const res = await axios.post(`${API}/verify-otp`, {
      phone,
      otp,
    });

    if (res.data.success) {
      localStorage.setItem("token", res.data.token);

      // 🔥 IMPORTANT
      navigate("/qr-login"); // OTP success → QR login page
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>OTP Login</h1>

      {step === 1 && (
        <>
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <br />
          <button onClick={sendOtp}>Send OTP</button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <br />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}
    </div>
  );
}