import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth/getSessionUser";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar currentUser={currentUser} />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <div className="flex-shrink-0">
          <Navbar />
        </div>
        <main className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-x-hidden ">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
