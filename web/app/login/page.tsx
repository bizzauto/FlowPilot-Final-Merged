"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/welcome");
    router.refresh();
  };

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="logo-badge">⚡</div>

        <h1 style={{ fontSize: 30, fontWeight: 800 }}>FlowPilot Pro</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 22 }}>
          Sign in to your revenue automation workspace.
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="admin@flowpilot.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <div className="badge danger">{error}</div> : null}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}