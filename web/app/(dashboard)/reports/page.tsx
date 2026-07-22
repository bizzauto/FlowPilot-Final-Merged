import Topbar from "@/components/Topbar";
import { chart, reportRows } from "@/lib/data";

export default function ReportsPage() {
  const max = Math.max(...chart.map((item) => item.value));

  return (
    <div>
      <Topbar title="Reports" subtitle="Performance analytics" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Weekly Leads</div>

        <div className="bar-chart">
          {chart.map((item) => (
            <div
              key={item.label}
              className="bar"
              style={{ height: `${(item.value / max) * 100}%` }}
            >
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Source Performance</div>

        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Leads</th>
              <th>Deals</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row) => (
              <tr key={row.source}>
                <td>{row.source}</td>
                <td>{row.leads}</td>
                <td>{row.deals}</td>
                <td>{row.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}