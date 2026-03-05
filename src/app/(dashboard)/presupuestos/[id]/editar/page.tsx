import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth/config";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { FormularioPresupuesto } from "@/components/presupuestos/formulario-presupuesto";
import type { ItemPresupuesto } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarPresupuestoPage({ params }: Props) {
  const session = await obtenerSesion();
  if (!session) redirect("/login");

  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .single();

  if (!presupuesto) redirect("/presupuestos");

  if (presupuesto.estado !== "borrador" && session.user.rol !== "admin") {
    redirect(`/presupuestos/${id}`);
  }

  const datosIniciales = {
    clienteNombre: presupuesto.cliente_nombre,
    clienteRut: presupuesto.cliente_rut,
    clienteEmail: presupuesto.cliente_email,
    clienteTelefono: presupuesto.cliente_telefono,
    clienteDireccion: presupuesto.cliente_direccion,
    descripcion: presupuesto.descripcion,
    items: presupuesto.items as ItemPresupuesto[],
    tiempoEjecucion: presupuesto.tiempo_ejecucion,
    condiciones: presupuesto.condiciones,
    estado: presupuesto.estado,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Editar Presupuesto {presupuesto.correlativo ? `PRE-${String(presupuesto.correlativo).padStart(6, "0")}` : ""}
      </h1>
      <FormularioPresupuesto presupuestoId={id} datosIniciales={datosIniciales} />
    </div>
  );
}
