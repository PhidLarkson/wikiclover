/**
 * Internationalization (i18n) System
 * Auto-detects device language and provides translations
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt'

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' }
]

// Translation dictionary
const translations: Record<SupportedLanguage, Record<string, string>> = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.search': 'Search',
        'nav.capture': 'Capture',
        'nav.favorites': 'Favorites',
        'nav.mine': 'Mine',
        'nav.settings': 'Settings',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.retry': 'Retry',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.follow': 'Follow',
        'common.following': 'Following',
        'common.unfollow': 'Unfollow',
        'common.uploads': 'Uploads',
        'common.images': 'images',
        'common.creators': 'creators',

        // Pages
        'home.featured': 'Featured',
        'home.recent': 'Recent',
        'home.nearby': 'Nearby',

        'search.placeholder': 'Search Wikimedia Commons...',
        'search.noResults': 'No results found',

        'favorites.title': 'Collections',
        'favorites.gallery': 'Gallery',
        'favorites.creators': 'Creators',
        'favorites.noImages': 'No saved images',
        'favorites.noCreators': 'No followed creators',

        'mine.drafts': 'Drafts',
        'mine.gallery': 'Gallery',
        'mine.noDrafts': 'No drafts',
        'mine.noUploads': 'No uploads yet',

        'settings.title': 'Settings',
        'settings.account': 'Account',
        'settings.accessibility': 'Accessibility',
        'settings.language': 'Language',
        'settings.display': 'Display',
        'settings.about': 'About',
        'settings.logout': 'Log Out',
        'settings.login': 'Log In',

        // Accessibility
        'a11y.reduceMotion': 'Reduce Motion',
        'a11y.reduceMotionDesc': 'Minimize animations and transitions',
        'a11y.highContrast': 'High Contrast',
        'a11y.highContrastDesc': 'Increase text and UI contrast',
        'a11y.largeText': 'Large Text',
        'a11y.largeTextDesc': 'Increase base font size',

        // Onboarding
        'onboarding.welcome': 'Welcome to Clover!',
        'onboarding.swipe': 'Swipe up/down to browse images',
        'onboarding.like': 'Tap the heart to save favorites',
        'onboarding.camera': 'Capture and upload to Commons',
        'onboarding.search': 'Search millions of free images',
        'onboarding.next': 'Next',
        'onboarding.skip': 'Skip',
        'onboarding.done': 'Get Started',

        // Install prompt
        'install.title': 'Install App',
        'install.description': 'Add to home screen for best experience',
        'install.later': 'Later',
        'install.install': 'Install'
    },
    es: {
        'nav.home': 'Inicio',
        'nav.search': 'Buscar',
        'nav.capture': 'Capturar',
        'nav.favorites': 'Favoritos',
        'nav.mine': 'Mío',
        'nav.settings': 'Ajustes',

        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.retry': 'Reintentar',
        'common.cancel': 'Cancelar',
        'common.save': 'Guardar',
        'common.delete': 'Eliminar',
        'common.follow': 'Seguir',
        'common.following': 'Siguiendo',
        'common.unfollow': 'Dejar de seguir',
        'common.uploads': 'Subidas',
        'common.images': 'imágenes',
        'common.creators': 'creadores',

        'home.featured': 'Destacado',
        'home.recent': 'Reciente',
        'home.nearby': 'Cercano',

        'search.placeholder': 'Buscar en Wikimedia Commons...',
        'search.noResults': 'Sin resultados',

        'favorites.title': 'Colecciones',
        'favorites.gallery': 'Galería',
        'favorites.creators': 'Creadores',
        'favorites.noImages': 'Sin imágenes guardadas',
        'favorites.noCreators': 'Sin creadores seguidos',

        'mine.drafts': 'Borradores',
        'mine.gallery': 'Galería',
        'mine.noDrafts': 'Sin borradores',
        'mine.noUploads': 'Sin subidas aún',

        'settings.title': 'Ajustes',
        'settings.account': 'Cuenta',
        'settings.accessibility': 'Accesibilidad',
        'settings.language': 'Idioma',
        'settings.display': 'Pantalla',
        'settings.about': 'Acerca de',
        'settings.logout': 'Cerrar Sesión',
        'settings.login': 'Iniciar Sesión',

        'a11y.reduceMotion': 'Reducir Movimiento',
        'a11y.reduceMotionDesc': 'Minimizar animaciones y transiciones',
        'a11y.highContrast': 'Alto Contraste',
        'a11y.highContrastDesc': 'Aumentar contraste del texto',
        'a11y.largeText': 'Texto Grande',
        'a11y.largeTextDesc': 'Aumentar tamaño de fuente',

        'onboarding.welcome': '¡Bienvenido a Clover!',
        'onboarding.swipe': 'Desliza para explorar imágenes',
        'onboarding.like': 'Toca el corazón para guardar',
        'onboarding.camera': 'Captura y sube a Commons',
        'onboarding.search': 'Busca millones de imágenes',
        'onboarding.next': 'Siguiente',
        'onboarding.skip': 'Omitir',
        'onboarding.done': 'Comenzar',

        'install.title': 'Instalar App',
        'install.description': 'Añadir a pantalla de inicio',
        'install.later': 'Después',
        'install.install': 'Instalar'
    },
    fr: {
        'nav.home': 'Accueil',
        'nav.search': 'Recherche',
        'nav.capture': 'Capturer',
        'nav.favorites': 'Favoris',
        'nav.mine': 'Mon espace',
        'nav.settings': 'Paramètres',

        'common.loading': 'Chargement...',
        'common.error': 'Erreur',
        'common.retry': 'Réessayer',
        'common.cancel': 'Annuler',
        'common.save': 'Sauvegarder',
        'common.delete': 'Supprimer',
        'common.follow': 'Suivre',
        'common.following': 'Suivi',
        'common.unfollow': 'Ne plus suivre',
        'common.uploads': 'Téléversements',
        'common.images': 'images',
        'common.creators': 'créateurs',

        'home.featured': 'À la une',
        'home.recent': 'Récent',
        'home.nearby': 'À proximité',

        'search.placeholder': 'Rechercher sur Wikimedia Commons...',
        'search.noResults': 'Aucun résultat',

        'favorites.title': 'Collections',
        'favorites.gallery': 'Galerie',
        'favorites.creators': 'Créateurs',
        'favorites.noImages': 'Aucune image sauvegardée',
        'favorites.noCreators': 'Aucun créateur suivi',

        'mine.drafts': 'Brouillons',
        'mine.gallery': 'Galerie',
        'mine.noDrafts': 'Aucun brouillon',
        'mine.noUploads': 'Aucun téléversement',

        'settings.title': 'Paramètres',
        'settings.account': 'Compte',
        'settings.accessibility': 'Accessibilité',
        'settings.language': 'Langue',
        'settings.display': 'Affichage',
        'settings.about': 'À propos',
        'settings.logout': 'Déconnexion',
        'settings.login': 'Connexion',

        'a11y.reduceMotion': 'Réduire les animations',
        'a11y.reduceMotionDesc': 'Minimiser les animations',
        'a11y.highContrast': 'Contraste élevé',
        'a11y.highContrastDesc': 'Augmenter le contraste',
        'a11y.largeText': 'Grand texte',
        'a11y.largeTextDesc': 'Augmenter la taille de police',

        'onboarding.welcome': 'Bienvenue sur Clover!',
        'onboarding.swipe': 'Glissez pour parcourir les images',
        'onboarding.like': 'Appuyez sur le cœur pour sauvegarder',
        'onboarding.camera': 'Capturez et téléversez sur Commons',
        'onboarding.search': 'Recherchez des millions d\'images',
        'onboarding.next': 'Suivant',
        'onboarding.skip': 'Passer',
        'onboarding.done': 'Commencer',

        'install.title': 'Installer l\'app',
        'install.description': 'Ajouter à l\'écran d\'accueil',
        'install.later': 'Plus tard',
        'install.install': 'Installer'
    },
    de: {
        'nav.home': 'Startseite',
        'nav.search': 'Suche',
        'nav.capture': 'Aufnehmen',
        'nav.favorites': 'Favoriten',
        'nav.mine': 'Meine',
        'nav.settings': 'Einstellungen',

        'common.loading': 'Wird geladen...',
        'common.error': 'Fehler',
        'common.retry': 'Wiederholen',
        'common.cancel': 'Abbrechen',
        'common.save': 'Speichern',
        'common.delete': 'Löschen',
        'common.follow': 'Folgen',
        'common.following': 'Folge ich',
        'common.unfollow': 'Nicht mehr folgen',
        'common.uploads': 'Uploads',
        'common.images': 'Bilder',
        'common.creators': 'Ersteller',

        'home.featured': 'Empfohlen',
        'home.recent': 'Aktuell',
        'home.nearby': 'In der Nähe',

        'search.placeholder': 'Wikimedia Commons durchsuchen...',
        'search.noResults': 'Keine Ergebnisse',

        'favorites.title': 'Sammlungen',
        'favorites.gallery': 'Galerie',
        'favorites.creators': 'Ersteller',
        'favorites.noImages': 'Keine gespeicherten Bilder',
        'favorites.noCreators': 'Keine gefolgten Ersteller',

        'mine.drafts': 'Entwürfe',
        'mine.gallery': 'Galerie',
        'mine.noDrafts': 'Keine Entwürfe',
        'mine.noUploads': 'Noch keine Uploads',

        'settings.title': 'Einstellungen',
        'settings.account': 'Konto',
        'settings.accessibility': 'Barrierefreiheit',
        'settings.language': 'Sprache',
        'settings.display': 'Anzeige',
        'settings.about': 'Über',
        'settings.logout': 'Abmelden',
        'settings.login': 'Anmelden',

        'a11y.reduceMotion': 'Bewegung reduzieren',
        'a11y.reduceMotionDesc': 'Animationen minimieren',
        'a11y.highContrast': 'Hoher Kontrast',
        'a11y.highContrastDesc': 'Kontrast erhöhen',
        'a11y.largeText': 'Großer Text',
        'a11y.largeTextDesc': 'Schriftgröße erhöhen',

        'onboarding.welcome': 'Willkommen bei Clover!',
        'onboarding.swipe': 'Wischen Sie, um Bilder zu durchsuchen',
        'onboarding.like': 'Tippen Sie auf das Herz zum Speichern',
        'onboarding.camera': 'Aufnehmen und hochladen',
        'onboarding.search': 'Millionen von Bildern durchsuchen',
        'onboarding.next': 'Weiter',
        'onboarding.skip': 'Überspringen',
        'onboarding.done': 'Los geht\'s',

        'install.title': 'App installieren',
        'install.description': 'Zum Startbildschirm hinzufügen',
        'install.later': 'Später',
        'install.install': 'Installieren'
    },
    pt: {
        'nav.home': 'Início',
        'nav.search': 'Buscar',
        'nav.capture': 'Capturar',
        'nav.favorites': 'Favoritos',
        'nav.mine': 'Meu',
        'nav.settings': 'Configurações',

        'common.loading': 'Carregando...',
        'common.error': 'Erro',
        'common.retry': 'Tentar novamente',
        'common.cancel': 'Cancelar',
        'common.save': 'Salvar',
        'common.delete': 'Excluir',
        'common.follow': 'Seguir',
        'common.following': 'Seguindo',
        'common.unfollow': 'Deixar de seguir',
        'common.uploads': 'Uploads',
        'common.images': 'imagens',
        'common.creators': 'criadores',

        'home.featured': 'Destaque',
        'home.recent': 'Recente',
        'home.nearby': 'Próximo',

        'search.placeholder': 'Buscar no Wikimedia Commons...',
        'search.noResults': 'Nenhum resultado',

        'favorites.title': 'Coleções',
        'favorites.gallery': 'Galeria',
        'favorites.creators': 'Criadores',
        'favorites.noImages': 'Nenhuma imagem salva',
        'favorites.noCreators': 'Nenhum criador seguido',

        'mine.drafts': 'Rascunhos',
        'mine.gallery': 'Galeria',
        'mine.noDrafts': 'Sem rascunhos',
        'mine.noUploads': 'Nenhum upload ainda',

        'settings.title': 'Configurações',
        'settings.account': 'Conta',
        'settings.accessibility': 'Acessibilidade',
        'settings.language': 'Idioma',
        'settings.display': 'Exibição',
        'settings.about': 'Sobre',
        'settings.logout': 'Sair',
        'settings.login': 'Entrar',

        'a11y.reduceMotion': 'Reduzir Movimento',
        'a11y.reduceMotionDesc': 'Minimizar animações',
        'a11y.highContrast': 'Alto Contraste',
        'a11y.highContrastDesc': 'Aumentar contraste do texto',
        'a11y.largeText': 'Texto Grande',
        'a11y.largeTextDesc': 'Aumentar tamanho da fonte',

        'onboarding.welcome': 'Bem-vindo ao Clover!',
        'onboarding.swipe': 'Deslize para explorar imagens',
        'onboarding.like': 'Toque no coração para salvar',
        'onboarding.camera': 'Capture e envie para o Commons',
        'onboarding.search': 'Pesquise milhões de imagens',
        'onboarding.next': 'Próximo',
        'onboarding.skip': 'Pular',
        'onboarding.done': 'Começar',

        'install.title': 'Instalar App',
        'install.description': 'Adicionar à tela inicial',
        'install.later': 'Depois',
        'install.install': 'Instalar'
    }
}

const LANGUAGE_STORAGE_KEY = 'clover_language'

/**
 * Detect browser/device language
 */
export function detectLanguage(): SupportedLanguage {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
        return stored as SupportedLanguage
    }

    const browserLang = navigator.language.split('-')[0]
    if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
        return browserLang as SupportedLanguage
    }

    return 'en'
}

/**
 * Set the current language
 */
export function setLanguage(lang: SupportedLanguage) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    document.documentElement.lang = lang
}

/**
 * Get translation for a key
 */
export function t(key: string, lang?: SupportedLanguage): string {
    const currentLang = lang || detectLanguage()
    return translations[currentLang][key] || translations.en[key] || key
}

/**
 * Get all translations for current language
 */
export function getTranslations(lang?: SupportedLanguage): Record<string, string> {
    const currentLang = lang || detectLanguage()
    return { ...translations.en, ...translations[currentLang] }
}
