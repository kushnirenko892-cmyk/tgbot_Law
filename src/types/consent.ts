export interface ConsentRecord {
  id: string;
  clientId: string | null;
  telegramId: string;
  consentTextVersion: string;
  source: string;
  acceptedAt: Date;
  personalDataPolicyUrl: string;
  userAgreementUrl: string;
  personalDataConsentUrl: string;
  publicOfferUrl: string;
}
