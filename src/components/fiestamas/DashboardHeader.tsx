import { Cake, CalendarPlus } from "lucide-react";

interface Props {
  activeTab: "birthdays" | "invitations";
  onTabChange: (tab: "birthdays" | "invitations") => void;
}

export function DashboardHeader({ activeTab, onTabChange }: Props) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-display text-foreground md:text-3xl">
          Fiestamas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organiza tu próximo evento en segundos, no horas.
        </p>
      </div>
      <nav className="flex rounded-full border border-border bg-card p-1">
        <TabButton
          active={activeTab === "birthdays"}
          onClick={() => onTabChange("birthdays")}
          icon={<Cake className="h-4 w-4" />}
          label="Cumpleaños"
        />
        <TabButton
          active={activeTab === "invitations"}
          onClick={() => onTabChange("invitations")}
          icon={<CalendarPlus className="h-4 w-4" />}
          label="Invitaciones"
        />
      </nav>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
