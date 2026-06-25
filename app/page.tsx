import { redirect } from "next/navigation";

// The root is the staff portal entry point. There is no self-service survey —
// respondents reach the survey only through their enumerator's link (/s/[code]).
// /portal gates the session: unauthenticated → /portal/login, signed-in staff →
// their role-scoped dashboard.
export default function Home() {
  redirect("/portal");
}
