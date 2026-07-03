export function ProductDescription({ html }: { html?: string } = {}) {
  // When the DB product has a rich-text description, render it; otherwise fall
  // back to the static default copy below.
  if (html) {
    return (
      <section
        className="cocandy-container rich-text py-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <section className="cocandy-container space-y-3 py-8 text-[16px] leading-relaxed text-black">
      <p className="font-bold">Thời Trang Tutu Kidswear</p>
      <p>Comfy, Sweet and Happy!</p>
      <p>Tại sao bạn nên quyết định chọn đồ cho bé của Tutu Kidswear:</p>
      <p>
        - Sản phẩm được thiết kế và sản xuất tại Việt Nam bởi Tutu Kidswear
      </p>
      <p>
        - Chất liệu sản phẩm được chọn lọc kỹ càng đảm bảo an toàn cho làn da em
        bé
      </p>
      <p>
        - Kiểu dáng, quy cách được lên bởi đội ngũ thiết kế có kinh nghiệm phù
        hợp với khí hậu Việt Nam
      </p>
      <p>
        - Mẫu mã đa dạng, tính ứng dụng cao: mẹ có thể sử dụng cho bé đi dã
        ngoại, đi học, đi chơi...
      </p>
      <p className="font-bold">❤️THÔNG TIN SẢN PHẨM</p>
      <p>Thương hiệu: Tutu Kidswear</p>
      <p>Xuất xứ: Việt Nam</p>
      <p>Mã sản phẩm: E2051</p>
      <p>
        Chất liệu: Áo cộc cotton vân mỏng NÂU tay raclan E2051 chất cotton vân
        mỏng, kết cấu thoáng mát thấm hút mồ hôi tốt phù hợp mùa hè.
      </p>
      <p>
        LƯU Ý: Sản phẩm chỉ gồm lẻ Áo cộc cotton vân mỏng NÂU tay raclan E2051
        chưa bao gồm phụ kiện đi kèm.
      </p>
    </section>
  );
}
