import { useIntake } from "../context/IntakeContext";
import { getTranslation } from "./translations";

// Usage: const t = useTranslation(); <h1>{t.consent.title}</h1>
export default function useTranslation() {
  const { language } = useIntake();
  return getTranslation(language);
}