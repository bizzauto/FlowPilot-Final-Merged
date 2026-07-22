"use client";

export default function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
      {delta ? <div className="delta">{delta}</div> : null}
    </div>
  );
}