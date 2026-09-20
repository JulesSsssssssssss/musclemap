import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { register } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Inscription · MuscleMap" };

export default async function RegisterPage() {
  // getCurrentUser plutôt que le seul jeton : un cookie valide dont le compte
  // a disparu ferait sinon une boucle de redirection avec requireUser().
  if (await getCurrentUser()) redirect("/");
  return <AuthForm action={register} mode="register" />;
}
