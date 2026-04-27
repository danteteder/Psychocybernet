import { redirect } from "next/navigation";

// Root page redirects to the weekly planner
export default function Home() {
  redirect("/week");
}
