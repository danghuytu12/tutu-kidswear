import { notFound } from "next/navigation";
import { getProductById } from "@repo/ui/lib/db/repositories/products";
import { ProductForm } from "@/components/ProductForm";

// Loads the product from the shared DB at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return <ProductForm initial={product} />;
}
