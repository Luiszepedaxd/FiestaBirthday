type LegalPlaceholderProps = {
  title: string;
};

/** Páginas legales pendientes de contenido; evita 404 desde enlaces del footer. */
export default function LegalPlaceholder({ title }: LegalPlaceholderProps) {
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <h1 className="text-xl font-semibold">{title}</h1>
    </div>
  );
}
