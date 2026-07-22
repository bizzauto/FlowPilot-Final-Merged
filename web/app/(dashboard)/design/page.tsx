import Topbar from "@/components/Topbar";

export default function DesignSystemPage() {
  return (
    <div>
      <Topbar title="Design System" subtitle="Screenshot-style UI kit" />

      <div className="card design-section">
        <div className="card-title">Colors</div>

        <div className="color-grid">
          <div className="color-swatch" style={{ background: "#6366f1" }}>Brand</div>
          <div className="color-swatch" style={{ background: "#22d3ee" }}>Accent</div>
          <div className="color-swatch" style={{ background: "#34d399" }}>Success</div>
          <div className="color-swatch" style={{ background: "#fbbf24", color: "#111" }}>Warning</div>
          <div className="color-swatch" style={{ background: "#fb7185" }}>Danger</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card design-section">
          <div className="card-title">Buttons</div>

          <div className="component-row">
            <button className="btn">Primary</button>
            <button className="btn secondary">Secondary</button>
            <button className="btn danger">Danger</button>
            <button className="btn small">Small</button>
            <button className="btn" disabled>Disabled</button>
          </div>
        </div>

        <div className="card design-section">
          <div className="card-title">Badges</div>

          <div className="component-row">
            <span className="badge">Default</span>
            <span className="badge success">Success</span>
            <span className="badge warning">Warning</span>
            <span className="badge danger">Danger</span>
            <span className="badge info">Info</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card design-section">
          <div className="card-title">Inputs</div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Text input</label>
              <input className="input" placeholder="Enter text" />
            </div>

            <div>
              <label className="label">Select</label>
              <select className="select">
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>

            <div>
              <label className="label">Textarea</label>
              <textarea className="textarea" rows={4} placeholder="Enter details" />
            </div>
          </div>
        </div>

        <div className="card design-section">
          <div className="card-title">Cards & Stats</div>

          <div className="grid grid-2">
            <div className="card">
              <div className="muted">Revenue</div>
              <div className="stat-value">₹18.4L</div>
              <div className="delta">+22%</div>
            </div>

            <div className="card hero">
              <div className="muted">Active Clients</div>
              <div className="stat-value">42</div>
              <div className="delta">+6</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}