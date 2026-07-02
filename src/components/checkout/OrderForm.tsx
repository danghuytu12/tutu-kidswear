"use client";

import { useState } from "react";
import { DeliveryIcon, ChevronDownIcon } from "@/components/icons";

const inputClass =
  "rounded-full border border-black/15 px-5 py-3 text-[15px] w-full outline-none focus:border-[#b08560] placeholder:text-black/40";
const labelClass = "text-[14px] text-black mb-1 block";

type Payment = "cod" | "qr";

function SelectField({
  placeholder,
  options,
}: {
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        defaultValue=""
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
  const [payment, setPayment] = useState<Payment>("cod");

  return (
    <div>
      <h2 className="font-display mb-6 text-[26px] font-bold text-black">
        Thông tin đặt hàng
      </h2>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Họ và tên *</label>
            <input className={inputClass} placeholder="Họ và tên" />
          </div>
          <div>
            <label className={labelClass}>Số điện thoại *</label>
            <input className={inputClass} placeholder="Số điện thoại" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} placeholder="Email" />
        </div>

        <div>
          <label className={labelClass}>Địa chỉ *</label>
          <input
            className={inputClass}
            placeholder="Địa chỉ ( VD: 532 Nguyễn Văn Cừ )"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            placeholder="Tỉnh/Thành phố"
            options={["Hà Nội", "TP. Hồ Chí Minh"]}
          />
          <SelectField
            placeholder="Quận/Huyện"
            options={["Quận 1", "Quận 2"]}
          />
          <SelectField
            placeholder="Phường/Xã"
            options={["Phường 1", "Phường 2"]}
          />
        </div>

        <textarea
          rows={3}
          placeholder="Ghi chú thêm ( Ví dụ: Giao hàng giờ hành chính)"
          className="w-full rounded-2xl border border-black/15 px-5 py-3 text-[15px] outline-none focus:border-[#b08560] placeholder:text-black/40"
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

      <button
        type="button"
        className="mt-5 w-full rounded-full bg-[#b08560] py-3.5 text-[16px] font-semibold text-white hover:bg-[#8a6647]"
      >
        Thanh Toán
      </button>
    </div>
  );
}
