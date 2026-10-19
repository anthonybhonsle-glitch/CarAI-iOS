// src/components/LanguageSwitcher.tsx
// The user-facing language picker. Drop it in the Navbar and in Settings.
// 'compact' shows just a globe + current language; otherwise a labelled select.
import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { LangCode } from '../i18n/translations';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { lang, setLang, languages, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm text-[#9FB6C8] cursor-pointer">
      <Globe size={16} className="text-cyan-400 shrink-0" />
      {!compact && <span className="font-semibold text-xs sm:text-sm">{t('common.language')}</span>}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as LangCode)}
        aria-label={t('common.language')}
        className="min-h-[40px] rounded-xl bg-[#141B24] border border-[#242E3D] px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-[#EAF6FF] hover:border-cyan-500 focus:border-cyan-400 focus:outline-none transition-colors"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} className="bg-[#12293B] text-[#EAF6FF]">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
