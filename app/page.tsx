import { redirect } from "next/navigation";
import { getOptionalAuthForPage } from "@/lib/auth";

export default async function HomePage() {
  const auth = await getOptionalAuthForPage();
  if (auth) {
    redirect("/practice/struggles");
  }
  redirect("/login");
}
