"use client";

import { useState } from "react";
import { DeliveryIcon } from "@repo/ui/components/icons";
import { useCart } from "@repo/ui/components/cart/CartContext";
import { useToast } from "@repo/ui/components/ui/toast";
import { shippingFee } from "@repo/ui/lib/cart";
import type { OrderInput } from "@repo/ui/lib/db/types";
import { MotionButton } from "@repo/ui/components/motion";
import { QrPaymentModal } from "./QrPaymentModal";

const inputClass =
  "rounded-full border border-black/15 px-5 py-3 text-[15px] w-full outline-none focus:border-[#b08560] placeholder:text-black/40";
const labelClass = "text-[14px] text-black mb-1 block";

type Payment = "cod" | "qr";

// Vietnamese mobile number: 10 digits starting with 03/05/07/08/09.
const PHONE_RE = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d)\d{7}$/;

export function OrderForm() {
  const { items, totalPrice, totalQty, clear } = useCart();
  const toast = useToast();
  const [payment, setPayment] = useState<Payment>("cod");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Grand total the customer pays (and must transfer for QR) — items + shipping.
  const orderTotal = totalPrice + shippingFee(totalQty);

  /** Validate the shared required fields. Returns true when the form is valid. */
  function validate(): boolean {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Thiếu thông tin", "Vui lòng nhập Họ tên, Số điện thoại và Địa chỉ.");
      return false;
    }
    if (!PHONE_RE.test(phone.trim().replace(/[\s.]/g, ""))) {
      toast.error("Số điện thoại không hợp lệ", "Vui lòng nhập số di động Việt Nam gồm 10 chữ số, bắt đầu bằng 0.");
      return false;
    }
    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống");
      return false;
    }
    return true;
  }

  /**
   * Post the order to the API. For QR orders `proof` is the receipt data URL.
   * Throws on failure so the QR modal can keep itself open; the COD path catches
   * it via its own try/catch below.
   */
  async function submitOrder(proof?: string) {
    const payload: OrderInput = {
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        qty: i.qty,
        img: i.img,
        href: i.href,
        ...(i.size ? { size: i.size } : {}),
        ...(i.color ? { color: i.color } : {}),
      })),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      address: address.trim(),
      province: "",
      district: "",
      ward: "",
      note: note.trim(),
      paymentMethod: payment,
      ...(proof ? { paymentProof: proof } : {}),
    };
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
    toast.success("Đặt hàng thành công!", `Mã đơn: ${data.order._id}`);
    clear();
    setName(""); setPhone(""); setAddress(""); setNote("");
  }

  /** Primary "Thanh Toán" button: COD posts directly, QR opens the QR modal. */
  async function placeOrder() {
    if (!validate()) return;
    if (payment === "qr") {
      setQrOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      await submitOrder();
    } catch (err) {
      toast.error("Không thể tạo đơn hàng", err instanceof Error ? err.message : undefined);
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
            type="tel"
            inputMode="numeric"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Địa chỉ *</label>
          <input
            className={inputClass}
            placeholder="Địa chỉ ( VD: 532 Nguyễn Văn Cừ, Phường 1, Quận 5, TP.HCM )"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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

      <MotionButton
        type="button"
        onClick={placeOrder}
        disabled={submitting}
        className="mt-5 w-full cursor-pointer rounded-full bg-[#b08560] py-3.5 text-[16px] font-semibold text-white hover:bg-[#8a6647] disabled:opacity-60"
      >
        {submitting ? "Đang xử lý..." : "Thanh Toán"}
      </MotionButton>

      <QrPaymentModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        amount={orderTotal}
        transferNote={phone.trim() || name.trim()}
        onConfirmed={async (proof) => {
          // Place the QR order; on success close the modal. Errors propagate so
          // the modal stays open and shows its own retry toast.
          await submitOrder(proof);
          setQrOpen(false);
        }}
      />
    </div>
  );
}
