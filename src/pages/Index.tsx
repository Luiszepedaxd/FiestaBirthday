import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen items-center justify-center px-4">
        <main className="flex w-full max-w-md flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Fiestamas</h1>
          <p className="mt-3 text-base text-muted-foreground">Nunca olvides un cumpleaños importante</p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate("/auth", { state: { tab: "register" } })}
            >
              Crear cuenta
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate("/auth", { state: { tab: "login" } })}
            >
              Iniciar sesión
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
