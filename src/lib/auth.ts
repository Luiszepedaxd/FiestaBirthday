import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const ADMIN_EMAIL = "luis.j20000@gmail.com";

export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      setIsAdmin(data.user?.email === ADMIN_EMAIL);
      setIsLoading(false);
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, isLoading };
}
