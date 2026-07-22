import Topbar from "@/components/Topbar";
import { contacts, stages } from "@/lib/data";

export default function PipelinePage() {
  return (
    <div>
      <Topbar title="Pipeline" subtitle="Deal stages" />

      <div className="kanban">
        {stages.map((stage) => {
          const stageContacts = contacts.filter((c) => c.stage === stage);

          return (
            <div key={stage} className="kanban-col">
              <div className="kanban-title">
                <span>{stage}</span>
                <span className="muted">{stageContacts.length}</span>
              </div>

              {stageContacts.map((contact) => (
                <div key={contact.id} className="kanban-card">
                  <strong>{contact.name}</strong>
                  <div className="muted">{contact.email}</div>
                  <div style={{ marginTop: 8 }}>
                    <span className="badge">{contact.tags?.[0] || "Lead"}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}