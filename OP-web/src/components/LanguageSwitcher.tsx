import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={i18n.language === 'en' ? 'Switch to Chinese' : '切换到英文'}
    >
      <Globe className="w-5 h-5" />
      <span className="text-sm font-medium">
        {i18n.language === 'en' ? '中文' : 'EN'}
      </span>
    </button>
  );
}
