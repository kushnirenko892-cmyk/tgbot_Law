import { Keyboard } from "grammy";

export const MAIN_MENU_LABELS = {
  personalConsultation: "Записаться лично",
  situationDescription: "Описать ситуацию",
  loyalty: "Узнать о системе лояльности (в разработке)",
  contacts: "Контакты"
} as const;

export function mainMenu(): Keyboard {
  return new Keyboard()
    .text(MAIN_MENU_LABELS.personalConsultation)
    .text(MAIN_MENU_LABELS.situationDescription)
    .row()
    .text(MAIN_MENU_LABELS.loyalty)
    .text(MAIN_MENU_LABELS.contacts)
    .resized();
}
