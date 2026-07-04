const MESSAGE = "Freeship cho hóa đơn mua từ 2 sản phẩm trở lên";

export function AnnouncementBar() {
  // The text scrolls continuously. The track holds two identical copies and
  // animates by -50% so the loop is seamless (copy 2 arrives exactly where
  // copy 1 started). aria-hidden on the duplicate so screen readers read once.
  return (
    <div className="w-full overflow-hidden bg-[#fffdf4] py-2">
      <div className="animate-marquee flex w-max whitespace-nowrap">
        {[0, 1].map((i) => (
          <span
            key={i}
            aria-hidden={i === 1}
            className="font-display px-8 text-[20px] font-bold text-[#b08560]"
          >
            {MESSAGE}
          </span>
        ))}
      </div>
    </div>
  );
}
