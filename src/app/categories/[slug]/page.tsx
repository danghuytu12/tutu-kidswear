import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingWidgets } from "@/components/FloatingWidgets";
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
