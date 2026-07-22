import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">{children}</main>
      <MobileNav />
    </div>
  );
}