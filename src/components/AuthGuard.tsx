import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type AuthGuardProps = {
  children: ReactNode;
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data.session));
      setIsChecking(false);
    };

    void checkSession();
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
