import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardHeader } from "@/components/fiestamas/DashboardHeader";
import { BirthdayHeroCard } from "@/components/fiestamas/BirthdayHeroCard";
import { UpcomingBirthdays } from "@/components/fiestamas/UpcomingBirthdays";
import { SuggestionEngine } from "@/components/fiestamas/SuggestionEngine";
import { ContactsList } from "@/components/fiestamas/ContactsList";
import { PartyOrganizerCard } from "@/components/fiestamas/PartyOrganizerCard";
import { InvitationBuilder } from "@/components/fiestamas/InvitationBuilder";
import { todayBirthday, upcomingBirthdays } from "@/lib/mock-data";

type Tab = "birthdays" | "invitations";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("birthdays");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <AnimatePresence mode="wait">
          {activeTab === "birthdays" ? (
            <motion.div
              key="birthdays"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="mt-8 space-y-6"
            >
              <BirthdayHeroCard contact={todayBirthday} />

              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <SuggestionEngine contact={todayBirthday} />
                </div>
                <div className="lg:col-span-3">
                  <PartyOrganizerCard contact={todayBirthday} />
                </div>
              </div>

              <UpcomingBirthdays contacts={upcomingBirthdays} />

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 text-lg font-semibold tracking-display text-foreground">
                  Tus Contactos
                </h3>
                <ContactsList />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="invitations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="mt-8"
            >
              <InvitationBuilder />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
