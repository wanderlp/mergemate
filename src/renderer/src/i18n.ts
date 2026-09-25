import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es.json'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'

function syncHtmlLang(lng: string | undefined): void {
  const short = (lng ?? 'es').split('-')[0] ?? 'es'
  document.documentElement.lang = short
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      pt: { translation: pt }
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'de', 'fr', 'pt'],
    load: 'languageOnly',        // 'es-ES' → 'es'
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mergemate-language'
    },
    interpolation: {
      escapeValue: false
    }
  })

syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
