export interface TelegramUserProfile {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface ClientRecord {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;
  telegramLink: string;
  phone: string | null;
  email: string | null;
  loyaltyPoints: number;
  loyaltyLevel: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
