// src/app/(dashboard)/admin-dashboard/products/edit/[id]/page.js
import EditProductClient from "./EditProductClient";

export default async function EditProductPage({ params }) {
  const { id } = await params; // ✅ unwrap Promise
  return <EditProductClient id={id} />;
}
