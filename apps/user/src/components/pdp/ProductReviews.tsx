import { StarIcon } from "@repo/ui/components/icons";

export function ProductReviews() {
  return (
    <section className="cocandy-container border-t py-8">
      <h2 className="text-[20px] font-bold">Đánh giá</h2>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[28px] font-bold">0.0</span>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-5 w-5 text-[#e3e3e3]" />
          ))}
        </div>
        <span className="text-[14px] text-[#777]">(0 bài đánh giá)</span>
      </div>
      <p className="mt-4 text-[14px]">Hãy chia sẻ suy nghĩ của bạn.</p>
      <div className="mt-2 rounded border border-black/15 px-4 py-3 text-[14px] text-[#999]">
        Viết đánh giá của bạn...
      </div>
    </section>
  );
}
