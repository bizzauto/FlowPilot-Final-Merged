"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/members", { headers: orgHeaders() });
      const data = await res.json();
      setMembers(data.items || []);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id: string, role: string) => {
    await fetch(`/api/v1/members/${id}/role`, {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ role }),
    });

    load();
  };

  return (
    <div>
      <Topbar title="Team" subtitle="Members and roles" />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name || "-"}</td>
                <td>{member.email}</td>
                <td>
                  <select
                    className="select"
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value)}
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="AGENT">AGENT</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}