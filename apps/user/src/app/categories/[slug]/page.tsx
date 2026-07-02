import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { Breadcrumb } from "@/components/category/Breadcrumb";
import { CategoryLayout } from "@/components/category/CategoryLayout";

export default function CategoryPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <Breadcrumb />
      <CategoryLayout />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
