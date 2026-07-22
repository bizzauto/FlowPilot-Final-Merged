"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

const plans = [
  {
    id: "starter",
    name: "Starter",
    amount: 0,
    features: ["CRM", "Contacts", "Basic dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    amount: 4999,
    features: ["WhatsApp inbox", "Campaigns", "Automations"],
  },
  {
    id: "agency",
    name: "Agency",
    amount: 14999,
    features: ["Multi-client", "White-label", "API access"],
  },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/billing/subscriptions", {
        headers: orgHeaders(),
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const buy = async (plan: any) => {
    if (plan.amount === 0) {
      alert("Starter plan is free.");
      return;
    }

    setLoading(plan.id);

    try {
      const res = await fetch("/api/billing/razorpay/order", {
        method: "POST",
        headers: orgHeaders(),
        body: JSON.stringify({ plan: plan.id }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error?.message || "Razorpay is not configured.");
        return;
      }

      await loadRazorpay();

      const options = {
        key: json.keyId,
        order_id: json.order.id,
        name: "FlowPilot Pro",
        description: `${plan.name} Plan`,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/billing/razorpay/verify", {
            method: "POST",
            headers: orgHeaders(),
            body: JSON.stringify({
              plan: plan.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyJson = await verifyRes.json();

          if (verifyJson.success) {
            alert("Payment successful. Plan activated.");
            load();
          } else {
            alert("Payment verification failed.");
          }
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } finally {
      setLoading("");
    }
  };

  return (
    <div>
      <Topbar title="Billing" subtitle="Plans and subscription management" />

      <div className="card hero" style={{ marginBottom: 16 }}>
        <div className="card-title">Current Plan</div>

        {!data ? (
          <div className="muted">Loading billing...</div>
        ) : (
          <div>
            <div className="stat-value">{data.organization?.plan || "starter"}</div>
            <div className="muted">Organization: {data.organization?.name}</div>
          </div>
        )}
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        {plans.map((plan) => (
          <div key={plan.id} className="card">
            <div className="card-title">{plan.name}</div>

            <div className="stat-value">
              {plan.amount === 0 ? "Free" : `₹${plan.amount.toLocaleString("en-IN")}`}
            </div>

            <div style={{ display: "grid", gap: 8, margin: "14px 0" }}>
              {plan.features.map((feature) => (
                <span key={feature} className="badge">
                  {feature}
                </span>
              ))}
            </div>

            <button
              className="btn"
              onClick={() => buy(plan)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? "Loading..." : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Subscription History</div>

        {!data ? (
          <EmptyState icon="💳" title="Loading subscriptions" />
        ) : (data.subscriptions || []).length === 0 ? (
          <EmptyState icon="💳" title="No subscriptions yet" subtitle="Upgrade to a paid plan." />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(data.subscriptions || []).map((sub: any) => (
                  <tr key={sub.id}>
                    <td>{sub.provider}</td>
                    <td>{sub.plan}</td>
                    <td>
                      <span className="badge success">{sub.status}</span>
                    </td>
                    <td>{new Date(sub.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}