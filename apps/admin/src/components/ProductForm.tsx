"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Minus, Plus, X } from "lucide-react";
import type { ProductDoc, ProductInput } from "@repo/ui/lib/db/types";
import { normalizeImageUrl } from "@repo/ui/lib/image-url";

function Label({ text }: { text: string }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#344054]">
      {text}
    </label>
  );
}

function TextField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: "text" | "number";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label text={label} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/20"
      />
    </div>
  );
}

function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label text={label} />
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 pr-11 text-sm text-[#344054] shadow-sm focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10"
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#667085]" />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white">
      <div className="border-b border-[#E4E7EC] px-6 py-4">
        <h3 className="text-lg font-medium text-[#1D2939]">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Build a URL-safe slug from the product name for the storefront href.
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Format a numeric VND price like 279650 -> "279.650 ₫".
function formatVnd(price: number): string {
  return `${price.toLocaleString("vi-VN")} ₫`;
}

const CATEGORIES = ["Áo", "Váy", "Chân váy", "Set bộ", "Đồ bơi", "Khác"];
const BRANDS = ["COCANDY", "Apple", "Samsung", "LG"];
const COLORS = ["Silver", "Black", "White", "Gray"];

export function ProductForm({ initial }: { initial?: ProductDoc }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState(
    initial ? String(initial.price) : "",
  );
  const [stock, setStock] = useState(0);
  const [availability, setAvailability] = useState(
    initial ? (initial.inStock ? "In Stock" : "Out of Stock") : "",
  );
  const [description, setDescription] = useState("");
  // Gallery image URLs (paste links). Start with the existing gallery when
  // editing, or a single empty row for adding.
  const [imageUrls, setImageUrls] = useState<string[]>(
    initial?.images?.length
      ? initial.images
      : initial?.img
        ? [initial.img]
        : [""],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setImageUrlAt(index: number, value: string) {
    setImageUrls((urls) => urls.map((u, i) => (i === index ? value : u)));
  }
  function addImageUrl() {
    setImageUrls((urls) => [...urls, ""]);
  }
  function removeImageUrl(index: number) {
    setImageUrls((urls) => {
      const next = urls.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });
  }

  const inStock = availability !== "Out of Stock";

  async function submit(status: "draft" | "publish") {
    setError(null);
    if (!name.trim()) {
      setError("Product Name is required.");
      return;
    }
    const priceNum = Number(price.replace(/[^\d.]/g, "")) || 0;

    // Normalize (e.g. Google Drive share links → direct) and drop blanks.
    const images = imageUrls
      .map((u) => normalizeImageUrl(u))
      .filter((u) => u.length > 0);
    const thumbnail = images[0] || "/images/tailadmin/product/product-01.jpg";

    const payload: ProductInput = {
      name: name.trim(),
      href: initial?.href ?? `/products/${slugify(name)}`,
      img: thumbnail,
      images,
      sale: formatVnd(priceNum),
      category: category || "Khác",
      brand: brand || "COCANDY",
      price: priceNum,
      inStock: status === "publish" ? inStock : false,
    };

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/products/${initial!._id}` : "/api/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to save product");
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
      setSubmitting(false);
    }
  }

  const heading = isEdit ? "Edit Product" : "Add Products";
  const submitLabel = isEdit ? "Save Changes" : "Publish Product";

  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#1D2939]">{heading}</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#667085]">Home</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">{heading}</span>
        </div>
      </div>

      <div className="space-y-6">
        <SectionCard title="Products Description">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                label="Product Name"
                placeholder="Enter product name"
                value={name}
                onChange={setName}
              />
              <SelectField
                label="Category"
                placeholder="Select a category"
                options={CATEGORIES}
                value={category}
                onChange={setCategory}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SelectField
                label="Brand"
                placeholder="Select brand"
                options={BRANDS}
                value={brand}
                onChange={setBrand}
              />
              <SelectField
                label="Color"
                placeholder="Select color"
                options={COLORS}
                value={color}
                onChange={setColor}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <Label text="Price (VND)" />
                <input
                  type="number"
                  placeholder="279000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/20"
                />
              </div>
              <TextField
                label="Length(CM)"
                type="number"
                placeholder="120"
                value=""
                onChange={() => {}}
              />
              <TextField
                label="Width(CM)"
                type="number"
                placeholder="23"
                value=""
                onChange={() => {}}
              />
            </div>
            <div>
              <Label text="Description" />
              <textarea
                rows={6}
                placeholder="Receipt Info (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pricing & Availability">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <TextField
                label="Weight(KG)"
                type="number"
                placeholder="15"
                value=""
                onChange={() => {}}
              />
              <TextField
                label="Length(CM)"
                type="number"
                placeholder="120"
                value=""
                onChange={() => {}}
              />
              <TextField
                label="Width(CM)"
                type="number"
                placeholder="23"
                value=""
                onChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 inline-block text-sm font-semibold text-[#344054]">
                  Stock Quantity
                </label>
                <div className="flex h-11 divide-x divide-[#D0D5DD] overflow-hidden rounded-lg border border-[#D0D5DD]">
                  <button
                    type="button"
                    onClick={() => setStock((s) => Math.max(0, s - 1))}
                    className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#344054] transition hover:bg-gray-100"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stock}
                    onChange={(e) =>
                      setStock(Number(e.target.value.replace(/[^\d]/g, "")) || 0)
                    }
                    className="h-11 w-full border-0 bg-transparent px-3 text-center text-sm text-[#1D2939] focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setStock((s) => s + 1)}
                    className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#344054] transition hover:bg-gray-100"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <SelectField
                label="Availability Status"
                placeholder="Select a Availability"
                options={["In Stock", "Out of Stock"]}
                value={availability}
                onChange={setAvailability}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Products Images">
          <div className="space-y-4">
            <p className="text-sm text-[#667085]">
              Dán link ảnh (Google Drive, hoặc URL ảnh bất kỳ). Ảnh đầu tiên là
              ảnh đại diện. Link Google Drive dạng chia sẻ sẽ tự chuyển sang link
              hiển thị trực tiếp.
            </p>

            <div className="space-y-3">
              {imageUrls.map((url, index) => {
                const preview = url ? normalizeImageUrl(url) : "";
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E4E7EC] bg-[#F9FAFB]">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-[#98A2B3]">
                          {index === 0 ? "Ảnh" : index + 1}
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={url}
                      onChange={(e) => setImageUrlAt(index, e.target.value)}
                      className="h-11 w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/20"
                    />
                    <button
                      type="button"
                      aria-label="Xóa ảnh"
                      onClick={() => removeImageUrl(index)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FEF3F2] hover:text-[#B42318]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addImageUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] shadow-sm transition hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Thêm ảnh
            </button>
          </div>
        </SectionCard>

        {error ? (
          <p className="rounded-lg bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => (isEdit ? router.push("/products") : submit("draft"))}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-medium text-[#344054] ring-1 ring-inset ring-[#D0D5DD] transition hover:bg-gray-50 disabled:opacity-60"
          >
            {isEdit ? "Cancel" : "Draft"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit("publish")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#465FFF] px-5 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#3641F5] disabled:bg-[#9CB9FF]"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
