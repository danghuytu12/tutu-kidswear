import type { ReactNode } from "react";
import { ChevronRight, ChevronDown, Minus, Plus, Upload } from "lucide-react";

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
}: {
  label: string;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <div>
      <Label text={label} />
      <input
        type={type}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/20"
      />
    </div>
  );
}

function SelectField({
  label,
  placeholder,
  options,
}: {
  label: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <div>
      <Label text={label} />
      <div className="relative">
        <select
          defaultValue=""
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

export default function AddProductPage() {
  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#1D2939]">Add Products</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#667085]">Home</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">Add Products</span>
        </div>
      </div>

      <div className="space-y-6">
        <SectionCard title="Products Description">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField label="Product Name" placeholder="Enter product name" />
              <SelectField
                label="Category"
                placeholder="Select a category"
                options={["Laptop", "Phone", "Watch", "Electronics", "Accessories"]}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SelectField
                label="Brand"
                placeholder="Select brand"
                options={["Apple", "Samsung", "LG"]}
              />
              <SelectField
                label="Color"
                placeholder="Select color"
                options={["Silver", "Black", "White", "Gray"]}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <TextField label="Weight(KG)" type="number" placeholder="15" />
              <TextField label="Length(CM)" type="number" placeholder="120" />
              <TextField label="Width(CM)" type="number" placeholder="23" />
            </div>
            <div>
              <Label text="Description" />
              <textarea
                rows={6}
                placeholder="Receipt Info (optional)"
                className="w-full rounded-lg border border-[#D0D5DD] bg-transparent px-4 py-2.5 text-sm text-[#1D2939] shadow-sm placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pricing & Availability">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <TextField label="Weight(KG)" type="number" placeholder="15" />
              <TextField label="Length(CM)" type="number" placeholder="120" />
              <TextField label="Width(CM)" type="number" placeholder="23" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 inline-block text-sm font-semibold text-[#344054]">
                  Stock Quantity
                </label>
                <div className="flex h-11 divide-x divide-[#D0D5DD] overflow-hidden rounded-lg border border-[#D0D5DD]">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#344054] transition hover:bg-gray-100"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    className="h-11 w-full border-0 bg-transparent px-3 text-center text-sm text-[#1D2939] focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
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
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Products Images">
          <div className="shadow-sm block cursor-pointer rounded-lg border-2 border-dashed border-[#D0D5DD] transition hover:border-[#465FFF]">
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#E4E7EC] text-[#344054]">
                <Upload className="h-5 w-5" />
              </span>
              <p className="mt-4 text-center text-sm text-[#667085]">
                <span className="font-medium text-[#1D2939]">Click to upload</span> or drag and drop SVG, PNG, JPG or GIF (MAX. 800x400px)
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-medium bg-white text-[#344054] ring-1 ring-inset ring-[#D0D5DD] transition hover:bg-gray-50"
          >
            Draft
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-medium text-white bg-[#465FFF] shadow-sm transition hover:bg-[#3641F5]"
          >
            Publish Product
          </button>
        </div>
      </div>
    </div>
  );
}
