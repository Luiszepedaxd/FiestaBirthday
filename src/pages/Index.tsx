import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🎂</span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Fiestamas
          </h1>
          <p className="text-muted-foreground text-lg">
            Nunca olvides un cumpleaños importante
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/auth?tab=register")}
          >
            Crear cuenta
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/auth?tab=login")}
          >
            Iniciar sesión
          </Button>
        </div>

      </div>
    </div>
  );
}
