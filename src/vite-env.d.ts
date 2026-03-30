/// <reference types="vite/client" />

/** Contact Picker API (Chrome Android, etc.) */
interface ContactPickerContact {
  name?: string[];
  tel?: string[];
}

interface Navigator {
  contacts?: {
    select(
      properties: string[],
      options?: { multiple?: boolean },
    ): Promise<ContactPickerContact[]>;
  };
}

interface Window {
  ContactsManager?: unknown;
}
