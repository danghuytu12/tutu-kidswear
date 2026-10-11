import { TopProgressBar } from "@repo/ui/components/TopProgressBar";
import { ToastProvider } from "@repo/ui/components/ui/toast";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";
import { AdminBottomNav } from "@/components/AdminBottomNav";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <TopProgressBar />
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          {/* Bottom padding clears the fixed phone tab bar (h-16 + safe area). */}
          <main className="flex-1 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:p-8">
            {children}
          </main>
        </div>
        <AdminBottomNav />
      </div>
    </ToastProvider>
  );
}
