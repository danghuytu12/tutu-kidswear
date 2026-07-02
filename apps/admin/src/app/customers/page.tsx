import { PagePlaceholder } from "@/components/PagePlaceholder";

export default function CustomersPage() {
  return (
    <PagePlaceholder
      title="Khách hàng"
      description="Danh sách và thông tin khách hàng."
    >
      <p className="text-[15px] text-black/40">Chưa có khách hàng nào.</p>
    </PagePlaceholder>
  );
}
