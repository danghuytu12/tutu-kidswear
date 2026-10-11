"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Spinner } from "@repo/ui/components/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // iOS Keychain autofill doesn't always fire onChange, so read the
    // submitted values from the form itself.
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
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
    <div className="flex min-h-dvh items-center justify-center bg-[#f7f4ef] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-sm sm:p-8"
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

        <label htmlFor="login-username" className="mb-1 block text-[14px] text-[#344054]">
          Tài khoản
        </label>
        <input
          id="login-username"
          name="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          className="mb-4 h-12 w-full rounded-lg border border-[#E4E7EC] px-4 text-[16px] outline-none focus:border-[#b08560]"
        />

        <label htmlFor="login-password" className="mb-1 block text-[14px] text-[#344054]">
          Mật khẩu
        </label>
        <div className="relative mb-4">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="go"
            className="h-12 w-full rounded-lg border border-[#E4E7EC] pl-4 pr-12 text-[16px] outline-none focus:border-[#b08560]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#667085] hover:bg-[#F2F4F7]"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mb-4 text-[14px] text-[#dc2525]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full cursor-pointer rounded-full bg-[#b08560] text-[16px] font-semibold text-white hover:bg-[#8a6647] disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>
    </div>
  );
}
