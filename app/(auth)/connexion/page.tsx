import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { login } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Connexion · MuscleMap" };

export default async function LoginPage() {
  // getCurrentUser plutôt que le seul jeton : un cookie valide dont le compte
  // a disparu ferait sinon une boucle de redirection avec requireUser().
  if (await getCurrentUser()) redirect("/");
  return <AuthForm action={login} mode="login" />;
}
