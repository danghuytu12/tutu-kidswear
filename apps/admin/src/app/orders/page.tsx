import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function OrdersPage() {
  return (
    <PagePlaceholder
      title="Đơn hàng"
      description="Quản lý và theo dõi đơn hàng của khách."
    >
      <p className="text-[15px] text-black/40">Chưa có đơn hàng nào.</p>
    </PagePlaceholder>
  );
}
