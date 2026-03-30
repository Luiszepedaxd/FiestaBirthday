import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

const registerSchema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirma tu contraseña"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type RegisterValues = z.infer<typeof registerSchema>;
type LoginValues = z.infer<typeof loginSchema>;
type AuthTab = "register" | "login";

type AuthLocationState = {
  tab?: AuthTab;
};

function tabFromSearch(search: string): AuthTab | null {
  const param = new URLSearchParams(search).get("tab");
  if (param === "register" || param === "login") return param;
  return null;
}

/** Rutas dedicadas /login y /signup (sin depender de ?tab=). */
function tabFromPathname(pathname: string): AuthTab | null {
  if (pathname === "/signup") return "register";
  if (pathname === "/login") return "login";
  return null;
}

function deriveActiveTab(
  pathname: string,
  search: string,
  stateTab: AuthTab | undefined,
): AuthTab {
  const fromPath = tabFromPathname(pathname);
  if (fromPath) return fromPath;
  const fromSearch = tabFromSearch(search);
  if (fromSearch) return fromSearch;
  if (stateTab === "register") return "register";
  return "login";
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateTab = (location.state as AuthLocationState | null)?.tab;
  const [activeTab, setActiveTab] = useState<AuthTab>(() =>
    deriveActiveTab(location.pathname, location.search, stateTab),
  );

  useEffect(() => {
    setActiveTab(deriveActiveTab(location.pathname, location.search, stateTab));
  }, [location.pathname, location.search, stateTab]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onRegister = async (values: RegisterValues) => {
    setRegisterError(null);
    setRegisterSuccess(null);
    setRegisterLoading(true);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    setRegisterLoading(false);

    if (error) {
      setRegisterError(error.message);
      return;
    }

    setRegisterSuccess("Revisa tu email para confirmar tu cuenta");
    registerForm.reset();
  };

  const onLogin = async (values: LoginValues) => {
    setLoginError(null);
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    setLoginLoading(false);

    if (error) {
      setLoginError(error.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-border bg-card p-6">
          <h1 className="text-center text-2xl font-bold text-foreground">Fiestamas</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Accede a tu cuenta para continuar</p>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AuthTab)}
            className="mt-6 w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="mt-5">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input id="register-email" type="email" {...registerForm.register("email")} />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input id="register-password" type="password" {...registerForm.register("password")} />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    {...registerForm.register("confirmPassword")}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {registerError && <p className="text-sm text-destructive">{registerError}</p>}
                {registerSuccess && <p className="text-sm text-foreground">{registerSuccess}</p>}

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input id="login-password" type="password" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {loginError && <p className="text-sm text-destructive">{loginError}</p>}

                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
