export const PIPELINE_STAGES = [
  { key: "offert", label: "Offert", color: "#F2BB01" },
  { key: "avslutad_affar", label: "Avslutad (affär)", color: "#333333" },
  { key: "avslutad_ingen_affar", label: "Avslutad (ingen affär)", color: "#8B3D3D" },
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number]["key"];

export const DEAL_HEAT_LEVELS = [
  { value: 1, label: "Het", color: "#D9534F" },
  { value: 2, label: "Varm", color: "#E89B3F" },
  { value: 3, label: "Kall", color: "#6B6B6B" },
] as const;

export type DealHeat = (typeof DEAL_HEAT_LEVELS)[number]["value"];

export const FACTORY_TYPES = [
  { key: "modulfabrik", label: "Modulfabrik" },
  { key: "vagg_tak_fabrik", label: "Vägg & takfabrik" },
  { key: "badrum", label: "Badrum" },
] as const;

export type FactoryType = (typeof FACTORY_TYPES)[number]["key"];

export const BUILDING_TYPES = [
  { key: "flerbostadshus", label: "Flerbostadshus" },
  { key: "smahus", label: "Småhus" },
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number]["key"];

export const MATERIALS = [
  { key: "tra", label: "Trä" },
  { key: "stal", label: "Stål" },
] as const;

export type Material = (typeof MATERIALS)[number]["key"];

export const MEETING_STATUSES = [
  { key: "planerat", label: "Planerat", color: "#808080" },
  { key: "genomfort", label: "Genomfört", color: "#333333" },
  { key: "installt", label: "Inställt", color: "#8B3D3D" },
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number]["key"];

export const PROJECT_TYPES = [
  { key: "ny_husfabrik", label: "Ny husfabrik" },
  { key: "ombyggnad", label: "Ombyggnad" },
  { key: "utbyggnad", label: "Utbyggnad" },
  { key: "maskininvestering", label: "Maskininvestering" },
  { key: "annat", label: "Annat" },
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number]["key"];

export const PROJECT_STATUSES = [
  { key: "planerad", label: "Planerad", color: "#808080" },
  { key: "pagaende", label: "Pågående", color: "#E89B3F" },
  { key: "vilande", label: "Vilande", color: "#9A9A9A" },
  { key: "avslutad", label: "Avslutad", color: "#333333" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["key"];

export const CURRENCIES = ["SEK", "EUR", "NOK", "DKK"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const MACHINE_CATEGORIES = [
  { key: "Element Handling", label: "Element Handling" },
  { key: "Vertical Access", label: "Vertical Access" },
  { key: "Tiling", label: "Tiling" },
  { key: "Storage", label: "Storage" },
  { key: "Module Transport Solutions", label: "Module Transport Solutions" },
] as const;

export type MachineCategory = (typeof MACHINE_CATEGORIES)[number]["key"];

// ============================================
// MASKINSPECAR
// ============================================
// Vad en spec beskriver. Måtten på ett element och måtten på en modul är olika
// saker och får aldrig jämföras; maskinegenskaper beskriver varken utan maskinen.
export const SPEC_OBJECTS = [
  { key: "element", label: "Element", label_en: "Element" },
  { key: "modul", label: "Modul", label_en: "Module" },
  { key: "maskin", label: "Maskin", label_en: "Machine" },
] as const;

export type SpecObject = (typeof SPEC_OBJECTS)[number]["key"];

// Värdetyper. Skillnaden mellan "adapt" och "undocumented" är hela poängen:
// projektkonfigurerat är ett svar, saknad uppgift är ett hål.
export const SPEC_VALUE_TYPES = [
  { key: "value", label: "Värde", label_en: "Value" },
  { key: "text", label: "Text", label_en: "Text" },
  { key: "adapt", label: "Anpassas efter behov", label_en: "Adapted to requirements" },
  { key: "undocumented", label: "Ej dokumenterat", label_en: "Not documented" },
] as const;

export type SpecValueType = (typeof SPEC_VALUE_TYPES)[number]["key"];

// Gemensam fältlista. Håller etiketterna lika mellan maskiner så att samma mått
// går att fråga efter en gång och besvaras av alla maskiner kunden köper.
// Maskinunika uppgifter läggs som fria rader med egen etikett.
export const SPEC_FIELDS = [
  // Elementet
  { key: "element_length", label: "Elementlängd", label_en: "Element length", unit: "mm", object: "element" },
  { key: "element_height", label: "Elementhöjd", label_en: "Element height", unit: "mm", object: "element" },
  { key: "element_thickness", label: "Elementtjocklek", label_en: "Element thickness", unit: "mm", object: "element" },
  { key: "element_weight", label: "Elementvikt", label_en: "Element weight", unit: "kg", object: "element" },
  // Modulen
  { key: "module_size", label: "Modulstorlek", label_en: "Module size", unit: "", object: "modul" },
  { key: "module_weight", label: "Modulvikt", label_en: "Module weight", unit: "kg", object: "modul" },
  // Plattformar
  { key: "platform_count", label: "Antal plattformar", label_en: "Number of platforms", unit: "st", object: "maskin" },
  { key: "platform_load", label: "Last per plattform", label_en: "Load per platform", unit: "kg", object: "maskin" },
  { key: "platform_persons", label: "Personer per plattform", label_en: "Persons per platform", unit: "st", object: "maskin" },
  { key: "platform_height", label: "Plattformshöjd, max", label_en: "Platform height, max", unit: "mm", object: "maskin" },
  { key: "horizontal_travel", label: "Horisontell körsträcka", label_en: "Horizontal travel", unit: "mm", object: "maskin" },
  { key: "movement", label: "Rörelse", label_en: "Movement", unit: "", object: "maskin" },
  // Lyft
  { key: "lifting_capacity", label: "Lyftkapacitet, max", label_en: "Lifting capacity, max", unit: "kg", object: "maskin" },
  { key: "power_source", label: "Drivning", label_en: "Power source", unit: "", object: "maskin" },
  { key: "air_pressure", label: "Arbetstryck", label_en: "Working pressure", unit: "bar", object: "maskin" },
  // Vagnar
  { key: "element_cart_load", label: "Last per elementvagn", label_en: "Load per carrier cart", unit: "kg", object: "maskin" },
  { key: "element_carts_per", label: "Elementvagnar per element", label_en: "Carrier carts per element", unit: "st", object: "maskin" },
  { key: "module_cart_load", label: "Last per modulvagn", label_en: "Load per trolley", unit: "kg", object: "maskin" },
  { key: "module_carts_per", label: "Modulvagnar per modul", label_en: "Trolleys per module", unit: "st", object: "maskin" },
  { key: "floor_beams_per_module", label: "Golvbalkar per modul", label_en: "Floor beams per module", unit: "st", object: "maskin" },
  // Banor
  { key: "stations", label: "Antal stationer", label_en: "Number of stations", unit: "st", object: "maskin" },
  { key: "station_width", label: "Stationsbredd", label_en: "Station width", unit: "mm", object: "maskin" },
  { key: "tracks", label: "Antal spår", label_en: "Number of tracks", unit: "st", object: "maskin" },
  { key: "beams", label: "Balkar", label_en: "Beams", unit: "", object: "maskin" },
  { key: "beam_load", label: "Last per balk", label_en: "Load per beam", unit: "kg", object: "maskin" },
  { key: "beam_pushers", label: "Balkskjutare", label_en: "Beam pushers", unit: "", object: "maskin" },
  { key: "beam_return", label: "Balkretur", label_en: "Beam return", unit: "", object: "maskin" },
  { key: "transfer_time", label: "Överföringstid", label_en: "Transfer time", unit: "min", object: "maskin" },
  { key: "takt_time", label: "Takttid", label_en: "Takt time", unit: "s", object: "maskin" },
  // Lagring och installation
  { key: "storage_slots", label: "Antal lagerplatser", label_en: "Number of storage slots", unit: "st", object: "maskin" },
  { key: "floor_mounting", label: "Golvmontage", label_en: "Floor mounting", unit: "", object: "maskin" },
  { key: "throughput_time", label: "Genomloppstid", label_en: "Throughput time", unit: "min", object: "maskin" },
  // Omfattning
  { key: "handles", label: "Hanterar", label_en: "Handles", unit: "", object: "maskin" },
  { key: "used_for", label: "Används vid", label_en: "Used for", unit: "", object: "maskin" },
] as const;

export type SpecFieldKey = (typeof SPEC_FIELDS)[number]["key"];

// Teman för maskinernas kunskapsbank (frågor att ställa kunden). Frågor utan
// tema visas under "Övrigt".
export const QUESTION_CATEGORIES = [
  { key: "produktion", label: "Produktion & kapacitet" },
  { key: "byggnad", label: "Byggnad & moduler" },
  { key: "teknik", label: "Teknik & installation" },
  { key: "logistik", label: "Logistik & montage" },
  { key: "ekonomi", label: "Budget & beslut" },
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]["key"];

export const USER_ROLES = [
  { key: "admin", label: "Administratör" },
  { key: "salesperson", label: "Säljare" },
] as const;

export type UserRole = (typeof USER_ROLES)[number]["key"];

export const COUNTRIES = [
  "Sverige",
  "Norge",
  "Finland",
  "Danmark",
  "Island",
  "Afghanistan",
  "Albanien",
  "Algeriet",
  "Amerikanska Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antigua och Barbuda",
  "Argentina",
  "Armenien",
  "Aruba",
  "Australien",
  "Azerbajdzjan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belgien",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Bosnien och Hercegovina",
  "Botswana",
  "Brasilien",
  "Brunei",
  "Bulgarien",
  "Burkina Faso",
  "Burundi",
  "Centralafrikanska republiken",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cypern",
  "Demokratiska republiken Kongo",
  "Dominica",
  "Dominikanska republiken",
  "Djibouti",
  "Ecuador",
  "Egypten",
  "Ekvatorialguinea",
  "El Salvador",
  "Elfenbenskusten",
  "Eritrea",
  "Estland",
  "Eswatini",
  "Etiopien",
  "Fiji",
  "Filippinerna",
  "Frankrike",
  "Förenade Arabemiraten",
  "Gabon",
  "Gambia",
  "Georgien",
  "Ghana",
  "Grekland",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Indien",
  "Indonesien",
  "Irak",
  "Iran",
  "Irland",
  "Israel",
  "Italien",
  "Jamaica",
  "Japan",
  "Jemen",
  "Jordanien",
  "Kambodja",
  "Kamerun",
  "Kanada",
  "Kap Verde",
  "Kazakstan",
  "Kenya",
  "Kina",
  "Kirgizistan",
  "Kiribati",
  "Komorerna",
  "Kongo-Brazzaville",
  "Kosovo",
  "Kroatien",
  "Kuba",
  "Kuwait",
  "Laos",
  "Lesotho",
  "Lettland",
  "Libanon",
  "Liberia",
  "Libyen",
  "Liechtenstein",
  "Litauen",
  "Luxemburg",
  "Madagaskar",
  "Malawi",
  "Malaysia",
  "Maldiverna",
  "Mali",
  "Malta",
  "Marocko",
  "Marshallöarna",
  "Mauretanien",
  "Mauritius",
  "Mexiko",
  "Mikronesien",
  "Moldavien",
  "Monaco",
  "Mongoliet",
  "Montenegro",
  "Moçambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nederländerna",
  "Nepal",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Nordkorea",
  "Nordmakedonien",
  "Nya Zeeland",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua Nya Guinea",
  "Paraguay",
  "Peru",
  "Polen",
  "Portugal",
  "Qatar",
  "Rumänien",
  "Rwanda",
  "Ryssland",
  "Saint Kitts och Nevis",
  "Saint Lucia",
  "Saint Vincent och Grenadinerna",
  "Salomonöarna",
  "Samoa",
  "San Marino",
  "São Tomé och Príncipe",
  "Saudiarabien",
  "Schweiz",
  "Senegal",
  "Serbien",
  "Seychellerna",
  "Sierra Leone",
  "Singapore",
  "Slovakien",
  "Slovenien",
  "Somalia",
  "Spanien",
  "Sri Lanka",
  "Storbritannien",
  "Sudan",
  "Surinam",
  "Sydafrika",
  "Sydkorea",
  "Sydsudan",
  "Syrien",
  "Tadzjikistan",
  "Tanzania",
  "Tchad",
  "Thailand",
  "Tjeckien",
  "Togo",
  "Tonga",
  "Trinidad och Tobago",
  "Tunisien",
  "Turkiet",
  "Turkmenistan",
  "Tuvalu",
  "Tyskland",
  "Uganda",
  "Ukraina",
  "Ungern",
  "Uruguay",
  "USA",
  "Uzbekistan",
  "Vanuatu",
  "Vatikanstaten",
  "Venezuela",
  "Vietnam",
  "Vitryssland",
  "Zambia",
  "Zimbabwe",
  "Österrike",
  "Östtimor",
] as const;
