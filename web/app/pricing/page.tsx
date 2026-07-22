"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    id: "starter",
    name: "Starter",
    amount: 0,
    features: ["CRM", "Contacts", "Basic dashboard", "1 user"],
  },
  {
    id: "growth",
    name: "Growth",
    amount: 4999,
    features: ["CRM", "WhatsApp inbox", "Campaigns", "Automations", "5 users"],
  },
  {
    id: "agency",
    name: "Agency",
    amount: 14999,
    features: ["Multi-client", "White-label", "API access", "Unlimited automations"],
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

export default function PricingPage() {
  const [loading, setLoading] = useState("");

  const buy = async (plan: any) => {
    if (plan.amount === 0) {
      window.location.href = "/login";
      return;
    }

    setLoading(plan.id);

    try {
      const res = await fetch("/api/billing/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error?.message || "Payment setup missing. Please login first.");
        return;
      }

      await loadRazorpay();

      const options = {
        key: data.keyId,
        order_id: data.order.id,
        name: "FlowPilot Pro",
        description: `${plan.name} Plan`,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/billing/razorpay/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              plan: plan.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert("Payment successful. Plan activated.");
            window.location.href = "/dashboard";
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
    <main style={{ minHeight: "100vh", padding: "30px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 22 }}>FlowPilot</div>

          <div style={{ display: "flex", gap: 12 }}>
            <Link className="btn secondary small" href="/">
              Home
            </Link>
            <Link className="btn small" href="/login">
              Login
            </Link>
          </div>
        </div>

        <div style={{ textAlign: "center", margin: "60px 0 40px" }}>
          <h1 style={{ fontSize: 46, fontWeight: 900 }}>Pricing</h1>
          <p className="muted" style={{ marginTop: 12, fontSize: 18 }}>
            Simple plans for growing businesses.
          </p>
        </div>

        <div className="grid grid-3">
          {plans.map((plan) => (
            <div key={plan.id} className="card">
              <div className="card-title">{plan.name}</div>

              <div className="stat-value">
                {plan.amount === 0 ? "Free" : `₹${plan.amount.toLocaleString("en-IN")}`}
              </div>

              <div style={{ display: "grid", gap: 10, margin: "18px 0" }}>
                {plan.features.map((feature) => (
                  <div key={feature} className="badge">
                    {feature}
                  </div>
                ))}
              </div>

              <button
                className="btn"
                onClick={() => buy(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id
                  ? "Loading..."
                  : plan.amount === 0
                  ? "Start Free"
                  : "Buy Now"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}