export interface Contact {
  id: string;
  name: string;
  initials: string;
  birthday: string; // MM-DD
  birthdayFull: string; // display
  avatar?: string;
  interests: string[];
  isSynced: boolean;
  lastGiftNote?: string;
}

export interface EventInvitation {
  id: string;
  title: string;
  type: "cumpleaños" | "boda" | "graduación" | "baby shower" | "reunión" | "otro";
  date: string;
  time: string;
  location: string;
  description: string;
  rsvpCount: number;
}

const today = new Date();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Sofía Hernández",
    initials: "SH",
    birthday: `${mm}-${dd}`,
    birthdayFull: `${dd}/${mm}`,
    interests: ["Rock de los 80", "Yoga", "Café artesanal"],
    isSynced: true,
    lastGiftNote: "Le regalaste flores el año pasado",
  },
  {
    id: "2",
    name: "Carlos Méndez",
    initials: "CM",
    birthday: `${mm}-${String(Math.min(Number(dd) + 2, 28)).padStart(2, "0")}`,
    birthdayFull: `${String(Math.min(Number(dd) + 2, 28)).padStart(2, "0")}/${mm}`,
    interests: ["Fútbol", "Asados", "Tecnología"],
    isSynced: true,
  },
  {
    id: "3",
    name: "Ana Rodríguez",
    initials: "AR",
    birthday: `${mm}-${String(Math.min(Number(dd) + 4, 28)).padStart(2, "0")}`,
    birthdayFull: `${String(Math.min(Number(dd) + 4, 28)).padStart(2, "0")}/${mm}`,
    interests: ["Lectura", "Vino", "Viajes"],
    isSynced: true,
  },
  {
    id: "4",
    name: "Diego López",
    initials: "DL",
    birthday: `${mm}-${String(Math.min(Number(dd) + 5, 28)).padStart(2, "0")}`,
    birthdayFull: `${String(Math.min(Number(dd) + 5, 28)).padStart(2, "0")}/${mm}`,
    interests: ["Gaming", "Anime", "Pizza"],
    isSynced: false,
  },
  {
    id: "5",
    name: "María Torres",
    initials: "MT",
    birthday: `${mm}-${String(Math.min(Number(dd) + 6, 28)).padStart(2, "0")}`,
    birthdayFull: `${String(Math.min(Number(dd) + 6, 28)).padStart(2, "0")}/${mm}`,
    interests: ["Cocina", "Jardinería", "Fotografía"],
    isSynced: true,
  },
];

export const todayBirthday = contacts[0];
export const upcomingBirthdays = contacts.slice(1);
