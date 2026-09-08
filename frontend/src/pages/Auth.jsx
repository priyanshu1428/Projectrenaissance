import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Compass, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/dashboard");
  };

  return (
    <AuthShell title="Bienvenido de nuevo, Explorador" subtitle="Entra para abrir tu Bóveda.">
      <form onSubmit={submit} className="space-y-4" data-testid="login-form">
        <Field
          icon={<Mail size={15} />}
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          testId="login-email-input"
          required
        />
        <Field
          icon={<Lock size={15} />}
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          testId="login-password-input"
          required
        />
        {error && (
          <div
            className="text-sm px-3 py-2 rounded"
            data-testid="login-error"
            style={{
              backgroundColor: "color-mix(in srgb, #B94040 15%, transparent)",
              color: "#B94040",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          data-testid="login-submit-button"
          className="pill-btn pill-btn-primary w-full"
          style={{ padding: "0.75rem" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          ¿Sin expediente todavía?{" "}
          <NavLink to="/register" data-testid="login-register-link" style={{ color: "var(--gold)" }}>
            Register your expedition
          </NavLink>
        </p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register, error, setError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await register(name, email, password);
    setLoading(false);
    if (ok) navigate("/dashboard");
  };

  return (
    <AuthShell title="Register your Expedition" subtitle="Seis minutos hasta un expediente completo.">
      <form onSubmit={submit} className="space-y-4" data-testid="register-form">
        <Field
          icon={<User size={15} />}
          label="Name"
          value={name}
          onChange={setName}
          testId="register-name-input"
          required
        />
        <Field
          icon={<Mail size={15} />}
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          testId="register-email-input"
          required
        />
        <Field
          icon={<Lock size={15} />}
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          testId="register-password-input"
          minLength={6}
          required
        />
        {error && (
          <div
            className="text-sm px-3 py-2 rounded"
            data-testid="register-error"
            style={{
              backgroundColor: "color-mix(in srgb, #B94040 15%, transparent)",
              color: "#B94040",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          data-testid="register-submit-button"
          className="pill-btn pill-btn-primary w-full"
          style={{ padding: "0.75rem" }}
        >
          {loading ? "Creando expediente…" : "Crear expediente"}
        </button>
        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          Already registered?{" "}
          <NavLink to="/login" data-testid="register-login-link" style={{ color: "var(--gold)" }}>
            Sign in
          </NavLink>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 pt-14 pb-20">
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border-gold)",
          }}
        >
          <Compass size={22} style={{ color: "var(--gold)" }} />
        </div>
        <h1
          className="font-serif-display text-3xl sm:text-4xl"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
      <div className="parchment-card p-6 sm:p-8">{children}</div>
    </div>
  );
}

function Field({ icon, label, value, onChange, type = "text", testId, ...rest }) {
  return (
    <label className="block">
      <div className="caption mb-1.5 flex items-center gap-1.5">
        <span style={{ color: "var(--gold)" }}>{icon}</span>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="chic-input"
        data-testid={testId}
        {...rest}
      />
    </label>
  );
}
