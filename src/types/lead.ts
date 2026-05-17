export type LeadType = "personal_consultation" | "situation_description" | "loyalty_interest";

export type LeadStatus = "new" | "contacted" | "booked" | "closed";

export interface LeadRecord {
  id: string;
  clientId: string | null;
  leadType: LeadType;
  message: string | null;
  status: LeadStatus;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeadInput {
  clientId: string;
  leadType: LeadType;
  message?: string | null;
  source?: string;
}
