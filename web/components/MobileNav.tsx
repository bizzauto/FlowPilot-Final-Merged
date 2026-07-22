"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/inbox", label: "Inbox" },
  { href: "/contacts", label: "Contacts" },
  { href: "/broadcast", label: "Broadcast" },
  { href: "/automation-builder", label: "Automations" },
  { href: "/settings", label: "Settings" },
];

export default function MobileNav() {
  const path = usePathname() || "";

  return (
    <nav className="mobile-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={path.startsWith(item.href) ? "active" : ""}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}