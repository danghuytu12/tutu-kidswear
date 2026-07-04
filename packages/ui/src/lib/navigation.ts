import type { MegaMenu, NavLink, SizeOption, FooterColumn } from "@repo/ui/lib/types";

// Top nav bar links (order matters). Items with `menu` have a mega-menu.
export const beTraiMenu: MegaMenu = {
  label: "Bé Trai",
  href: "/categories/be-trai",
  groups: [
    {
      title: "Áo",
      links: [
        { label: "Áo cộc tay", href: "/categories/ao-coc-tay-1" },
        { label: "Áo dài tay", href: "/categories/ao-dai-tay-1" },
        { label: "Áo sơ mi", href: "/categories/ao-so-mi-1" },
        { label: "Áo khoác", href: "/categories/ao-khoac-trai-1" },
      ],
    },
    {
      title: "Quần",
      links: [
        { label: "Quần cộc", href: "/categories/quan-coc-1" },
        { label: "Quần dài", href: "/categories/quan-dai-trai" },
        { label: "Quần yếm", href: "/categories/quan-yem" },
      ],
    },
    {
      title: "Đồ Bộ",
      links: [
        { label: "Đồ bộ ngắn tay", href: "/categories/do-bo-ngan-tay-1" },
        { label: "Đồ bộ dài tay", href: "/categories/do-bo-dai-tay-1" },
      ],
    },
    {
      title: "Phụ Kiện",
      links: [
        { label: "Đồ lót", href: "/categories/do-lot" },
        { label: "Giày dép", href: "/categories/giay-dep" },
        { label: "Tất/ Găng tay", href: "/categories/tat-gang-tay-trai" },
        { label: "Kính/Mũ/Cà vạt", href: "/categories/kinh-mu-ca-vat" },
      ],
    },
  ],
};

export const beGaiMenu: MegaMenu = {
  label: "Bé Gái",
  href: "/categories/be-gai",
  groups: [
    {
      title: "Đầm váy",
      links: [
        { label: "Váy cộc tay", href: "/categories/vay-coc-tay" },
        { label: "Váy dài tay", href: "/categories/vay-dai-tay" },
        { label: "Chân váy", href: "/categories/chan-vay" },
        { label: "Yếm - Yếm váy", href: "/categories/yem-vay-yem" },
      ],
    },
    {
      title: "Áo",
      links: [
        { label: "Áo cộc tay", href: "/categories/ao-coc-tay-gai" },
        { label: "Áo dài tay", href: "/categories/ao-dai-tay" },
        { label: "Áo sơ mi", href: "/categories/ao-so-mi" },
        { label: "Áo khoác", href: "/categories/ao-khoac-gai" },
      ],
    },
    {
      title: "Quần",
      links: [
        { label: "Quần cộc", href: "/categories/quan-coc" },
        { label: "Quần dài", href: "/categories/quan-dai" },
      ],
    },
    {
      title: "Đồ bộ",
      links: [
        { label: "Đồ bộ ngắn tay", href: "/categories/do-bo-ngan-tay" },
        { label: "Đồ bộ dài tay", href: "/categories/do-bo-dai-tay" },
      ],
    },
    {
      title: "Phụ kiện",
      links: [
        { label: "Quần lót", href: "/categories/quan-lot" },
        { label: "Tất/ Găng tay", href: "/categories/tat-gang-tay-gai" },
        { label: "Giày dép", href: "/categories/giay-dep-1" },
        { label: "Kính/Mũ/Cà vạt", href: "/categories/kinh-mu-ca-vat-gai" },
      ],
    },
  ],
};

export const bstMenu: MegaMenu = {
  label: "Bộ Sưu Tập",
  href: "/categories/bst",
  groups: [
    {
      title: "Bộ Sưu Tập",
      links: [
        { label: "BST Noel", href: "/categories/bst-noel" },
        { label: "BST Đi Học", href: "/categories/bst-di-hoc" },
        { label: "BST Gia Đình", href: "/categories/bst-gia-dinh" },
        { label: "BST Dự Tiệc", href: "/categories/bst-mellow-candy" },
        { label: "BST Đồ Bơi", href: "/categories/bst-do-boi" },
        { label: "Trang Phục Truyền Thống", href: "/categories/trang-phuc-truyen-thong" },
      ],
    },
  ],
};

// Bé Trai / Bé Gái are plain links (no dropdown, no chevron).
export const megaMenus: MegaMenu[] = [];

// Simple (no-dropdown) nav links, in bar order.
export const simpleNavLinks: NavLink[] = [
  { label: "Trang Chủ", href: "/" },
  { label: beTraiMenu.label, href: beTraiMenu.href },
  { label: beGaiMenu.label, href: beGaiMenu.href },
];

// Category quick-links row on the homepage (circular product tiles).
export const quickCategoryTiles = [
  { name: "Áo cộc cotton XANH thêu nơ", href: "/products/ao-coc-cotton-xanh-theu-no", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/c4/92/4b/ec/399d689bebf1ceaee4d19bee977730e85810f39589ff3b0affb5a9dd-w:1920-h:1920-l:2120575-t:image/jpeg.jpeg" },
  { name: "Áo cộc cotton vân mỏng NÂU tay raclan", href: "/products/ao-coc-cotton-van-mong-nau-tay-raclan", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/a8/2e/40/2d/c6985bd13c2abd19969ab5fcba3611fe4c1a847d8fe0812bd07cd955-w:1280-h:1280-l:178611-t:image/jpeg.jpeg" },
  { name: "Áo cộc cotton HỒNG nhún bèo cổ phối nơ", href: "/products/ao-coc-cotton-hong-nhun-beo-co-phoi-no", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/0f/22/d7/4e/809dcf5fcd34b26a52f0c68ef48175042268802cfaa19255266d6125-w:2048-h:2048-l:2645165-t:image/jpeg.jpeg" },
  { name: "Áo cộc cotton kẻ XANH hình voi", href: "/products/ao-coc-cotton-ke-xanh-hinh-voi", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/4f/45/f3/95/3c4f490c1ac7d2e734b78a93e0b43e6cda2a71e8d3b7173b7ee8149d-w:1920-h:1920-l:6056988-t:image/png.png" },
  { name: "Áo cộc jeans XANH phối cổ sọc kẻ", href: "/products/ao-coc-jeans-xanh-phoi-co-soc-ke", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/1c/2d/fa/c1/f648663305123a185a0f5532d97706582f5c58b819162124ffad94d8-w:2048-h:2048-l:3699564-t:image/png.png" },
  { name: "Váy sát nách thô VÀNG cổ nơ 2 tầng", href: "/products/vay-sat-nach-tho-vang-co-no-2-tang", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/d2/3a/38/e0/e72fa489abd2f75680cca45fd84b46b225135b74bbb15585c1184514-w:2048-h:2048-l:5193571-t:image/png.png" },
  { name: "Áo cộc sơ mi kẻ VÀNG phối turban cổ", href: "/products/ao-coc-so-mi-ke-vang-phoi-turban-co", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/90/d1/ea/a8/fd3cc850108b6c078b8934674311a92814247962a51808c76d2889e2-w:2048-h:2048-l:3504844-t:image/png.png" },
  { name: "Váy sát nách linen TRẮNG hoa nhí xanh cổ nơ", href: "/products/vay-sat-nach-linen-trang-hoa-nhi-xanh-co-no", img: "https://content.pancake.vn/web-media-262/s700x700/fwebp90/52/5a/43/7f/d9f8642811bd26dc15d1794a1037d5cc579216179ad6bd626f8f15ff-w:2048-h:2048-l:3949384-t:image/png.png" },
];

// Category page size filter options (with weight ranges).
export const sizeOptions: SizeOption[] = [
  { label: "66", weight: "5 - 8 kg" },
  { label: "73", weight: "8 - 10 kg" },
  { label: "80", weight: "10 - 12 kg" },
  { label: "90", weight: "12 - 14 kg" },
  { label: "100", weight: "14 - 16 kg" },
  { label: "110", weight: "16 - 19 kg" },
  { label: "120", weight: "20 - 24 kg" },
  { label: "130", weight: "25 - 30 kg" },
  { label: "140", weight: "30 - 35 kg" },
  { label: "150", weight: "35 - 40 kg" },
];

export const priceFilterOptions: string[] = [
  "Giá dưới 100.000đ",
  "100.000đ - 200.000đ",
  "200.000đ - 300.000đ",
  "Giá trên 300.000đ",
];

// Footer columns + contact info.
export const footerColumns: FooterColumn[] = [
  {
    title: "CHÍNH SÁCH",
    links: [
      "Chính sách đổi hàng",
      "Chính sách giao hàng và kiểm hàng",
      "Chính sách khách hàng thân thiết",
      "Chính sách bảo mật",
      "Chính sách thanh toán",
    ],
  },
  {
    title: "CHĂM SÓC KHÁCH HÀNG",
    links: [
      "Hướng dẫn chọn size",
      "Tra cứu đơn hàng",
      "Về Tutu Kidswear",
    ],
  },
];

export const footerContact = {
  blurbTitle: "Tutu Kidswear lắng nghe bạn!",
  blurb:
    "Chúng tôi luôn trân trọng và mong đợi nhận được mọi ý kiến đóng góp từ khách hàng để có thể nâng cấp trải nghiệm dịch vụ và sản phẩm tốt hơn nữa.",
  businessName: "HỘ KINH DOANH",
  office:
    "Văn phòng Hà Nội: Vị trí 14, Biệt thự 8, Khu đô thị Xa La, Phường Phúc La, Quận Hà Đông, Thành Phố Hà Nội",
  legal:
    "Hộ kinh doanh Phạm Thị Lan Anh 1990. Mã số: 8743585593. Giấy chứng nhận đăng kí hộ kinh doanh được UBND Quận Hà Đông cấp lần đầu ngày 04/06/2024",
  hotline: "3213213 (8:30 - 23:00)",
  email: "huytu@gmail.com",
};
