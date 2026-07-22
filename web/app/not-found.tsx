import Link from "next/link";

export default function NotFound() {
  return (
    <main className="notfound">
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="empty-icon">🧭</div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Page not found</h1>
        <p className="muted" style={{ margin: "10px 0 18px" }}>
          The page you are looking for does not exist.
        </p>
        <Link className="btn" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}