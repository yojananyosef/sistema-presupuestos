import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/config";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();

  if (!sesion?.user) {
    redirect("/login");
  }

  const supabase = await crearClienteServidor();
  const { data: configRows } = await supabase
    .from("configuracion")
    .select("clave, valor")
    .in("clave", ["empresa_nombre", "pdf_logo_url"]);

  const configMap = Object.fromEntries(
    (configRows ?? []).map((r: { clave: string; valor: string }) => [r.clave, r.valor])
  );
  const nombreEmpresa = configMap["empresa_nombre"] || "Zinc Industrial";
  const logoUrl = configMap["pdf_logo_url"] || "";

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar rol={sesion.user.rol} nombreEmpresa={nombreEmpresa} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          nombreUsuario={sesion.user.nombre}
          emailUsuario={sesion.user.email}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
