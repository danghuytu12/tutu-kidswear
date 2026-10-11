"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useToast } from "@repo/ui/components/ui/toast";
import type {
  ProductDoc,
  ProductInput,
  ProductVariant,
} from "@repo/ui/lib/db/types";
import { normalizeImageUrl } from "@repo/ui/lib/image-url";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Spinner } from "@repo/ui/components/Spinner";

function Label({ text }: { text: string }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#344054]">
      {text}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#b08560]/40 focus:outline-none focus:ring-3 focus:ring-[#b08560]/20";

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label text={label} />
      <input
        type="text"
        enterKeyHint="next"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

/**
 * Whole-number input for VND prices / percentages. Opens the digit keypad on
 * phones, shows "279.000" grouping while typing, and stores bare digits.
 */
function MoneyInput({
  value,
  onChange,
  placeholder,
  suffix = "₫",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suffix?: string;
  ariaLabel?: string;
}) {
  const digits = value.replace(/\D/g, "");
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="next"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={digits ? Number(digits).toLocaleString("vi-VN") : ""}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className={cn(inputClass, "pr-9 tabular-nums")}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">
        {suffix}
      </span>
    </div>
  );
}

function PriceField({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof MoneyInput>) {
  return (
    <div>
      <Label text={label} />
      <MoneyInput {...props} />
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
          className="h-11 w-full appearance-none rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 pr-11 text-sm text-[#344054] shadow-sm focus:border-[#b08560]/40 focus:outline-none focus:ring-3 focus:ring-[#b08560]/10"
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
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#D0D5DD] bg-transparent px-3 py-2 shadow-sm focus-within:border-[#b08560]/40 focus-within:ring-3 focus-within:ring-[#b08560]/20">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-8 items-center rounded-md bg-[#f7f1ea] pl-2.5 text-sm text-[#8a6647]"
          >
            {tag}
            <button
              type="button"
              aria-label={`Xóa ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#8a6647]/60 hover:text-[#8a6647] active:bg-[#ecdfd0]"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          enterKeyHint="enter"
          autoCorrect="off"
          placeholder={tags.length === 0 ? placeholder : ""}
          onChange={(e) => {
            // Android keyboards don't report "," in keydown, so also commit
            // when a comma arrives through the value itself.
            if (e.target.value.includes(",")) commit(e.target.value);
            else setDraft(e.target.value);
          }}
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
        {draft.trim() ? (
          <button
            type="button"
            // Keep focus in the input so the keyboard stays open.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => commit(draft)}
            className="h-8 shrink-0 rounded-md bg-[#b08560] px-3 text-sm font-medium text-white"
          >
            Thêm
          </button>
        ) : null}
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
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E4E7EC] p-4 transition hover:bg-gray-50 has-checked:border-[#b08560]/50 has-checked:bg-[#f7f1ea]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-[#D0D5DD] accent-[#b08560]"
      />
      <span>
        <span className="block text-sm font-medium text-[#344054]">
          {label}
        </span>
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
      <div className="border-b border-[#E4E7EC] px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-base font-semibold text-[#1D2939] sm:text-lg sm:font-medium">
          {title}
        </h3>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
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
  const toast = useToast();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [buyPrice, setBuyPrice] = useState(
    initial?.buyPrice ? String(initial.buyPrice) : "",
  );
  const [facebookPrice, setFacebookPrice] = useState(
    initial?.facebookPrice ? String(initial.facebookPrice) : "",
  );
  const [shopeePrice, setShopeePrice] = useState(
    initial?.shopeePrice ? String(initial.shopeePrice) : "",
  );
  const [tiktokPrice, setTiktokPrice] = useState(
    initial?.tiktokPrice ? String(initial.tiktokPrice) : "",
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

    // Cost and per-channel prices are required. Older products predate these
    // fields, so the check lives here rather than in the (optional) schema —
    // editing one prompts for the missing prices instead of failing to load.
    const missingPrices = (
      [
        ["giá nhập", buyPrice],
        ["giá bán Facebook", facebookPrice],
        ["giá bán Shopee", shopeePrice],
        ["giá bán TikTok", tiktokPrice],
      ] as const
    )
      .filter(([, value]) => toNumber(value) <= 0)
      .map(([label]) => label);

    if (missingPrices.length > 0) {
      setError(`Vui lòng nhập ${missingPrices.join(", ")}.`);
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
      published: status === "publish",
      variants: cleanVariants,
      buyPrice: toNumber(buyPrice),
      facebookPrice: toNumber(facebookPrice),
      shopeePrice: toNumber(shopeePrice),
      tiktokPrice: toNumber(tiktokPrice),
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
        throw new Error(data.error ?? "Không thể lưu sản phẩm");
      }
      toast.success(
        status === "publish" ? "Đã lưu sản phẩm" : "Đã lưu nháp",
        name.trim(),
      );
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu sản phẩm");
      setSubmitting(false);
    }
  }

  const heading = isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm";
  const submitLabel = isEdit ? "Lưu thay đổi" : "Đăng sản phẩm";

  return (
    <div className="mx-auto max-w-[1536px]">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-[#1D2939] sm:text-xl">{heading}</h1>
        <div className="hidden items-center gap-1.5 text-sm sm:flex">
          <span className="text-[#667085]">Trang chủ</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">{heading}</span>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <SectionCard title="Thông tin sản phẩm">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField
                label="Tên sản phẩm"
                placeholder="VD: Áo cộc cotton vân mỏng NÂU"
                value={name}
                onChange={setName}
              />
              <SelectField
                label="Danh mục"
                placeholder="Chọn danh mục"
                options={CATEGORIES}
                value={category}
                onChange={setCategory}
              />
            </div>
            <div>
              <Label text="Mô tả" />
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
                  <PriceField
                    label="Giá bán chung — áp cho tất cả"
                    placeholder="279.000"
                    value={bulkPrice}
                    onChange={setBulkPrice}
                  />
                </div>
                <button
                  type="button"
                  onClick={generateVariants}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#b08560] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#8a6647]"
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

            {/* One markup for both layouts: stacked cards on phones/tablets,
                a 4-column grid (like a table) from lg up. */}
            <div className="space-y-2">
              <div className="hidden grid-cols-[1fr_1fr_1fr_2.5rem] gap-3 px-1 text-xs font-medium text-[#667085] lg:grid">
                <span>Màu sắc</span>
                <span>Kích cỡ</span>
                <span>Giá bán</span>
              </div>
              {variants.map((v, index) => (
                <div
                  key={index}
                  className="relative grid grid-cols-2 gap-2 rounded-xl border border-[#E4E7EC] p-3 lg:grid-cols-[1fr_1fr_1fr_2.5rem] lg:gap-3 lg:rounded-none lg:border-0 lg:p-0"
                >
                  <p className="col-span-2 flex h-8 items-center text-xs font-medium text-[#667085] lg:hidden">
                    Biến thể {index + 1}
                  </p>
                  <input
                    aria-label={`Màu sắc biến thể ${index + 1}`}
                    placeholder="Màu (VD: Đỏ)"
                    autoCorrect="off"
                    enterKeyHint="next"
                    value={v.color}
                    onChange={(e) => setVariantAt(index, "color", e.target.value)}
                    className={inputClass}
                  />
                  <input
                    aria-label={`Kích cỡ biến thể ${index + 1}`}
                    placeholder="Size (VD: 90)"
                    autoCorrect="off"
                    enterKeyHint="next"
                    value={v.size}
                    onChange={(e) => setVariantAt(index, "size", e.target.value)}
                    className={inputClass}
                  />
                  <div className="col-span-2 lg:col-span-1">
                    <MoneyInput
                      ariaLabel={`Giá bán biến thể ${index + 1}`}
                      placeholder="279.000"
                      value={v.sellPrice}
                      onChange={(value) => setVariantAt(index, "sellPrice", value)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Xóa biến thể ${index + 1}`}
                    onClick={() => removeVariant(index)}
                    className="absolute right-1.5 top-1.5 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FEF3F2] hover:text-[#B42318] active:bg-[#FEF3F2] lg:static lg:h-11"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#D0D5DD] bg-white px-4 text-sm font-medium text-[#344054] transition hover:bg-gray-50 active:bg-gray-50 sm:w-auto sm:border-solid sm:shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Thêm biến thể
            </button>

            <div className="border-t border-[#E4E7EC] pt-4">
              <p className="mb-3 text-xs text-[#667085]">
                Giá nhập, giá theo kênh và khuyến mại áp dụng cho cả sản phẩm.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                <PriceField label="Giá nhập" placeholder="200.000" value={buyPrice} onChange={setBuyPrice} />
                <PriceField label="Giá Facebook" placeholder="290.000" value={facebookPrice} onChange={setFacebookPrice} />
                <PriceField label="Giá Shopee" placeholder="299.000" value={shopeePrice} onChange={setShopeePrice} />
                <PriceField label="Giá TikTok" placeholder="295.000" value={tiktokPrice} onChange={setTiktokPrice} />
                <PriceField
                  label="Khuyến mại"
                  placeholder="0"
                  suffix="%"
                  value={discountPct}
                  onChange={setDiscountPct}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Hình ảnh sản phẩm">
          <div className="space-y-4">
            <p className="text-sm text-[#667085]">
              Dán link ảnh (Google Drive, hoặc URL ảnh bất kỳ). Ảnh đầu tiên là
              ảnh đại diện. Link Google Drive dạng chia sẻ sẽ tự chuyển sang
              link hiển thị trực tiếp.
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
                      className="inline-flex h-11 w-11 shrink-0 lg:h-9 lg:w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#FEF3F2] hover:text-[#B42318]"
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
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#D0D5DD] bg-white px-4 text-sm font-medium text-[#344054] transition hover:bg-gray-50 active:bg-gray-50 sm:w-auto sm:border-solid sm:shadow-sm"
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

        {/* Save bar stays pinned while scrolling the long form: above the
            phone tab bar, at the viewport bottom on desktop. Errors show
            here so they're never off-screen. */}
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-[#E4E7EC] bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:bottom-0 lg:-mx-8 lg:px-8">
          {error ? (
            <p
              role="alert"
              className="mb-3 rounded-lg bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]"
            >
              {error}
            </p>
          ) : null}
          <div className="flex items-center gap-3 lg:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                isEdit ? router.push("/products") : submit("draft")
              }
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-[#344054] ring-1 ring-inset ring-[#D0D5DD] transition hover:bg-gray-50 disabled:opacity-60 lg:h-11 lg:flex-none"
            >
              {isEdit ? "Hủy" : "Lưu nháp"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => submit("publish")}
              className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-lg bg-[#b08560] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8a6647] disabled:bg-[#d8c3ad] lg:h-11 lg:flex-none"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Đang lưu...
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
