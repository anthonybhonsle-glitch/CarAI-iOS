// src/i18n/translations.ts
// CarAI Pro — translations. The user picks the language; the whole UI follows.
//
// Add a language by adding its code to LANGUAGES and a matching block in
// `dict`. Keep the keys identical across every language. English is the
// fallback: any key missing in another language falls back to English, so the
// app never shows a blank — add keys to `en` first, translate later.

export type LangCode = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'bn' | 'es';

export interface LanguageMeta {
  code: LangCode;
  label: string; // shown in the picker, in that language's own script
  rtl: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'hi', label: 'हिन्दी', rtl: false },
  { code: 'ta', label: 'தமிழ்', rtl: false },
  { code: 'te', label: 'తెలుగు', rtl: false },
  { code: 'mr', label: 'मराठी', rtl: false },
  { code: 'bn', label: 'বাংলা', rtl: false },
  { code: 'es', label: 'Español', rtl: false },
];

export type TransKey =
  | 'app.name' | 'app.tagline'
  | 'nav.home' | 'nav.cockpit' | 'nav.settings' | 'nav.upgrade'
  | 'connect.bluetooth' | 'connect.connecting' | 'connect.connected' | 'connect.demo'
  | 'connect.disconnect' | 'connect.live_note' | 'connect.unsupported'
  | 'tab.cockpit' | 'tab.thermal' | 'tab.def' | 'tab.tpms' | 'tab.ambient' | 'tab.perf' | 'tab.inspect'
  | 'metric.speed' | 'metric.rpm' | 'metric.coolant' | 'metric.throttle' | 'metric.fuel' | 'metric.faults'
  | 'verdict.good' | 'verdict.caution' | 'verdict.stop'
  | 'alert.coolant_critical' | 'alert.def_low'
  | 'common.unlock_pro' | 'common.not_available' | 'common.language' | 'settings.title';

export type Dict = Record<TransKey, string>;

const en: Dict = {
  'app.name': 'CarAI',
  'app.tagline': 'Your AI mechanic, on your car screen.',
  'nav.home': 'Home',
  'nav.cockpit': 'Car Screen HUD',
  'nav.settings': 'Settings',
  'nav.upgrade': 'Upgrade',
  'connect.bluetooth': 'Connect over Bluetooth',
  'connect.connecting': 'Connecting…',
  'connect.connected': 'Live car connected',
  'connect.demo': 'Demo car',
  'connect.disconnect': 'Disconnect',
  'connect.live_note': 'Engine data is live. Tyre/DEF/air need a per-car profile or add-on sensor.',
  'connect.unsupported': "Web Bluetooth isn't available here — use Chrome/Android or the native app.",
  'tab.cockpit': 'Cockpit & HUD',
  'tab.thermal': 'Thermal',
  'tab.def': 'DEF & Emissions',
  'tab.tpms': 'TPMS & Battery',
  'tab.ambient': 'Lighting & Air',
  'tab.perf': 'Performance & Dashcam',
  'tab.inspect': 'Inspection & Service',
  'metric.speed': 'Speed',
  'metric.rpm': 'RPM',
  'metric.coolant': 'Coolant',
  'metric.throttle': 'Throttle',
  'metric.fuel': 'Fuel',
  'metric.faults': 'Faults',
  'verdict.good': 'Good to drive',
  'verdict.caution': 'Drive gently, book a check',
  'verdict.stop': 'Stop safely and get help',
  'alert.coolant_critical': 'Warning: Coolant temperature critical. Pull over safely.',
  'alert.def_low': 'Warning: AdBlue level very low. Refill soon to avoid lockout.',
  'common.unlock_pro': 'Unlock with Pro',
  'common.not_available': 'Not available on this car yet',
  'common.language': 'Language',
  'settings.title': 'Settings',
};

const hi: Partial<Dict> = {
  'app.tagline': 'आपकी कार का AI मैकेनिक, आपकी कार की स्क्रीन पर।',
  'nav.home': 'होम',
  'nav.cockpit': 'कार स्क्रीन HUD',
  'nav.settings': 'सेटिंग्स',
  'nav.upgrade': 'अपग्रेड',
  'connect.bluetooth': 'ब्लूटूथ से कनेक्ट करें',
  'connect.connecting': 'कनेक्ट हो रहा है…',
  'connect.connected': 'लाइव कार कनेक्टेड',
  'connect.demo': 'डेमो कार',
  'connect.disconnect': 'डिस्कनेक्ट',
  'connect.live_note': 'इंजन डेटा लाइव है। टायर/DEF/एयर के लिए कार प्रोफ़ाइल या अतिरिक्त सेंसर चाहिए।',
  'connect.unsupported': 'यहाँ Web Bluetooth उपलब्ध नहीं है — Chrome/Android या नेटिव ऐप का उपयोग करें।',
  'tab.cockpit': 'कॉकपिट और HUD',
  'tab.thermal': 'थर्मल',
  'tab.def': 'DEF और उत्सर्जन',
  'tab.tpms': 'TPMS और बैटरी',
  'tab.ambient': 'लाइटिंग और हवा',
  'tab.perf': 'परफॉर्मेंस और डैशकैम',
  'tab.inspect': 'निरीक्षण और सर्विस',
  'metric.speed': 'गति',
  'metric.rpm': 'RPM',
  'metric.coolant': 'कूलेंट',
  'metric.throttle': 'थ्रॉटल',
  'metric.fuel': 'ईंधन',
  'metric.faults': 'खराबी',
  'verdict.good': 'ड्राइव करने के लिए ठीक',
  'verdict.caution': 'सावधानी से चलाएं, जांच कराएं',
  'verdict.stop': 'सुरक्षित रूप से रुकें और मदद लें',
  'alert.coolant_critical': 'चेतावनी: कूलेंट का तापमान खतरनाक है। सुरक्षित रूप से रुकें।',
  'alert.def_low': 'चेतावनी: AdBlue का स्तर बहुत कम है। जल्द भरें।',
  'common.unlock_pro': 'Pro से अनलॉक करें',
  'common.not_available': 'इस कार पर अभी उपलब्ध नहीं है',
  'common.language': 'भाषा',
  'settings.title': 'सेटिंग्स',
};

const ta: Partial<Dict> = {
  'app.tagline': 'உங்கள் கார் திரையில் உங்கள் AI மெக்கானிக்.',
  'nav.home': 'முகப்பு',
  'nav.cockpit': 'கார் திரை HUD',
  'nav.settings': 'அமைப்புகள்',
  'nav.upgrade': 'மேம்படுத்து',
  'connect.bluetooth': 'புளூடூத் மூலம் இணைக்கவும்',
  'connect.connecting': 'இணைக்கிறது…',
  'connect.connected': 'லைவ் கார் இணைக்கப்பட்டது',
  'connect.demo': 'டெமோ கார்',
  'connect.disconnect': 'துண்டி',
  'metric.speed': 'வேகம்',
  'metric.fuel': 'எரிபொருள்',
  'metric.faults': 'பிழைகள்',
  'verdict.good': 'ஓட்ட சிறந்தது',
  'common.unlock_pro': 'Pro உடன் திறக்கவும்',
  'common.not_available': 'இந்த காரில் இன்னும் கிடைக்கவில்லை',
  'common.language': 'மொழி',
  'settings.title': 'அமைப்புகள்',
};

const te: Partial<Dict> = {
  'app.tagline': 'మీ కార్ స్క్రీన్‌పై మీ AI మెకానిక్.',
  'nav.home': 'హోమ్',
  'nav.cockpit': 'కార్ స్క్రీన్ HUD',
  'nav.settings': 'సెట్టింగ్‌లు',
  'nav.upgrade': 'అప్‌గ్రేడ్',
  'connect.bluetooth': 'బ్లూటూత్ ద్వారా కనెక్ట్ చేయండి',
  'connect.connecting': 'కనెక్ట్ అవుతోంది…',
  'connect.connected': 'లైవ్ కార్ కనెక్ట్ అయింది',
  'connect.demo': 'డెమో కార్',
  'connect.disconnect': 'డిస్‌కనెక్ట్',
  'metric.speed': 'వేగం',
  'metric.fuel': 'ఇంధనం',
  'metric.faults': 'లోపాలు',
  'verdict.good': 'డ్రైవ్ చేయడానికి మంచిది',
  'common.unlock_pro': 'Pro తో అన్‌లాక్ చేయండి',
  'common.not_available': 'ఈ కారులో ఇంకా అందుబాటులో లేదు',
  'common.language': 'భాష',
  'settings.title': 'సెట్టింగ్‌లు',
};

const mr: Partial<Dict> = {
  'app.tagline': 'तुमच्या कारच्या स्क्रीनवर तुमचा AI मेकॅनिक.',
  'nav.home': 'होम',
  'nav.cockpit': 'कार स्क्रीन HUD',
  'nav.settings': 'सेटिंग्ज',
  'nav.upgrade': 'अपग्रेड',
  'connect.bluetooth': 'ब्लूटूथने कनेक्ट करा',
  'connect.connecting': 'कनेक्ट होत आहे…',
  'connect.connected': 'लाइव्ह कार कनेक्ट झाली',
  'connect.demo': 'डेमो कार',
  'connect.disconnect': 'डिस्कनेक्ट',
  'metric.speed': 'वेग',
  'metric.fuel': 'इंधन',
  'metric.faults': 'त्रुटी',
  'verdict.good': 'चालवण्यासाठी उत्तम',
  'common.unlock_pro': 'Pro सह अनलॉक करा',
  'common.not_available': 'या कारवर अद्याप उपलब्ध नाही',
  'common.language': 'भाषा',
  'settings.title': 'सेटिंग्ज',
};

const bn: Partial<Dict> = {
  'app.tagline': 'আপনার গাড়ির স্ক্রিনে আপনার AI মেকানিক।',
  'nav.home': 'হোম',
  'nav.cockpit': 'কার স্ক্রিন HUD',
  'nav.settings': 'সেটিংস',
  'nav.upgrade': 'আপগ্রেড',
  'connect.bluetooth': 'ব্লুটুথ দিয়ে সংযোগ করুন',
  'connect.connecting': 'সংযুক্ত হচ্ছে…',
  'connect.connected': 'লাইভ গাড়ি সংযুক্ত',
  'connect.demo': 'ডেমো গাড়ি',
  'connect.disconnect': 'সংযোগ বিচ্ছিন্ন',
  'metric.speed': 'গতি',
  'metric.fuel': 'জ্বালানী',
  'metric.faults': 'ত্রুটি',
  'verdict.good': 'ড্রাইভ করার জন্য নিরাপদ',
  'common.unlock_pro': 'Pro দিয়ে আনলক করুন',
  'common.not_available': 'এই গাড়িতে এখনও উপলব্ধ নয়',
  'common.language': 'ভাষা',
  'settings.title': 'সেটিংস',
};

const es: Partial<Dict> = {
  'app.tagline': 'Tu mecánico con IA, en la pantalla de tu coche.',
  'nav.home': 'Inicio',
  'nav.cockpit': 'HUD Pantalla del Coche',
  'nav.settings': 'Ajustes',
  'nav.upgrade': 'Mejorar',
  'connect.bluetooth': 'Conectar por Bluetooth',
  'connect.connecting': 'Conectando…',
  'connect.connected': 'Coche conectado',
  'connect.demo': 'Coche de demostración',
  'connect.disconnect': 'Desconectar',
  'connect.live_note': 'Los datos del motor están en vivo. Neumáticos/DEF/aire requieren perfil de coche o sensor.',
  'connect.unsupported': "Web Bluetooth no está disponible aquí — usa Chrome/Android o la app nativa.",
  'tab.cockpit': 'Cockpit y HUD',
  'tab.thermal': 'Térmico',
  'tab.def': 'DEF y Emisiones',
  'tab.tpms': 'TPMS y Batería',
  'tab.ambient': 'Iluminación y Aire',
  'tab.perf': 'Rendimiento y Dashcam',
  'tab.inspect': 'Inspección y Servicio',
  'metric.speed': 'Velocidad',
  'metric.rpm': 'RPM',
  'metric.coolant': 'Refrigerante',
  'metric.throttle': 'Acelerador',
  'metric.fuel': 'Combustible',
  'metric.faults': 'Fallos',
  'verdict.good': 'Apto para conducir',
  'verdict.caution': 'Conduzca con cuidado, revise el coche',
  'verdict.stop': 'Deténgase con seguridad y pida ayuda',
  'alert.coolant_critical': 'Aviso: Temperatura del refrigerante crítica. Deténgase de forma segura.',
  'alert.def_low': 'Aviso: Nivel de AdBlue muy bajo. Rellene pronto para evitar bloqueo.',
  'common.unlock_pro': 'Desbloquear con Pro',
  'common.not_available': 'No disponible en este coche todavía',
  'common.language': 'Idioma',
  'settings.title': 'Ajustes',
};

export const dict: Record<LangCode, Dict> = {
  en,
  hi: { ...en, ...hi },
  ta: { ...en, ...ta },
  te: { ...en, ...te },
  mr: { ...en, ...mr },
  bn: { ...en, ...bn },
  es: { ...en, ...es },
};
