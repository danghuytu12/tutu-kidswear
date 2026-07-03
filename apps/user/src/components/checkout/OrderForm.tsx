"use client";

import { useState } from "react";
import { DeliveryIcon, ChevronDownIcon } from "@repo/ui/components/icons";
import { useCart } from "@repo/ui/components/cart/CartContext";
import type { OrderInput } from "@repo/ui/lib/db/types";

const inputClass =
  "rounded-full border border-black/15 px-5 py-3 text-[15px] w-full outline-none focus:border-[#b08560] placeholder:text-black/40";
const labelClass = "text-[14px] text-black mb-1 block";

type Payment = "cod" | "qr";

function SelectField({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-10`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
    </div>
  );
}

export function OrderForm() {
  const { items, clear } = useCart();
  const [payment, setPayment] = useState<Payment>("cod");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function placeOrder() {
    setMessage(null);
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setMessage({ kind: "error", text: "Vui lòng nhập Họ tên, Số điện thoại và Địa chỉ." });
      return;
    }
    if (items.length === 0) {
      setMessage({ kind: "error", text: "Giỏ hàng đang trống." });
      return;
    }
    const payload: OrderInput = {
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        qty: i.qty,
        img: i.img,
        href: i.href,
      })),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || undefined,
      address: address.trim(),
      province,
      district,
      ward,
      note: note.trim(),
      paymentMethod: payment,
    };
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Không thể tạo đơn hàng");
      }
      const data = (await res.json()) as { order: { _id: string } };
      setMessage({ kind: "ok", text: `Đặt hàng thành công! Mã đơn: ${data.order._id}` });
      clear();
      setName(""); setPhone(""); setEmail(""); setAddress("");
      setProvince(""); setDistrict(""); setWard(""); setNote("");
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Không thể tạo đơn hàng" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-display mb-6 text-[26px] font-bold text-black">
        Thông tin đặt hàng
      </h2>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Họ và tên *</label>
            <input
              className={inputClass}
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Số điện thoại *</label>
            <input
              className={inputClass}
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            className={inputClass}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Địa chỉ *</label>
          <input
            className={inputClass}
            placeholder="Địa chỉ ( VD: 532 Nguyễn Văn Cừ )"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            placeholder="Tỉnh/Thành phố"
            options={["Hà Nội", "TP. Hồ Chí Minh"]}
            value={province}
            onChange={setProvince}
          />
          <SelectField
            placeholder="Quận/Huyện"
            options={["Quận 1", "Quận 2"]}
            value={district}
            onChange={setDistrict}
          />
          <SelectField
            placeholder="Phường/Xã"
            options={["Phường 1", "Phường 2"]}
            value={ward}
            onChange={setWard}
          />
        </div>

        <textarea
          rows={3}
          placeholder="Ghi chú thêm ( Ví dụ: Giao hàng giờ hành chính)"
          className="w-full rounded-2xl border border-black/15 px-5 py-3 text-[15px] outline-none focus:border-[#b08560] placeholder:text-black/40"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <h2 className="font-display mb-4 mt-8 text-[26px] font-bold text-black">
        Hình thức thanh toán
      </h2>

      <div className="space-y-3">
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 ${
            payment === "cod" ? "border-[#2f5acf]" : "border-black/15"
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={payment === "cod"}
            onChange={() => setPayment("cod")}
            className="sr-only"
          />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              payment === "cod" ? "border-[#2f5acf]" : "border-black/30"
            }`}
          >
            {payment === "cod" && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#2f5acf]" />
            )}
          </span>
          <DeliveryIcon className="h-5 w-5 text-black/70" />
          <span className="text-[15px] text-black">
            Thanh toán khi nhận hàng
          </span>
        </label>

        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 ${
            payment === "qr" ? "border-[#2f5acf]" : "border-black/15"
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={payment === "qr"}
            onChange={() => setPayment("qr")}
            className="sr-only"
          />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              payment === "qr" ? "border-[#2f5acf]" : "border-black/30"
            }`}
          >
            {payment === "qr" && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#2f5acf]" />
            )}
          </span>
          <span className="h-5 w-5 rounded-sm border-2 border-black" />
          <span className="text-[15px] text-black">
            Chuyển khoản ngân hàng bằng QR Code
          </span>
        </label>
      </div>

      {message ? (
        <p
          className={
            "mt-4 rounded-lg px-4 py-3 text-[14px] " +
            (message.kind === "ok"
              ? "bg-[#ecfdf3] text-[#027a48]"
              : "bg-[#fef3f2] text-[#b42318]")
          }
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="button"
        onClick={placeOrder}
        disabled={submitting}
        className="mt-5 w-full rounded-full bg-[#b08560] py-3.5 text-[16px] font-semibold text-white hover:bg-[#8a6647] disabled:opacity-60"
      >
        {submitting ? "Đang xử lý..." : "Thanh Toán"}
      </button>
    </div>
  );
}
