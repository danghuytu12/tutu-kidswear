"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Sai tài khoản hoặc mật khẩu");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[#E4E7EC] bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cocandy/logo.png"
            alt="Tutu Kidswear"
            className="h-14 w-auto"
          />
          <h1 className="font-display mt-3 text-[20px] font-bold text-[#1D2939]">
            Đăng nhập quản trị
          </h1>
        </div>

        <label className="mb-1 block text-[14px] text-[#344054]">
          Tài khoản
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mb-4 w-full rounded-lg border border-[#E4E7EC] px-4 py-2.5 text-[15px] outline-none focus:border-[#b08560]"
        />

        <label className="mb-1 block text-[14px] text-[#344054]">
          Mật khẩu
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-[#E4E7EC] px-4 py-2.5 text-[15px] outline-none focus:border-[#b08560]"
        />

        {error ? (
          <p className="mb-4 text-[14px] text-[#dc2525]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !username || !password}
          className="w-full cursor-pointer rounded-full bg-[#b08560] py-3 text-[16px] font-semibold text-white hover:bg-[#8a6647] disabled:opacity-60"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
