import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import Dashboard from "./pages/Dashboard";

const API = "https://otp-qr-system-production.up.railway.app";

export default function App() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (step !== 2) return;

    setCanResend(false);
    setTimer(30);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 1000;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.stop(t + 0.18);
      };
      const now = ctx.currentTime;
      beep(now);
      beep(now + 0.2);
    } catch {}
  };

  const showError = (txt) => {
    setError(txt);
    setMessage("");
  };

  const showMessage = (txt) => {
    setMessage(txt);
    setError("");
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const otpValue = otp.join("");

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${API}/send-login-otp`,
        { phone },
        { withCredentials: true }
      );

      if (res.data.success) {
        showMessage("OTP sent successfully ✅");
        setOtp(["", "", "", "", "", ""]);
        setStep(2);
      } else {
        showError(res.data.message || "OTP send failed");
      }
    } catch (err) {
      showError(err.response?.data?.message || "OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${API}/resend-login-otp`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        showMessage("OTP resent successfully 📩");
        setOtp(["", "", "", "", "", ""]);
        setTimer(30);
        setCanResend(false);
        otpRefs.current[0]?.focus();
      } else {
        showError(res.data.message || "Resend failed");
      }
    } catch (err) {
      showError(err.response?.data?.message || "Resend failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${API}/verify-login-otp`,
        { otp: otpValue },
        { withCredentials: true }
      );

      if (res.data.success) {
        showMessage("OTP verified ✅");
        setStep(3);
        setTimeout(() => startScanner(), 300);
      } else {
        showError(res.data.message || "OTP verify failed");
      }
    } catch (err) {
      showError(err.response?.data?.message || "OTP verify failed");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    const reader = document.getElementById("reader");
    if (!reader) return;

    const scanner = new Html5Qrcode("reader");

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        async (text) => {
          try {
            await scanner.stop();
            await scanner.clear();
          } catch {}

          verifyQr(text);
        }
      );
    } catch {
      showError("Camera error");
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await axios.get(`${API}/api/dashboard`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setDashboardData(res.data.dashboard);
        setUser(res.data.dashboard.user);
        setStep(4);
      } else {
        showError(res.data.message || "Dashboard load failed");
      }
    } catch (err) {
      showError(err.response?.data?.message || "Dashboard load failed");
    }
  };

  const verifyQr = async (qr) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.get(
        `${API}/api/verify-book-qr/${qr}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        playBeep();

        setUser({
          fullName: res.data.user?.fullName || res.data.name,
          bookNumber: res.data.user?.bookNumber || res.data.bookNo,
          mobileNumber: res.data.user?.mobileNumber || phone,
        });

        showMessage("Verified successfully ✅");
        setTimeout(() => loadDashboard(), 1200);
      } else {
        showError(res.data.message || "QR verify failed");
        setTimeout(() => startScanner(), 1000);
      }
    } catch (err) {
      showError(err.response?.data?.message || "QR error");
      setTimeout(() => startScanner(), 1000);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/api/logout`, {}, { withCredentials: true });
    } catch {}

    setStep(1);
    setPhone("");
    setOtp(["", "", "", "", "", ""]);
    setUser(null);
    setDashboardData(null);
    setError("");
    setMessage("");
    setTimer(30);
    setCanResend(false);
  };

  return (
    <>
      <style>
        {`
          @keyframes scanMove {
            0% { top: 0; }
            100% { top: 100%; }
          }
        `}
      </style>

      {step !== 4 ? (
        <div style={styles.page}>
          <div style={styles.card}>
            <h1 style={styles.brand}>RUHUNU TEA</h1>
            <p style={styles.subBrand}>Tea Factory Login System</p>

            {loading && <div style={styles.loading}>Loading...</div>}
            {message && <div style={styles.ok}>{message}</div>}
            {error && <div style={styles.err}>{error}</div>}

            {step === 1 && (
              <>
                <input
                  placeholder="947XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.btn} onClick={sendOtp}>
                  Send OTP
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      style={styles.otpBox}
                    />
                  ))}
                </div>

                <button style={styles.btn} onClick={verifyOtp}>
                  Verify OTP
                </button>

                <div style={{ marginTop: 12 }}>
                  {canResend ? (
                    <button style={styles.link} onClick={resendOtp}>
                      Resend OTP
                    </button>
                  ) : (
                    <p style={styles.timerText}>Resend in {timer}s</p>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={styles.cameraWrap}>
                  <div style={styles.cameraFrame}>
                    <div id="reader" style={styles.camera}></div>
                    <div style={styles.scanLine}></div>
                  </div>
                </div>

                <p style={styles.scanText}>Scan QR Code</p>

                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>Book Number</p>
                  <p style={styles.infoValue}>{user?.bookNumber || "..."}</p>
                </div>

                <div style={styles.infoBox}>
                  <p style={styles.infoLabel}>Owner Name</p>
                  <p style={styles.infoValue}>{user?.fullName || "..."}</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <Dashboard
          user={user}
          dashboardData={dashboardData}
          onLogout={logout}
        />
      )}
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eaf5ec, #d7ebdc, #cfe3d6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "390px",
    padding: "28px 20px",
    borderRadius: "28px",
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    textAlign: "center",
    color: "#1b4332",
  },
  brand: {
    color: "#1b4332",
    fontSize: "28px",
    fontWeight: "900",
    marginBottom: "5px",
    letterSpacing: "1px",
  },
  subBrand: {
    color: "#52796f",
    marginBottom: "18px",
    fontSize: "13px",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #d0e2d6",
    outline: "none",
    marginBottom: "12px",
    fontSize: "18px",
    fontWeight: "bold",
    background: "rgba(255,255,255,0.9)",
    color: "#1b4332",
    textAlign: "center",
    boxSizing: "border-box",
  },
  otpRow: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "14px",
  },
  otpBox: {
    width: "46px",
    height: "56px",
    borderRadius: "14px",
    border: "1px solid #d0e2d6",
    background: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1b4332",
    outline: "none",
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "#2d6a4f",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
  },
  link: {
    background: "none",
    border: "none",
    color: "#2d6a4f",
    fontWeight: "bold",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "14px",
  },
  timerText: {
    color: "#6c757d",
    margin: 0,
    fontWeight: "bold",
    fontSize: "13px",
  },
  cameraWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px",
  },
  cameraFrame: {
    width: "230px",
    height: "230px",
    borderRadius: "20px",
    overflow: "hidden",
    border: "2px solid #b7d6c2",
    background: "#000",
    position: "relative",
  },
  camera: {
    width: "230px",
    height: "230px",
    background: "#000",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "2px",
    background: "rgba(255,0,0,0.8)",
    boxShadow: "0 0 8px rgba(255,0,0,0.8)",
    animation: "scanMove 2s linear infinite",
  },
  scanText: {
    color: "#2d6a4f",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  infoBox: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #e0efe6",
    borderRadius: "14px",
    padding: "10px",
    marginTop: "10px",
  },
  infoLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#6c757d",
  },
  infoValue: {
    margin: "5px 0 0",
    fontSize: "17px",
    fontWeight: "bold",
    color: "#1b4332",
    wordBreak: "break-word",
  },
  ok: {
    color: "#2d6a4f",
    marginBottom: "10px",
    fontWeight: "bold",
    background: "#e9f7ef",
    padding: "10px",
    borderRadius: "10px",
  },
  err: {
    color: "#b00020",
    marginBottom: "10px",
    fontWeight: "bold",
    background: "#fdecea",
    padding: "10px",
    borderRadius: "10px",
  },
  loading: {
    color: "#2d6a4f",
    marginBottom: "10px",
    fontWeight: "bold",
  },
};