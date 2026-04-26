import { useAuthStore } from "@/features/auth/store";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DataTable } from "@/components/data-table";
import sampleData from "@/app/dashboard/data.json";

export default function DashboardScreen() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="grid auto-rows-min gap-6 md:grid-cols-3 mt-4">
             <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Bienvenido,</p>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
             </div>
             <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">Rol de Usuario</p>
                <h2 className="text-2xl font-bold capitalize">{user.role}</h2>
                <p className="text-sm text-green-500 font-medium">Activo</p>
             </div>
             <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                {/* Vacío para futuros datos */}
             </div>
          </div>
          
          <div className="min-h-[100vh] flex-1 rounded-xl bg-card border border-border md:min-h-min p-6">
             <h3 className="text-lg font-bold mb-4">Actividad Reciente</h3>
             <DataTable data={sampleData} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
