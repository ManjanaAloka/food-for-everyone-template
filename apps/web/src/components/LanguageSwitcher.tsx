import i18n from '../i18n';
const langs = [ { code: 'en', label: 'EN' }, { code: 'si', label: 'à·ƒà·’à¶‚' }, { code: 'ta', label: 'à®¤à®®à®¿à®´à¯' } ];
export function LanguageSwitcher() {
  const cur = i18n.language;
  return (
    <div className="flex gap-1">
      {langs.map(l => (
        <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('lng', l.code); }}
          className={`px-2 py-1 rounded text-sm ${cur === l.code ? 'bg-green-700 text-white' : 'bg-gray-200'}`} title={l.label}>
          {l.label}
        </button>
      ))}
    </div>
  );
}