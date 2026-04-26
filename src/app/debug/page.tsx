"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDebug() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData({ error: "No user found" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setData({ user, profile });
    }
    fetchDebug();
  }, []);

  return (
    <div className="p-10 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Auth Debugger</h1>
      <pre className="bg-black p-4 rounded-xl overflow-auto max-h-[80vh]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
