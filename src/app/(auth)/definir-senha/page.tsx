import { redirect } from "next/navigation";

// Senhas são definidas e redefinidas exclusivamente pelo administrador.
// Mantemos a rota para não quebrar links antigos, mas ela não expõe alteração direta.
export default function SetPasswordPage() {
  redirect("/login");
}
