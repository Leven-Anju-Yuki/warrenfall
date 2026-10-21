// =====================================================================
// DONNÉES PARTAGÉES — mécanique de chargement uniquement.
// Tout le contenu (les 16 lapins, les 11 boss, les taux d'œufs) vit
// maintenant dans lapinous-content.json à la racine du projet.
// Ce fichier ne fait plus que : charger ce JSON, gérer les surcharges
// locales du Dashboard (localStorage), et exposer getSpecies()/getBosses().
// =====================================================================

// Azazel reste ici (pas dans le JSON) : c'est le seul dont la logique
// (nom secret "azazel", aucun malus) est directement liée au code du jeu,
// pas au contenu éditable. Tout le reste vient de lapinous-content.json.
const BASE_SPECIES = {
    az: {
        name: "Azazel", nickname: "le Premier Lapin", rarity: "divin",
        personality: "Calme, sage, intemporel et bienveillant.",
        story: "Bien avant la naissance des royaumes, avant les gardiens et avant les légendes, Azazel parcourait déjà les plaines du monde. On raconte qu'il fut le premier lapin à fouler cette terre et que toutes les lignées actuelles descendent de lui. Ni roi, ni gardien, ni dieu au sens traditionnel, Azazel représente l'origine même de la vie et de l'équilibre. Les plus anciens mythes racontent que lorsqu'il ferme les yeux, le monde rêve, et lorsqu'il les ouvre, une nouvelle ère commence.",
        accessory: "Halo des Origines.",
        likes: ["L'équilibre", "Le silence", "La nature", "Toutes les créatures"],
        dislikes: ["Le chaos", "La corruption", "La destruction inutile"],
        quote: "Avant toutes les légendes, il y avait simplement la vie.",
        power: "Souffle Originel : restaure entièrement les alliés et purifie tous les effets négatifs.",
        faceImg: "./assets/img/lapins_jouables/sans_evenements/azazel_face.png",
        coteImg: "./assets/img/lapins_jouables/sans_evenements/azazel_cote.png",
        friends: [], rivals: [], hidden: true, noMalus: true,
    },
};

// Pas de boss codé en dur : tous viennent de lapinous-content.json.
const BASE_BOSSES = {};

const RARITY_META = {
    commun: { label: "Commun", color: "#b8bcc4" },
    rare: { label: "Rare", color: "#6ebf77" },
    epique: { label: "Épique", color: "#5b8fd6" },
    legendaire: { label: "Légendaire", color: "#a35bd6" },
    mythique: { label: "Mythique", color: "#f5c34d" },
    divin: { label: "Divin", color: "#d64545" },
    secret: { label: "??? Secret", color: "#2b2b2b" },
};

const RELATIONS_TEXT = [
    "Azur et Bambou sont meilleurs amis.",
    "Caramel suit souvent Flamme dans ses aventures.",
    "Mocha aide Koda à préparer ses missions.",
    "Nova apparaît parfois pour guider le groupe.",
    "Koda protège naturellement les lapins les plus faibles.",
    "Flamme essaie constamment de découvrir le secret de Nova.",
];

// ---- Stockage des surcharges locales (modifications en cours dans le Dashboard,
// avant export vers lapinous-content.json) ----
const CUSTOM_SPECIES_KEY = "lapinous_custom_species";
const CUSTOM_BOSSES_KEY = "lapinous_custom_bosses";
const EGG_RATES_KEY = "lapinous_egg_rates";

function loadCustomSpecies() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_SPECIES_KEY) || "{}"); } catch (e) { return {}; }
}
function loadCustomBosses() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_BOSSES_KEY) || "{}"); } catch (e) { return {}; }
}
function loadEggRates() {
    try {
        const stored = JSON.parse(localStorage.getItem(EGG_RATES_KEY));
        if (stored) return stored;
    } catch (e) {}
    return JSON_EGG_RATES || { commun: 68, rare: 22, epique: 6, legendaire: 2.5, mythique: 1.2, divin: 0.3 };
}
function saveEggRates(rates) { localStorage.setItem(EGG_RATES_KEY, JSON.stringify(rates)); window.dispatchEvent(new Event("lapinous-egg-rates-changed")); }

// ---- Durée des événements (jours avant/après la date d'ancrage), réglable
// depuis le Dashboard. Partagé avec script.js pour le calcul de disponibilité.
const EVENT_WINDOWS_KEY = "lapinous_event_windows";
const DEFAULT_EVENT_WINDOWS = { halloween: 10, noel: 12, paques: 10, nouvel_an_chinois: 10 };
// Le premier jour du premier mois du calendrier chinois change chaque année.
const CHINESE_NEW_YEAR_CACHE = new Map();
function getChineseNewYearDate(year) {
    if (CHINESE_NEW_YEAR_CACHE.has(year)) return CHINESE_NEW_YEAR_CACHE.get(year);
    // HKO : https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2027e.pdf
    // Certaines versions d'ICU décalent 2027 d'un jour : dates officielles prioritaires.
    const officialDates = {2026: [2, 17], 2027: [2, 6], 2028: [1, 26]};
    if (officialDates[year]) {
        const [month, day] = officialDates[year];
        const result = new Date(year, month - 1, day);
        CHINESE_NEW_YEAR_CACHE.set(year, result);
        return result;
    }
    const formatter = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric', timeZone: 'UTC' });
    if (formatter.resolvedOptions().calendar !== 'chinese') return null;
    for (let day = 21; day <= 51; day++) {
        const candidate = new Date(Date.UTC(year, 0, day));
        const parts = formatter.formatToParts(candidate);
        if (parts.find(p => p.type === 'month')?.value === '1' && parts.find(p => p.type === 'day')?.value === '1') {
            const result = new Date(year, candidate.getUTCMonth(), candidate.getUTCDate());
            CHINESE_NEW_YEAR_CACHE.set(year, result);
            return result;
        }
    }
    return null;
}
function loadEventWindows() {
    try {
        const stored = JSON.parse(localStorage.getItem(EVENT_WINDOWS_KEY));
        if (stored) return { ...DEFAULT_EVENT_WINDOWS, ...stored };
    } catch (e) {}
    return { ...DEFAULT_EVENT_WINDOWS, ...(JSON_EVENT_WINDOWS || {}) };
}
function saveEventWindows(windows) { localStorage.setItem(EVENT_WINDOWS_KEY, JSON.stringify(windows)); }

// Ordre de priorité (du moins prioritaire au plus prioritaire) :
//   1. BASE_SPECIES / BASE_BOSSES ci-dessus (juste Azazel, jamais perdu)
//   2. lapinous-content.json à la racine (LE contenu du jeu, partagé)
//   3. localStorage (modifications en cours dans le Dashboard, pas encore exportées)
function getSpecies() {
    const base = { ...BASE_SPECIES, ...JSON_SPECIES };
    const custom = loadCustomSpecies();
    for (const [key, entry] of Object.entries(custom)) base[key] = { ...base[key], ...entry };
    // Compatibilité avec les chemins enregistrés avant le rangement des médias.
    for (const entry of Object.values(base)) {
        for (const field of ['faceImg', 'coteImg']) {
            // Migrer les anciens chemins sauvegardés sans modifier les données du joueur.
            if(typeof entry[field]==='string')entry[field]=entry[field].replace('assets/img/lapins_jouables/sans_evenements/species/','assets/img/lapins_jouables/sans_evenements/').replace('assets/img/species/','assets/img/lapins_jouables/sans_evenements/').replace('assets/img/lapin_evenement/','assets/img/lapins_jouables/lapin_evenement/');
            const path = entry[field];
            const match = typeof path === 'string' && path.match(/lapin_evenement\/([^/]+)$/);
            if (!match) continue;
            const prefix = match[1].replace(/\.(png|webp|jpe?g)$/i, '').replace(/_(face|cote)\d*$/, '').toLowerCase();
            const groups = {Halloween:['bete','fantome','frank','haloween','krampus','peatch','squelette','vampi'], Noel:['cerf','klaus','lutin','mnoel','noel','pnoel'], Paques:['oeuf','paques'], Multi_saisons:['5_legendes','fee','frost','reve']};
            const group = Object.keys(groups).find(key => groups[key].includes(prefix));
            if (group) entry[field] = path.replace('lapin_evenement/', 'lapin_evenement/' + group + '/');
        }
    }
    return base;
}
function getBosses() { return { ...BASE_BOSSES, ...JSON_BOSSES, ...loadCustomBosses() }; }
function getOpponents() { let custom={}; try { custom=JSON.parse(localStorage.getItem("lapinous_custom_opponents")||"{}"); } catch {} return { ...getBosses(), ...JSON_OPPONENTS, ...custom }; }

// ============================================================
// CHARGEMENT DE lapinous-content.json (déposé à la racine du projet)
// ============================================================
// ⚠️ fetch() ne fonctionne PAS si tu ouvres index.html directement en double-cliquant
// (protocole file://). Il faut un vrai serveur local (ex: `npx serve`,
// `python -m http.server`) ou être hébergé (GitHub Pages...). Sans ça, le fetch
// échoue silencieusement : le jeu continue avec juste Azazel + tes surcharges
// locales, sans planter — mais sans le contenu principal.
let JSON_SPECIES = {};
let JSON_BOSSES = {};
let JSON_OPPONENTS = {};
let JSON_EGG_RATES = null;
let JSON_EVENT_WINDOWS = null;

window.LapinousContentReady = fetch("./lapinous-content.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
        if (data) {
            window.LapinousVisibility.setBase(data.visibility || {});
            JSON_SPECIES = data.species || {};
            JSON_BOSSES = data.bosses || {};
            JSON_OPPONENTS = data.opponents || {};
            JSON_EGG_RATES = data.eggRates || null;
            JSON_EVENT_WINDOWS = data.eventWindows || null;
        }
    })
    .catch(() => {
        // Pas de fichier, pas de serveur, ou erreur réseau : on continue normalement.
    });

// Visibilité éditoriale : les réglages locaux de l’administrateur précèdent le catalogue publié.
(() => {
    const key='lapinous_visibility';
    const definitions={quiz:['Quiz des lapins','[onclick="openRabbitQuiz()"]','admin'],market:['Rayon Marche','[data-shop-tab=market]','public'],evolution:['Rayon Evolutions','[data-shop-tab=evolution]','public'],fragments:['Rayon Fragments','[data-shop-tab=fragments]','public'],carrotShop:['Rayon Carottes','[data-shop-tab=carrots]','admin'],recipes:['Preparation des plats','.pantry-meals','public'],agility:['Agilite','[onclick="startAgility()"]','public'],games:['Coin jeux','[onclick="openGameConsole()"]','public'],favorites:['Favoris du salon','.salon-favorites-button,.rabbit-favorite-star','public'],records:['Records et succes','#lapinousRecordsBtn','public'],pantry:['Garde-manger et cuisine du Chef','.fridge-hotspot,#kitchenFridgeDialog','public'],shop:['Magasin','#shopButton','public'],inventory:['Apothicairerie','#inventoryButton','public'],legal:['Documents juridiques','#legalTrigger','public'],encyclopedia:['Encyclopédie','#encyclopediaBtn','public'],puzzles:['Puzzles','[onclick="openPuzzleHub()"]','public'],memory:['Memory','[onclick="openMemory()"]','public'],lapidoku:['Lapidoku','[onclick="openLapidoku()"]','public'],combat:['Combats','[onclick="openAdventure()"]','public']};
    let base={},local={};
    const admin=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname.toLowerCase());
    try {if(admin)local=JSON.parse(localStorage.getItem(key)||'{}');} catch {}
    const style=document.createElement('style');document.head.appendChild(style);
    // Ne garder que les fonctions et modes connus, sans injecter de contenu du JSON dans le CSS.
    function normalize(value){const result={};for(const name in definitions)if(['public','admin','hidden'].includes(value?.[name]))result[name]=value[name];return result;}
    function get(){return Object.fromEntries(Object.entries(definitions).map(([name,def])=>[name,local[name]||base[name]||def[2]]));}
    function allowed(name){const mode=get()[name];return admin||mode==='public';}
    function apply(){style.textContent=Object.entries(definitions).filter(([name])=>!allowed(name)).map(([,def])=>def[1]+'{display:none!important}').join('\n');}
    function save(value){local=normalize(value);localStorage.setItem(key,JSON.stringify(local));apply();}
    window.LapinousVisibility={definitions,get,allowed,save,setBase(value){base=normalize(value);apply();}};
    apply();
})();
