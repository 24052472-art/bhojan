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
  const [isDeterminingRole, setIsDeterminingRole] = useState(true);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function determineRole() {
      // 0. QUICK CACHE CHECK
      const cachedRole = localStorage.getItem("bhojan_role");
      if (cachedRole && isMounted) setRole(cachedRole);

      // 1. PRIORITY: CHECK STAFF SESSION (FOR WAITERS/KITCHEN)
      const staffSessionStr = localStorage.getItem("staff_session");
      if (staffSessionStr) {
        try {
          const staff = JSON.parse(staffSessionStr);
          if (staff.role) {
            if (isMounted) {
              setRole(staff.role);
              localStorage.setItem("bhojan_role", staff.role);
              setIsDeterminingRole(false);
            }
            return;
          }
        } catch (e) {}
      }

      // 2. FALLBACK: URL-BASED DETECTION
      if (pathname.startsWith('/dashboard/waiter')) {
        if (isMounted) {
          setRole("waiter");
          setIsDeterminingRole(false);
        }
        return;
      } else if (pathname.startsWith('/dashboard/kitchen')) {
        if (isMounted) {
          setRole("kitchen");
          setIsDeterminingRole(false);
        }
        return;
      }

      // 3. FINAL CHECK: FIREBASE AUTH
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (fbUser) {
          // Master Admin Fallback
          if (fbUser.email === "abhi.kush047@gmail.com") {
            if (isMounted) {
              setRole("super_admin");
              localStorage.setItem("bhojan_role", "super_admin");
              setIsDeterminingRole(false);
            }
            return;
          }

          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", fbUser.uid)
              .single();
            
            const detectedRole = data?.role || "owner";
            if (isMounted) {
              setRole(detectedRole);
              localStorage.setItem("bhojan_role", detectedRole);
              setIsDeterminingRole(false);
            }
          } catch (e) {
             if (isMounted) {
               setRole("owner");
               localStorage.setItem("bhojan_role", "owner");
               setIsDeterminingRole(false);
             }
          }
        } else {
          // If no user and not a waiter/kitchen session, maybe redirect to login
          if (isMounted) setIsDeterminingRole(false);
        }
      });
      return () => {
        isMounted = false;
        unsubscribe();
      };
    }

    determineRole();
  }, [supabase, pathname]);

  // BOUNCE UNAUTHORIZED STAFF
  useEffect(() => {
    if (!isDeterminingRole && role === 'waiter') {
      const allowed = ['/dashboard/waiter', '/dashboard/admin/menu', '/dashboard/admin/orders'];
      if (!allowed.some(p => pathname.startsWith(p))) {
        router.replace('/dashboard/waiter');
      }
    }
  }, [role, pathname, router, isDeterminingRole]);

  if (isDeterminingRole) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary font-black uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Suite</p>
        </div>
      </div>
    );
  }

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
