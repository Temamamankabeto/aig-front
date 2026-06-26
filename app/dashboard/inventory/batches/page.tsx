import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/inventory/items?tab=batches");
}
