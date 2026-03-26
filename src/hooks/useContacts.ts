import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  birthday: string;
};

type ContactWithMeta = Contact & {
  daysUntilBirthday: number;
  nextBirthdayDate: Date;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const buildNextBirthdayDate = (birthday: string, now: Date) => {
  const parsed = new Date(birthday);
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const currentYear = now.getFullYear();
  const thisYearBirthday = new Date(currentYear, month, day);
  const today = startOfDay(now);
  return thisYearBirthday < today ? new Date(currentYear + 1, month, day) : thisYearBirthday;
};

const daysUntil = (date: Date, now: Date) => {
  const diff = startOfDay(date).getTime() - startOfDay(now).getTime();
  return Math.round(diff / MS_PER_DAY);
};

export const useContacts = () => {
  const query = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return [] as Contact[];
      }

      const { data, error } = await supabase
        .from("contacts")
        .select("id, user_id, name, phone, birthday")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      return (data ?? []) as Contact[];
    },
  });

  const computed = useMemo(() => {
    const now = new Date();
    const contactsWithMeta: ContactWithMeta[] = (query.data ?? []).map((contact) => {
      const nextBirthdayDate = buildNextBirthdayDate(contact.birthday, now);
      return {
        ...contact,
        nextBirthdayDate,
        daysUntilBirthday: daysUntil(nextBirthdayDate, now),
      };
    });

    const todayBirthdays = contactsWithMeta.filter((contact) => contact.daysUntilBirthday === 0);
    const upcomingWeekBirthdays = contactsWithMeta
      .filter((contact) => contact.daysUntilBirthday > 0 && contact.daysUntilBirthday <= 7)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    const orderedContacts = [...contactsWithMeta].sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    return { todayBirthdays, upcomingWeekBirthdays, orderedContacts };
  }, [query.data]);

  return {
    ...query,
    ...computed,
  };
};
