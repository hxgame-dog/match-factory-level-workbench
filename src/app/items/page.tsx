import { redirect } from "next/navigation";

export default function ItemsPage() {
  redirect("/item-generator?tab=upload");
}
