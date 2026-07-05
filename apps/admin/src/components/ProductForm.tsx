"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Plus, X } from "lucide-react";
import type {
  ProductDoc,
  ProductInput,
  ProductVariant,
} from "@repo/ui/lib/db/types";
import { normalizeImageUrl } from "@repo/ui/lib/image-url";
import { RichTextEditor } from "@/components/RichTextEditor";

function Label({ text }: { text: string }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#344054]">
      {text}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/20";

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
        className={inputClass}
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

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    // Support pasting/typing several at once separated by comma.
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    for (const p of parts) {
      if (!next.includes(p)) next.push(p);
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div>
      <Label text={label} />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#D0D5DD] bg-transparent px-3 py-2 shadow-sm focus-within:border-[#465FFF]/40 focus-within:ring-3 focus-within:ring-[#465FFF]/20">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-[#EEF4FF] px-2 py-1 text-sm text-[#3538CD]"
          >
            {tag}
            <button
              type="button"
              aria-label={`Xóa ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="cursor-pointer text-[#3538CD]/60 hover:text-[#3538CD]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          placeholder={tags.length === 0 ? placeholder : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && draft === "" && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          className="min-w-[80px] flex-1 bg-transparent py-1 text-sm text-[#1D2939] outline-none placeholder:text-[#98A2B3]"
        />
      </div>
    </div>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E4E7EC] p-4 transition hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-[#D0D5DD] text-[#465FFF] focus:ring-[#465FFF]/30"
      />
      <span>
        <span className="block text-sm font-medium text-[#344054]">{label}</span>
        <span className="mt-0.5 block text-xs text-[#667085]">
          {description}
        </span>
      </span>
    </label>
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

const CATEGORIES = ["Bé Trai", "Bé Gái"];

type VariantRow = {
  color: string;
  size: string;
  sellPrice: string;
};

function emptyVariant(): VariantRow {
  return { color: "", size: "", sellPrice: "" };
}

function toVariantRows(variants?: ProductVariant[]): VariantRow[] {
  if (!variants?.length) return [emptyVariant()];
  return variants.map((v) => ({
    color: v.color,
    size: v.size,
    sellPrice: String(v.sellPrice),
  }));
}

function toNumber(value: string): number {
  return Number(value.replace(/[^\d.]/g, "")) || 0;
}

export function ProductForm({ initial }: { initial?: ProductDoc }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [buyPrice, setBuyPrice] = useState(
    initial?.buyPrice ? String(initial.buyPrice) : "",
  );
  const [discountPct, setDiscountPct] = useState(
    initial?.discountPct ? String(initial.discountPct) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isNew, setIsNew] = useState(Boolean(initial?.isNew));
  const [isBestSeller, setIsBestSeller] = useState(
    Boolean(initial?.isBestSeller),
  );
  const [sizeChartImage, setSizeChartImage] = useState(
    initial?.sizeChartImage ?? "",
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    toVariantRows(initial?.variants),
  );
  // Bulk generator: enter many colours + many sizes as tags, plus one shared
  // price, then generate the full colour×size matrix into `variants`.
  const [colorTags, setColorTags] = useState<string[]>([]);
  const [sizeTags, setSizeTags] = useState<string[]>([]);
  const [bulkPrice, setBulkPrice] = useState("");
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

  function setVariantAt(index: number, key: keyof VariantRow, value: string) {
    setVariants((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
  }
  function addVariant() {
    setVariants((rows) => [...rows, emptyVariant()]);
  }
  function removeVariant(index: number) {
    setVariants((rows) => {
      const next = rows.filter((_, i) => i !== index);
      return next.length ? next : [emptyVariant()];
    });
  }

  /**
   * Generate one variant per colour×size combination at the shared bulk price
   * and merge them into the manual table. Existing rows are preserved; a
   * generated combo that already exists (same colour+size) is skipped so we
   * never duplicate or clobber a manually-edited price. Blank starter rows are
   * dropped once real variants exist.
   */
  function generateVariants() {
    setError(null);
    if (colorTags.length === 0 || sizeTags.length === 0) {
      setError("Vui lòng nhập ít nhất một màu và một size để tạo biến thể.");
      return;
    }
    const price = String(toNumber(bulkPrice));
    setVariants((rows) => {
      const existing = rows.filter((r) => r.color.trim() || r.size.trim());
      const seen = new Set(
        existing.map((r) => `${r.color.trim()}|${r.size.trim()}`),
      );
      const generated: VariantRow[] = [];
      for (const color of colorTags) {
        for (const size of sizeTags) {
          const key = `${color}|${size}`;
          if (seen.has(key)) continue;
          seen.add(key);
          generated.push({ color, size, sellPrice: price });
        }
      }
      const merged = [...existing, ...generated];
      return merged.length ? merged : [emptyVariant()];
    });
  }

  async function submit(status: "draft" | "publish") {
    setError(null);
    if (!name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    // Keep only variants that have at least a size or a colour filled in.
    const cleanVariants: ProductVariant[] = variants
      .filter((v) => v.color.trim() || v.size.trim())
      .map((v) => ({
        color: v.color.trim(),
        size: v.size.trim(),
        sellPrice: toNumber(v.sellPrice),
      }));

    if (cleanVariants.length === 0) {
      setError("Vui lòng thêm ít nhất một biến thể (màu sắc / kích cỡ).");
      return;
    }

    // Normalize (e.g. Google Drive share links → direct) and drop blanks.
    const images = imageUrls
      .map((u) => normalizeImageUrl(u))
      .filter((u) => u.length > 0);
    const thumbnail = images[0] || "/images/tailadmin/product/product-01.jpg";

    // price/sale/orig/disc are derived server-side from variants[0]; send
    // placeholders so the payload type is satisfied.
    const payload: ProductInput = {
      name: name.trim(),
      href: initial?.href ?? `/products/${slugify(name)}`,
      img: thumbnail,
      images,
      sale: "",
      category: category || "Bé Trai",
      price: 0,
      inStock: status === "publish",
      variants: cleanVariants,
      buyPrice: toNumber(buyPrice),
      discountPct: Math.min(Math.max(toNumber(discountPct), 0), 100),
      isNew,
      isBestSeller,
      description,
      sizeChartImage: normalizeImageUrl(sizeChartImage) || undefined,
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
            <div>
              <Label text="Description" />
              <RichTextEditor value={description} onChange={setDescription} />
            </div>
            <div>
              <Label text="Nổi bật" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CheckboxField
                  label="Sản phẩm mới"
                  description="Đánh dấu là hàng mới về."
                  checked={isNew}
                  onChange={setIsNew}
                />
                <CheckboxField
                  label="Sản phẩm bán chạy"
                  description="Đánh dấu là hàng bán chạy."
                  checked={isBestSeller}
                  onChange={setIsBestSeller}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Biến thể (Màu sắc · Kích cỡ · Giá)">
          <div className="space-y-4">
            {/* Bulk generator: many colours × many sizes → variant matrix. */}
            <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-4">
              <p className="mb-3 text-sm font-medium text-[#344054]">
                Tạo nhanh biến thể
              </p>
              <p className="mb-4 text-xs text-[#667085]">
                Nhập nhiều màu và nhiều size (gõ rồi nhấn Enter để thêm thẻ),
                cùng một giá bán chung. Bấm “Tạo biến thể” để sinh mỗi màu × mỗi
                size thành một dòng bên dưới. Bạn vẫn có thể chỉnh/xóa từng dòng
                sau đó.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TagInput
                  label="Màu sắc"
                  placeholder="Đỏ, Xanh, Vàng…"
                  tags={colorTags}
                  onChange={setColorTags}
                />
                <TagInput
                  label="Kích cỡ"
                  placeholder="90, 100, 110…"
                  tags={sizeTags}
                  onChange={setSizeTags}
                />
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="sm:w-56">
                  <Label text="Giá bán chung (VND) — áp cho tất cả" />
                  <input
                    type="number"
                    placeholder="279000"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={generateVariants}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#465FFF] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#3641F5]"
                >
                  <Plus className="h-4 w-4" />
                  Tạo biến thể
                </button>
              </div>
            </div>

            <p className="text-sm text-[#667085]">
              Mỗi dòng là một biến thể của sản phẩm. Giá hiển thị trên
              storefront lấy từ biến thể đầu tiên.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs font-medium text-[#667085]">
                    <th className="px-2 font-medium">Màu sắc</th>
                    <th className="px-2 font-medium">Kích cỡ</th>
                    <th className="px-2 font-medium">Giá bán (VND)</th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, index) => (
                    <tr key={index}>
                      <td className="px-2">
                        <input
                          placeholder="Đỏ"
                          value={v.color}
                          onChange={(e) =>
                            setVariantAt(index, "color", e.target.value)
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          placeholder="90"
                          value={v.size}
                          onChange={(e) =>
                            setVariantAt(index, "size", e.target.value)
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          placeholder="279000"
                          value={v.sellPrice}
                          onChange={(e) =>
                            setVariantAt(index, "sellPrice", e.target.value)
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="px-2 text-center">
                        <button
                          type="button"
                          aria-label="Xóa biến thể"
                          onClick={() => removeVariant(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FEF3F2] hover:text-[#B42318]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] shadow-sm transition hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Thêm biến thể
            </button>

            <div className="grid grid-cols-1 gap-5 border-t border-[#E4E7EC] pt-4 sm:grid-cols-2">
              <div>
                <Label text="Giá mua (VND) — áp dụng cho cả sản phẩm" />
                <input
                  type="number"
                  placeholder="200000"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label text="% Khuyến mại (áp dụng cho cả sản phẩm)" />
                <input
                  type="number"
                  placeholder="0"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className={inputClass}
                />
              </div>
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
                      className={inputClass}
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

        <SectionCard title="Ảnh bảng size">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E4E7EC] bg-[#F9FAFB]">
              {sizeChartImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={normalizeImageUrl(sizeChartImage)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-[#98A2B3]">Size</span>
              )}
            </div>
            <input
              type="url"
              inputMode="url"
              placeholder="https://.../bang-size.jpg"
              value={sizeChartImage}
              onChange={(e) => setSizeChartImage(e.target.value)}
              className={inputClass}
            />
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
