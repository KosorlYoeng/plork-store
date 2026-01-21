
const translations = {};
let currentLang = localStorage.getItem('lang') || 'en';

async function setLanguage(lang) {
    if (!lang) lang = 'en';
    currentLang = lang;
    localStorage.setItem('lang', lang);
    await loadTranslations(lang);
    translatePage();
}

async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang}.json`);
        }
        translations[lang] = await response.json();
    } catch (error) {
        console.error(error);
        // Fallback to English if the selected language fails to load
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[currentLang]?.[key] || translations['en']?.[key];
        if (translation) {
            element.innerHTML = translation;
        }
    });
}

function getTranslation(key) {
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('lang') || 'en';
    setLanguage(lang);

    const langSwitcher = document.getElementById('lang-switcher');
    if (langSwitcher) {
        langSwitcher.addEventListener('change', (event) => {
            setLanguage(event.target.value);
        });
    }
});
