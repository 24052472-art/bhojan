"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<any>(null);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function determineRole() {
      // 1. PRIORITY: CHECK STAFF SESSION (FOR WAITERS/KITCHEN)
      const staffSessionStr = localStorage.getItem("staff_session");
      if (staffSessionStr) {
        try {
          const staff = JSON.parse(staffSessionStr);
          if (staff.role) {
            setRole(staff.role);
            return; // Exit early if staff session is active
          }
        } catch (e) {}
      }

      // 2. FALLBACK: URL-BASED DETECTION (ELIMINATES FLASH)
      if (pathname.startsWith('/dashboard/waiter')) {
        setRole("waiter");
        return;
      } else if (pathname.startsWith('/dashboard/kitchen')) {
        setRole("kitchen");
        return;
      }

      // 3. FINAL CHECK: FIREBASE AUTH (FOR OWNERS/SUPER ADMINS)
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (fbUser) {
          try {
            const { data } = await supabase
              .from("user_profiles")
              .select("role")
              .eq("id", fbUser.uid)
              .single();
            
            if (data?.role) setRole(data.role);
            else if (fbUser.email?.toLowerCase() === "aalokkushwaha285@gmail.com") setRole("super_admin");
          } catch (e) {
            if (fbUser.email?.toLowerCase() === "aalokkushwaha285@gmail.com") setRole("super_admin");
          }
        } else {
           // If no firebase and no staff session, we default to something or stay null
           if (!role) setRole(null);
        }
      });
      return () => unsubscribe();
    }

    determineRole();
  }, [supabase, pathname]);

  // BOUNCE UNAUTHORIZED STAFF
  useEffect(() => {
    if (role === 'waiter') {
      const allowed = ['/dashboard/waiter', '/dashboard/admin/menu', '/dashboard/admin/orders'];
      if (!allowed.some(p => pathname.startsWith(p))) {
        router.replace('/dashboard/waiter');
      }
    }
  }, [role, pathname, router]);

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden">
      {role && <Sidebar role={role} />}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
