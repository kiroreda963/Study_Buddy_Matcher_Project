import { useState } from "react";
import { useAuth } from "../context/AuthContext";


// Replace this URL with your actual image URL
const ILLUSTRATION_URL = "https://i.ibb.co/gL4BQrGk/Photo1.png";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login, user, token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);


            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message || "Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Nunito', sans-serif;
          background: #f5f5f5;
        }

        .page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f5f5;
        }

        /* Top nav bar */
        .topbar {
          background: #2d2d2d;
          color: #aaa;
          font-size: 13px;
          padding: 6px 20px;
          font-family: 'Nunito', sans-serif;
        }

        /* Main card area */
        .main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
        }

        .card {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          padding: 48px 56px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
          box-shadow: 0 2px 24px rgba(0,0,0,0.07);
        }

        @media (max-width: 640px) {
          .card {
            grid-template-columns: 1fr;
            padding: 36px 28px;
            gap: 32px;
          }
          .illustration-col { display: none; }
        }

        /* Brand */
        .brand {
          font-size: 28px;
          font-weight: 800;
          color: #4ADE80;
          margin-bottom: 32px;
          letter-spacing: -0.5px;
        }

        /* Form section */
        .form-col h1 {
          font-size: 32px;
          font-weight: 800;
          color: #111;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .create-link-row {
          font-size: 14px;
          color: #555;
          margin-bottom: 28px;
        }

        .create-link-row a {
          color: #4ADE80;
          text-decoration: underline;
          font-weight: 600;
          cursor: pointer;
        }

        /* Field */
        .field {
          margin-bottom: 20px;
        }

        label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 7px;
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'Nunito', sans-serif;
          color: #1a1a1a;
          background: #F8FAFC;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-wrap input:focus {
          border-color: #4ADE80;
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.15);
          background: white;
        }

        .input-wrap input::placeholder {
          color: #A0AEC0;
        }

        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94A3B8;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .eye-btn:hover { color: #4ADE80; }

        /* Remember me */
        .remember-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          cursor: pointer;
          user-select: none;
        }

        .remember-row input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #4ADE80;
          cursor: pointer;
          border-radius: 4px;
        }

        .remember-row span {
          font-size: 14px;
          color: #555;
          font-weight: 600;
        }

        /* Submit button */
        .btn-signin {
          width: 100%;
          padding: 14px;
          background: #4ADE80;
          color: white;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(74, 222, 128, 0.35);
          letter-spacing: 0.2px;
        }

        .btn-signin:hover:not(:disabled) {
          background: #22c55e;
          box-shadow: 0 6px 20px rgba(74, 222, 128, 0.45);
          transform: translateY(-1px);
        }

        .btn-signin:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-signin:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Error */
        .error-box {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Illustration */
        .illustration-col {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .illustration-col img {
          width: 100%;
          max-width: 380px;
          object-fit: contain;
          border-radius: 8px;
        }
      `}</style>

            <div className="page-wrapper">
                <div className="topbar">signin</div>

                <main className="main">
                    <div className="card">
                        {/* Left: Form */}
                        <div className="form-col">
                            <div className="brand">Learn Together</div>
                            <h1>Sign In</h1>
                            <p className="create-link-row">
                                Don't have an account? <a href="/register">Create now</a>
                            </p>

                            <form onSubmit={handleSubmit} noValidate>
                                {error && <div className="error-box">{error}</div>}

                                <div className="field">
                                    <label htmlFor="email">E-mail</label>
                                    <div className="input-wrap">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="example@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-wrap">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="@#*%"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            style={{ paddingRight: "44px" }}
                                        />
                                        <button
                                            type="button"
                                            className="eye-btn"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <label className="remember-row">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember me</span>
                                </label>

                                <button type="submit" className="btn-signin" disabled={loading}>
                                    {loading && <span className="spinner" />}
                                    {loading ? "Signing in…" : "Sign in"}
                                </button>
                            </form>
                        </div>

                        {/* Right: Illustration */}
                        <div className="illustration-col">
                            <img src={ILLUSTRATION_URL} alt="Students learning together" />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}