import { redirect } from "next/navigation";

// Redirect root to the public registration page
export default function HomePage() {
  redirect("/register");
}
