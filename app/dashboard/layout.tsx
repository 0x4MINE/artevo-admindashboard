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
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentUser={currentUser} />
      <div className="flex flex-col flex-1 overflow-auto">
        <Navbar />
        {children}
      </div>
    </div>
  );

  {
    /* <SidebarProvider className="">
  //     <AppSidebar />
  //   </SidebarProvider>*/
  }
}
