import { useState } from "react";
import { dash } from "../styles/dashboardStyles";


export default function Dashboard({ user, dashboardData, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const summary = dashboardData?.summary || {
    totalLeavesKg: 0,
    pendingAmount: 0,
    paidAmount: 0,
  };

  const deliveries = dashboardData?.deliveries || [];

  const menuItemStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "700",
    color: "#333",
    borderBottom: "1px solid #eee",
  };

  return (
    <div style={dash.page}>
      {/* NAVBAR */}
      <div style={dash.navbar}>
        <div style={dash.navBrand}>RUHUNU TEA</div>

        <div style={dash.menuWrapper}>
          <button
            style={dash.menuIconBtn}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          <div
            style={{
              ...dash.dropdown,
              transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "auto" : "none",
            }}
          >
            <button
              onClick={() => {
                setProfileOpen(true);
                setSettingsOpen(false);
                setMenuOpen(false);
              }}
              style={menuItemStyle}
            >
              👤 User Profile
            </button>

            <button
              onClick={() => {
                setSettingsOpen(true);
                setProfileOpen(false);
                setMenuOpen(false);
              }}
              style={menuItemStyle}
            >
              ⚙️ Setting
            </button>

            <button
              onClick={onLogout}
              style={{ ...menuItemStyle, borderBottom: "none" }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={dash.container}>
        <div style={dash.welcomeCard}>
          <h1 style={dash.welcomeTitle}>
            ආයුබෝවන්, {user?.fullName || "User"}!
          </h1>

          <div style={dash.metaRow}>
            <span style={dash.metaText}>
              පොත් අංකය: {user?.bookNumber || "N/A"}
            </span>
            <span style={dash.badge}>ID: N/A</span>
          </div>

          <div style={dash.subText}>
            දුරකථනය: {user?.mobileNumber || "N/A"}
          </div>
        </div>

        {profileOpen && (
          <div style={dash.welcomeCard}>
            <h2 style={dash.tableTitle}>User Profile</h2>
            <div style={dash.subText}>නම: {user?.fullName}</div>
            <div style={dash.subText}>පොත් අංකය: {user?.bookNumber}</div>
            <div style={dash.subText}>
              දුරකථනය: {user?.mobileNumber || "N/A"}
            </div>
          </div>
        )}

        {settingsOpen && (
          <div style={dash.welcomeCard}>
            <h2 style={dash.tableTitle}>Setting</h2>
            <div style={dash.subText}>🔔 Notifications</div>
            <div style={dash.subText}>🌐 Language</div>
            <div style={dash.subText}>🎨 Theme</div>
          </div>
        )}

        {/* STATS */}
        <div style={dash.statsGrid}>
          <div style={{ ...dash.statCard, borderLeft: "5px solid #2e7d32" }}>
            <div style={dash.statLabel}>මේ මාසයේ අමු දලු බර</div>
            <div style={dash.statValue}>
              {Number(summary.totalLeavesKg).toFixed(2)} kg
            </div>
          </div>

          <div style={{ ...dash.statCard, borderLeft: "5px solid #f4b400" }}>
            <div style={dash.statLabel}>ලැබිය යුතු මුදල</div>
            <div style={dash.statValueMoney}>
              Rs. {Number(summary.pendingAmount).toFixed(2)}
            </div>
          </div>

          <div style={{ ...dash.statCard, borderLeft: "5px solid #1e88e5" }}>
            <div style={dash.statLabel}>සිදු ගෙවූ මුදල</div>
            <div style={dash.statValueMoney}>
              Rs. {Number(summary.paidAmount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div style={dash.tableCard}>
          <h2 style={dash.tableTitle}>අවසාන දලු එවන ඉතිහාසය</h2>

          <div style={dash.tableHead}>
            <div>දිනය</div>
            <div>වර්ගය</div>
            <div>බර</div>
            <div>තත්වය</div>
          </div>

          {deliveries.length ? (
            deliveries.map((row, i) => (
              <div key={i} style={dash.tableRow}>
                <div>{row.date}</div>
                <div>{row.type}</div>
                <div>{row.qty}</div>
                <div>
                  <span style={dash.statusPill}>{row.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={dash.emptyRow}>දත්ත නැත</div>
          )}
        </div>

        <div style={dash.footer}>
          <div style={dash.footerText}>OFFICIAL APP</div>
          <div style={dash.footerLogo}>🌿</div>
        </div>
      </div>
    </div>
  );
}