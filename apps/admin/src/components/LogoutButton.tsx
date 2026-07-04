"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      aria-label="Đăng xuất"
      onClick={logout}
      className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-black/60 hover:bg-[#f2ece3]"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
