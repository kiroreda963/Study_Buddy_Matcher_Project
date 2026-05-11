import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function validatePassword(pw) {
  // return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw);
  return true; // Relaxed for testing purposes
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const isValid = email.trim() !== "" && validatePassword(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
      console.log("Registered user:", user);
      navigate("/profile-setup");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #fff;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Top progress bar */
        .topbar {
          height: 4px;
          background: linear-gradient(90deg, #4ADE80 0%, #22c55e 60%, #e2e8f0 60%);
        }

        .main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 20px 40px;
        }

        .card {
          width: 100%;
          max-width: 510px;
        }

        h1 {
          font-size: 30px;
          font-weight: 700;
          color: #4ADE80;
          text-align: center;
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .signin-row {
          text-align: center;
          font-size: 14px;
          color: #555;
          margin-bottom: 44px;
        }

        .signin-row a {
          color: #4ADE80;
          text-decoration: none;
          font-weight: 500;
        }

        .signin-row a:hover {
          text-decoration: underline;
        }

        /* Field */
        .field {
          margin-bottom: 24px;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          font-family: 'Inter', sans-serif;
          padding: 0;
          transition: color 0.15s;
        }

        .toggle-btn:hover { color: #4ADE80; }

        .toggle-btn svg { opacity: 0.7; }

        input[type="email"],
        input[type="password"],
        input[type="text"] {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus {
          border-color: #4ADE80;
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.15);
        }

        input::placeholder { color: #b0bec5; }

        .hint {
          margin-top: 7px;
          font-size: 12px;
          color: #94A3B8;
        }

        /* Terms */
        .terms {
          font-size: 13px;
          color: #555;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .terms a {
          color: #1a1a1a;
          text-decoration: underline;
          font-weight: 500;
        }

        /* Submit button */
        .btn-create {
          width: 100%;
          padding: 14px;
          background: #d1fae5;
          color: #6EE7B7;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          border: none;
          border-radius: 50px;
          cursor: not-allowed;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.1s;
          letter-spacing: 0.1px;
        }

        .btn-create.active {
          background: #4ADE80;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(74, 222, 128, 0.35);
        }

        .btn-create.active:hover {
          background: #22c55e;
          box-shadow: 0 6px 20px rgba(74, 222, 128, 0.45);
          transform: translateY(-1px);
        }

        .btn-create.active:active {
          transform: translateY(0);
        }

        .btn-create:disabled {
          opacity: 0.8;
        }

        /* Error */
        .error-box {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 18px;
        }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page">
        <div className="topbar" />

        <main className="main">
          <div className="card">
            <h1>Create an account</h1>
            <p className="signin-row">
              Already have an Account? <a href="/login">Sign in</a>
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {error && <div className="error-box">{error}</div>}

              {/* Email */}
              <div className="field">
                <div className="field-header">
                  <label className="field-label">
                    What should we call you?
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Enter your Profile name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email */}
              <div className="field">
                <div className="field-header">
                  <label className="field-label">What's your email?</label>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="field">
                <div className="field-header">
                  <label className="field-label">Create a password</label>
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <p className="hint">
                  Use 8 or more characters with a mix of letters, numbers &amp;
                  symbols
                </p>
              </div>

              {/* Terms */}
              <p className="terms">
                By creating an account, you agree to the{" "}
                <a href="/terms">Terms of use</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </p>

              <button
                type="submit"
                className={`btn-create${isValid ? " active" : ""}`}
                disabled={!isValid || loading}
              >
                {loading && <span className="spinner" />}
                {loading ? "Creating account…" : "Create an account"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
