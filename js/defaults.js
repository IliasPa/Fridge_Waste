/* ==========================================================================
   DEFAULTS — the one file to edit if you want different shelf lives,
   quick-pick buttons or barcode category mapping.

   All numbers are DAYS.
   - fridge / freezer / pantry : how long an item keeps from the day you add it
                                 there (null = not normally stored there).
   - opened  : days left once opened. Tapping "Opened" shortens the date to
               at most this many days from today (null = opening changes nothing).
   - thawed  : days left after moving an item OUT of the freezer.
   - home    : where this kind of food normally lives.
   These are conservative household guidelines, not food-safety advice —
   always trust the printed date and your nose.
   ========================================================================== */

export const CATEGORIES = {
  milk:       { emoji: '🥛', home: 'fridge',  fridge: 7,   freezer: 90,  pantry: null, opened: 4,   thawed: 3, en: 'Milk',                    el: 'Γάλα' },
  yogurt:     { emoji: '🥣', home: 'fridge',  fridge: 14,  freezer: 60,  pantry: null, opened: 4,   thawed: 2, en: 'Yogurt & cream',          el: 'Γιαούρτι & κρέμα' },
  cheese:     { emoji: '🧀', home: 'fridge',  fridge: 30,  freezer: 120, pantry: null, opened: 14,  thawed: 7, en: 'Hard & yellow cheese',    el: 'Κίτρινο τυρί' },
  softcheese: { emoji: '🧀', home: 'fridge',  fridge: 10,  freezer: 90,  pantry: null, opened: 7,   thawed: 4, en: 'Feta & white cheese',     el: 'Φέτα & λευκό τυρί' },
  butter:     { emoji: '🧈', home: 'fridge',  fridge: 60,  freezer: 180, pantry: null, opened: 30,  thawed: 20, en: 'Butter',                 el: 'Βούτυρο' },
  eggs:       { emoji: '🥚', home: 'fridge',  fridge: 28,  freezer: null, pantry: 14, opened: null, thawed: 1, en: 'Eggs',                    el: 'Αυγά' },
  meat:       { emoji: '🥩', home: 'fridge',  fridge: 3,   freezer: 180, pantry: null, opened: null, thawed: 2, en: 'Meat',                   el: 'Κρέας' },
  mince:      { emoji: '🥩', home: 'fridge',  fridge: 1,   freezer: 90,  pantry: null, opened: null, thawed: 1, en: 'Minced meat',            el: 'Κιμάς' },
  poultry:    { emoji: '🍗', home: 'fridge',  fridge: 2,   freezer: 270, pantry: null, opened: null, thawed: 1, en: 'Chicken & poultry',      el: 'Κοτόπουλο & πουλερικά' },
  fish:       { emoji: '🐟', home: 'fridge',  fridge: 2,   freezer: 120, pantry: null, opened: null, thawed: 1, en: 'Fish & seafood',         el: 'Ψάρια & θαλασσινά' },
  deli:       { emoji: '🥓', home: 'fridge',  fridge: 10,  freezer: 60,  pantry: null, opened: 4,   thawed: 3, en: 'Cold cuts & deli',        el: 'Αλλαντικά' },
  vegetables: { emoji: '🥒', home: 'fridge',  fridge: 7,   freezer: 240, pantry: 4,    opened: 3,   thawed: 1, en: 'Vegetables',              el: 'Λαχανικά' },
  leafy:      { emoji: '🥬', home: 'fridge',  fridge: 5,   freezer: null, pantry: 1,   opened: 3,   thawed: 1, en: 'Salad & leafy greens',    el: 'Σαλάτες & χόρτα' },
  roots:      { emoji: '🥔', home: 'pantry',  fridge: 30,  freezer: null, pantry: 30,  opened: 5,   thawed: 1, en: 'Potatoes, onions, garlic', el: 'Πατάτες, κρεμμύδια, σκόρδα' },
  fruit:      { emoji: '🍎', home: 'fridge',  fridge: 14,  freezer: 240, pantry: 5,    opened: 2,   thawed: 1, en: 'Fruit',                   el: 'Φρούτα' },
  berries:    { emoji: '🍓', home: 'fridge',  fridge: 4,   freezer: 240, pantry: 1,    opened: 2,   thawed: 1, en: 'Berries & soft fruit',    el: 'Μούρα & μαλακά φρούτα' },
  herbs:      { emoji: '🌿', home: 'fridge',  fridge: 7,   freezer: 180, pantry: 3,    opened: 5,   thawed: 1, en: 'Fresh herbs',             el: 'Μυρωδικά' },
  bread:      { emoji: '🍞', home: 'pantry',  fridge: 7,   freezer: 90,  pantry: 4,    opened: 4,   thawed: 2, en: 'Bread & bakery',          el: 'Ψωμί & αρτοσκευάσματα' },
  dough:      { emoji: '🥟', home: 'fridge',  fridge: 21,  freezer: 180, pantry: null, opened: 3,   thawed: 5, en: 'Phyllo & dough',          el: 'Φύλλο & ζύμες' },
  leftovers:  { emoji: '🍲', home: 'fridge',  fridge: 3,   freezer: 90,  pantry: null, opened: null, thawed: 2, en: 'Leftovers & cooked food', el: 'Φαγητό & μαγειρεμένα' },
  dips:       { emoji: '🫙', home: 'fridge',  fridge: 7,   freezer: null, pantry: null, opened: 4,  thawed: 1, en: 'Dips & spreads',          el: 'Αλοιφές & σάλτσες ντιπ' },
  sauces:     { emoji: '🫙', home: 'pantry',  fridge: 90,  freezer: null, pantry: 365, opened: 30,  thawed: 7, en: 'Sauces, olives, jars',    el: 'Σάλτσες, ελιές, βάζα' },
  drinks:     { emoji: '🧃', home: 'fridge',  fridge: 14,  freezer: 180, pantry: 180,  opened: 5,   thawed: 3, en: 'Juice & drinks',          el: 'Χυμοί & ποτά' },
  canned:     { emoji: '🥫', home: 'pantry',  fridge: 365, freezer: null, pantry: 730, opened: 4,   thawed: 2, en: 'Canned food',             el: 'Κονσέρβες' },
  dry:        { emoji: '🍝', home: 'pantry',  fridge: null, freezer: null, pantry: 365, opened: 180, thawed: 2, en: 'Pasta, rice, legumes',   el: 'Ζυμαρικά, ρύζι, όσπρια' },
  snacks:     { emoji: '🍪', home: 'pantry',  fridge: null, freezer: null, pantry: 90, opened: 14,  thawed: 2, en: 'Snacks & sweets',         el: 'Σνακ & γλυκά' },
  desserts:   { emoji: '🍰', home: 'fridge',  fridge: 4,   freezer: 60,  pantry: null, opened: 3,   thawed: 2, en: 'Desserts & cakes',        el: 'Γλυκά & κέικ' },
  frozen:     { emoji: '🧊', home: 'freezer', fridge: 2,   freezer: 180, pantry: null, opened: null, thawed: 1, en: 'Frozen food',            el: 'Κατεψυγμένα' },
  other:      { emoji: '📦', home: 'fridge',  fridge: 7,   freezer: 90,  pantry: 90,   opened: 5,   thawed: 2, en: 'Other',                   el: 'Άλλο' },
};

/* Storage locations, in the order they appear in the app. */
export const LOCATIONS = ['fridge', 'freezer', 'pantry'];
export const LOCATION_EMOJI = { fridge: '🧊', freezer: '❄️', pantry: '🗄️' };

/* Quick-pick groups (section headings on the Add screen). */
export const PICK_GROUPS = [
  { id: 'veg',    en: 'Vegetables',          el: 'Λαχανικά' },
  { id: 'fruit',  en: 'Fruit',               el: 'Φρούτα' },
  { id: 'dairy',  en: 'Dairy & eggs',        el: 'Γαλακτοκομικά & αυγά' },
  { id: 'meat',   en: 'Meat & fish',         el: 'Κρέας & ψάρι' },
  { id: 'ready',  en: 'Cooked & ready',      el: 'Μαγειρεμένα & έτοιμα' },
  { id: 'bakery', en: 'Bakery & pantry',     el: 'Φούρνος & ντουλάπι' },
];

/* Quick picks: loose items without a barcode.
   id    : unique, lowercase English (also used for recipe matching)
   cat   : a key of CATEGORIES above
   loc   : optional — overrides the category's usual location
   days  : optional — overrides the category's shelf life for this item */
export const QUICK_PICKS = [
  // Vegetables
  { id: 'tomatoes',    group: 'veg', emoji: '🍅', cat: 'vegetables', days: 6,  en: 'Tomatoes',     el: 'Ντομάτες' },
  { id: 'cucumber',    group: 'veg', emoji: '🥒', cat: 'vegetables', days: 7,  en: 'Cucumber',     el: 'Αγγούρι' },
  { id: 'lettuce',     group: 'veg', emoji: '🥬', cat: 'leafy',               en: 'Lettuce',      el: 'Μαρούλι' },
  { id: 'peppers',     group: 'veg', emoji: '🫑', cat: 'vegetables', days: 8,  en: 'Peppers',      el: 'Πιπεριές' },
  { id: 'zucchini',    group: 'veg', emoji: '🥒', cat: 'vegetables', days: 5,  en: 'Zucchini',     el: 'Κολοκυθάκια' },
  { id: 'eggplant',    group: 'veg', emoji: '🍆', cat: 'vegetables', days: 5,  en: 'Eggplant',     el: 'Μελιτζάνες' },
  { id: 'carrots',     group: 'veg', emoji: '🥕', cat: 'vegetables', days: 21, en: 'Carrots',      el: 'Καρότα' },
  { id: 'onions',      group: 'veg', emoji: '🧅', cat: 'roots',                en: 'Onions',       el: 'Κρεμμύδια' },
  { id: 'potatoes',    group: 'veg', emoji: '🥔', cat: 'roots',                en: 'Potatoes',     el: 'Πατάτες' },
  { id: 'garlic',      group: 'veg', emoji: '🧄', cat: 'roots',      days: 60, en: 'Garlic',       el: 'Σκόρδο' },
  { id: 'mushrooms',   group: 'veg', emoji: '🍄', cat: 'vegetables', days: 5,  en: 'Mushrooms',    el: 'Μανιτάρια' },
  { id: 'spinach',     group: 'veg', emoji: '🥬', cat: 'leafy',      days: 4,  en: 'Spinach',      el: 'Σπανάκι' },
  { id: 'greens',      group: 'veg', emoji: '🌿', cat: 'leafy',      days: 4,  en: 'Horta (greens)', el: 'Χόρτα' },
  { id: 'broccoli',    group: 'veg', emoji: '🥦', cat: 'vegetables', days: 5,  en: 'Broccoli',     el: 'Μπρόκολο' },
  { id: 'greenbeans',  group: 'veg', emoji: '🫛', cat: 'vegetables', days: 5,  en: 'Green beans',  el: 'Φασολάκια' },
  { id: 'cabbage',     group: 'veg', emoji: '🥬', cat: 'vegetables', days: 14, en: 'Cabbage',      el: 'Λάχανο' },
  { id: 'parsley',     group: 'veg', emoji: '🌿', cat: 'herbs',                en: 'Parsley',      el: 'Μαϊντανός' },
  { id: 'dill',        group: 'veg', emoji: '🌿', cat: 'herbs',                en: 'Dill',         el: 'Άνηθος' },
  // Fruit
  { id: 'lemons',      group: 'fruit', emoji: '🍋', cat: 'fruit',  days: 21, en: 'Lemons',       el: 'Λεμόνια' },
  { id: 'apples',      group: 'fruit', emoji: '🍎', cat: 'fruit',  days: 21, en: 'Apples',       el: 'Μήλα' },
  { id: 'oranges',     group: 'fruit', emoji: '🍊', cat: 'fruit',  days: 14, en: 'Oranges',      el: 'Πορτοκάλια' },
  { id: 'bananas',     group: 'fruit', emoji: '🍌', cat: 'fruit',  loc: 'pantry', days: 5, en: 'Bananas', el: 'Μπανάνες' },
  { id: 'grapes',      group: 'fruit', emoji: '🍇', cat: 'fruit',  days: 7,  en: 'Grapes',       el: 'Σταφύλια' },
  { id: 'strawberries',group: 'fruit', emoji: '🍓', cat: 'berries',          en: 'Strawberries', el: 'Φράουλες' },
  { id: 'cherries',    group: 'fruit', emoji: '🍒', cat: 'berries', days: 5, en: 'Cherries',     el: 'Κεράσια' },
  { id: 'peaches',     group: 'fruit', emoji: '🍑', cat: 'berries', days: 5, en: 'Peaches',      el: 'Ροδάκινα' },
  { id: 'watermelon',  group: 'fruit', emoji: '🍉', cat: 'fruit',  days: 4,  en: 'Watermelon (cut)', el: 'Καρπούζι (κομμένο)' },
  { id: 'pears',       group: 'fruit', emoji: '🍐', cat: 'fruit',  days: 7,  en: 'Pears',        el: 'Αχλάδια' },
  { id: 'kiwi',        group: 'fruit', emoji: '🥝', cat: 'fruit',  days: 14, en: 'Kiwi',         el: 'Ακτινίδια' },
  { id: 'avocado',     group: 'fruit', emoji: '🥑', cat: 'fruit',  loc: 'pantry', days: 4, en: 'Avocado', el: 'Αβοκάντο' },
  // Dairy & eggs
  { id: 'milk',        group: 'dairy', emoji: '🥛', cat: 'milk',                en: 'Milk',          el: 'Γάλα' },
  { id: 'yogurt',      group: 'dairy', emoji: '🥣', cat: 'yogurt',              en: 'Greek yogurt',  el: 'Γιαούρτι' },
  { id: 'feta',        group: 'dairy', emoji: '🧀', cat: 'softcheese',          en: 'Feta',          el: 'Φέτα' },
  { id: 'graviera',    group: 'dairy', emoji: '🧀', cat: 'cheese',              en: 'Graviera',      el: 'Γραβιέρα' },
  { id: 'kasseri',     group: 'dairy', emoji: '🧀', cat: 'cheese',   days: 21,  en: 'Kasseri',       el: 'Κασέρι' },
  { id: 'mizithra',    group: 'dairy', emoji: '🧀', cat: 'softcheese', days: 7, en: 'Mizithra / Anthotyros', el: 'Μυζήθρα / Ανθότυρος' },
  { id: 'halloumi',    group: 'dairy', emoji: '🧀', cat: 'cheese',              en: 'Halloumi',      el: 'Χαλούμι' },
  { id: 'butter',      group: 'dairy', emoji: '🧈', cat: 'butter',              en: 'Butter',        el: 'Βούτυρο' },
  { id: 'cream',       group: 'dairy', emoji: '🥛', cat: 'yogurt',   days: 10,  en: 'Cooking cream', el: 'Κρέμα γάλακτος' },
  { id: 'eggs',        group: 'dairy', emoji: '🥚', cat: 'eggs',                en: 'Eggs',          el: 'Αυγά' },
  // Meat & fish
  { id: 'chicken',     group: 'meat', emoji: '🍗', cat: 'poultry',             en: 'Chicken',       el: 'Κοτόπουλο' },
  { id: 'minced',      group: 'meat', emoji: '🥩', cat: 'mince',               en: 'Minced meat',   el: 'Κιμάς' },
  { id: 'pork',        group: 'meat', emoji: '🥩', cat: 'meat',                en: 'Pork',          el: 'Χοιρινό' },
  { id: 'beef',        group: 'meat', emoji: '🥩', cat: 'meat',                en: 'Beef',          el: 'Μοσχάρι' },
  { id: 'lamb',        group: 'meat', emoji: '🍖', cat: 'meat',                en: 'Lamb',          el: 'Αρνί' },
  { id: 'souvlaki',    group: 'meat', emoji: '🍢', cat: 'meat',     days: 2,   en: 'Souvlaki / gyros (raw)', el: 'Σουβλάκια / γύρος (ωμά)' },
  { id: 'sausages',    group: 'meat', emoji: '🌭', cat: 'meat',     days: 5,   en: 'Sausages',      el: 'Λουκάνικα' },
  { id: 'ham',         group: 'meat', emoji: '🥓', cat: 'deli',                en: 'Ham / turkey',  el: 'Ζαμπόν / γαλοπούλα' },
  { id: 'bacon',       group: 'meat', emoji: '🥓', cat: 'deli',     days: 7,   en: 'Bacon',         el: 'Μπέικον' },
  { id: 'fish',        group: 'meat', emoji: '🐟', cat: 'fish',                en: 'Fish',          el: 'Ψάρι' },
  { id: 'sardines',    group: 'meat', emoji: '🐟', cat: 'fish',     days: 1,   en: 'Sardines / anchovies', el: 'Σαρδέλες / γαύρος' },
  { id: 'shrimp',      group: 'meat', emoji: '🦐', cat: 'fish',                en: 'Shrimp',        el: 'Γαρίδες' },
  { id: 'octopus',     group: 'meat', emoji: '🐙', cat: 'fish',                en: 'Octopus / squid', el: 'Χταπόδι / καλαμάρι' },
  // Cooked & ready
  { id: 'leftovers',   group: 'ready', emoji: '🍲', cat: 'leftovers',           en: 'Leftovers',     el: 'Φαγητό που περίσσεψε' },
  { id: 'moussaka',    group: 'ready', emoji: '🍝', cat: 'leftovers', days: 4,  en: 'Moussaka / pastitsio', el: 'Μουσακάς / παστίτσιο' },
  { id: 'gemista',     group: 'ready', emoji: '🫑', cat: 'leftovers',           en: 'Gemista',       el: 'Γεμιστά' },
  { id: 'pie',         group: 'ready', emoji: '🥧', cat: 'leftovers', days: 4,  en: 'Spanakopita / pie', el: 'Σπανακόπιτα / πίτα' },
  { id: 'soup',        group: 'ready', emoji: '🍜', cat: 'leftovers',           en: 'Soup',          el: 'Σούπα' },
  { id: 'tzatziki',    group: 'ready', emoji: '🥣', cat: 'dips',      days: 5,  en: 'Tzatziki',      el: 'Τζατζίκι' },
  { id: 'taramosalata',group: 'ready', emoji: '🫙', cat: 'dips',               en: 'Taramosalata',  el: 'Ταραμοσαλάτα' },
  { id: 'hummus',      group: 'ready', emoji: '🫙', cat: 'dips',      days: 5,  en: 'Hummus',        el: 'Χούμους' },
  { id: 'olives',      group: 'ready', emoji: '🫒', cat: 'sauces',    loc: 'fridge', days: 60, en: 'Olives', el: 'Ελιές' },
  { id: 'dessert',     group: 'ready', emoji: '🍰', cat: 'desserts',            en: 'Cake / dessert', el: 'Γλυκό / κέικ' },
  // Bakery & pantry
  { id: 'bread',       group: 'bakery', emoji: '🍞', cat: 'bread',              en: 'Bread',         el: 'Ψωμί' },
  { id: 'koulouri',    group: 'bakery', emoji: '🥯', cat: 'bread',   days: 2,   en: 'Koulouri',      el: 'Κουλούρι' },
  { id: 'pita',        group: 'bakery', emoji: '🫓', cat: 'bread',   loc: 'fridge', days: 7, en: 'Pita bread', el: 'Πίτες για σουβλάκι' },
  { id: 'phyllo',      group: 'bakery', emoji: '🥟', cat: 'dough',              en: 'Phyllo pastry', el: 'Φύλλο κρούστας' },
  { id: 'juice',       group: 'bakery', emoji: '🧃', cat: 'drinks',  days: 10,  en: 'Orange juice',  el: 'Χυμός πορτοκάλι' },
  { id: 'passata',     group: 'bakery', emoji: '🥫', cat: 'canned',             en: 'Tomato passata', el: 'Πασάτα / τοματάκι' },
  { id: 'pasta',       group: 'bakery', emoji: '🍝', cat: 'dry',                en: 'Pasta',         el: 'Μακαρόνια' },
  { id: 'rice',        group: 'bakery', emoji: '🍚', cat: 'dry',                en: 'Rice',          el: 'Ρύζι' },
];

/* Maps Open Food Facts category tags to our categories.
   Checked top to bottom; the first rule with a matching tag wins,
   so keep specific rules above general ones. */
export const OFF_CATEGORY_RULES = [
  ['softcheese', ['en:feta', 'en:white-cheeses', 'en:fresh-cheeses', 'en:cream-cheeses', 'en:mozzarella']],
  ['cheese',     ['en:cheeses']],
  ['butter',     ['en:butters']],
  ['yogurt',     ['en:yogurts', 'en:greek-style-yogurts', 'en:creams']],
  ['milk',       ['en:milks', 'en:plant-milks', 'en:dairy-drinks']],
  ['eggs',       ['en:eggs', 'en:chicken-eggs']],
  ['mince',      ['en:minced-meats', 'en:ground-meats']],
  ['deli',       ['en:hams', 'en:cold-cuts', 'en:prepared-meats', 'en:salamis', 'en:bacons', 'en:turkey-breast']],
  ['poultry',    ['en:poultries', 'en:chickens', 'en:chicken-meats']],
  ['fish',       ['en:fishes', 'en:seafood', 'en:smoked-fishes', 'en:crustaceans']],
  ['meat',       ['en:meats']],
  ['frozen',     ['en:frozen-foods', 'en:frozen-desserts', 'en:ice-creams']],
  ['dips',       ['en:dips', 'en:hummus', 'en:tzatziki', 'en:spreads']],
  ['canned',     ['en:canned-foods', 'en:canned-vegetables', 'en:canned-fishes']],
  ['sauces',     ['en:sauces', 'en:condiments', 'en:olives', 'en:pickles', 'en:jams', 'en:honeys']],
  ['drinks',     ['en:juices', 'en:fruit-juices', 'en:beverages', 'en:waters']],
  ['dough',      ['en:doughs', 'en:puff-pastries', 'en:phyllo']],
  ['bread',      ['en:breads', 'en:bakery-products', 'en:toasts', 'en:viennoiseries']],
  ['leafy',      ['en:salads', 'en:leaf-vegetables']],
  ['berries',    ['en:berries', 'en:strawberries']],
  ['fruit',      ['en:fruits', 'en:fresh-fruits']],
  ['vegetables', ['en:vegetables', 'en:fresh-vegetables']],
  ['dry',        ['en:pastas', 'en:rices', 'en:legumes', 'en:cereals-and-their-products', 'en:flours', 'en:breakfast-cereals']],
  ['snacks',     ['en:snacks', 'en:biscuits', 'en:chocolates', 'en:confectioneries', 'en:crisps']],
  ['desserts',   ['en:desserts', 'en:cakes']],
];

/* Receipts: word stems that hint at a category for a receipt line the app
   doesn't know yet. Each stem matches words that START with it (accents and
   case don't matter); start it with '=' to match the whole word only.
   Words are checked in the order they appear on the line, and the first
   category that matches wins — so keep specific categories above general
   ones (vegetables above dry, so "φασολάκια" isn't read as dried beans). */
export const RECEIPT_HINTS = [
  ['snacks',     ['σοκολατ', 'μπισκοτ', 'πατατακ', 'γκοφρετ', 'καραμελ', 'κρακερ', 'chips', 'crisps', 'schoko', 'keks', 'biscuit', 'cookie', 'chocolat', 'cracker', 'gummi']],
  ['frozen',     ['κατεψ', 'παγωτ', 'frozen', 'tiefk', 'surgel', 'congel']],
  ['milk',       ['γαλα', 'milch', 'vollmilch', 'milk', 'lait', 'latte', 'leche', 'mleko']],
  ['yogurt',     ['γιαουρτ', 'κρεμα', 'joghurt', 'jogurt', 'yogurt', 'yoghurt', 'yaourt', 'skyr', 'quark', 'sahne', 'cream', 'creme']],
  ['softcheese', ['φετα', 'μυζηθρ', 'ανθοτυρ', 'μοτσαρελ', 'ρικοτ', 'cottage', 'mozzarella', 'ricotta', 'feta', 'frischk', 'mascarpone']],
  ['cheese',     ['τυρι', 'γραβιερ', 'κασερ', 'κεφαλοτυρ', 'γκουντα', 'εμμενταλ', 'παρμεζαν', 'χαλουμ', 'kase', 'cheese', 'gouda', 'emmentaler', 'parmesan', 'cheddar', 'fromage', 'formaggio', 'queso']],
  ['butter',     ['βουτυρ', 'μαργαριν', 'butter', 'beurre', 'burro', 'margarin']],
  ['eggs',       ['αυγα', 'αυγο', 'eier', 'eggs', 'oeufs', 'uova', 'huevos']],
  ['mince',      ['κιμα', 'hackfleisch', 'mince', 'minced']],
  ['poultry',    ['κοτοπουλ', 'hahnchen', 'huhn', 'chicken', 'poulet', 'pollo']],
  ['deli',       ['ζαμπον', 'γαλοπουλ', 'σαλαμ', 'μορταδελ', 'μπεικον', 'προσουτ', 'παριζα', 'schinken', 'salami', 'wurst', 'bacon', '=ham']],
  ['fish',       ['ψαρι', 'σολομ', 'γαριδ', 'καλαμαρ', 'χταποδ', 'μυδι', 'lachs', 'fisch', 'fish', 'salmon', 'shrimp', 'garnel']],
  ['meat',       ['μοσχαρ', 'χοιριν', 'αρνι', 'κρεασ', 'μπριζολ', 'σουβλακ', 'λουκανικ', 'rind', 'schwein', 'fleisch', 'steak', 'beef', 'pork', 'lamb', 'sausage']],
  ['vegetables', ['ντοματ', 'αγγουρ', 'πιπερι', 'κολοκυθ', 'μελιτζαν', 'καροτ', 'μπροκολ', 'λαχαν', 'φασολακ', 'μανιταρ', 'tomat', 'gurke', 'paprika', 'karotte', 'mohre', 'zucchin', 'brokkoli', 'pilze', 'champignon']],
  ['leafy',      ['μαρουλ', 'σπανακ', 'ρουκα', 'χορτα', 'lettuce', 'salat', 'spinat', 'rucola']],
  ['roots',      ['πατατ', 'κρεμμυδ', 'σκορδ', 'kartoffel', 'zwiebel', 'knoblauch', 'potato', 'onion', 'garlic']],
  ['berries',    ['φραουλ', 'κερασ', 'ροδακιν', 'βερικοκ', 'μυρτιλ', 'erdbeer', 'kirsch', 'beere', 'berries', 'strawberr']],
  ['fruit',      ['μηλα', 'πορτοκαλ', 'μπαναν', 'λεμον', 'αχλαδ', 'σταφυλ', 'ακτινιδ', 'καρπουζ', 'πεπον', 'apfel', 'banan', 'orange', 'zitrone', 'birne', 'traube', 'apple', 'lemon', 'fruit', 'obst']],
  ['herbs',      ['μαιντανο', 'ανηθ', 'δυοσμ', 'βασιλικ', 'petersilie', 'basilikum', 'parsley', '=dill']],
  ['bread',      ['ψωμ', 'αρτοσ', 'φρατζολ', 'τοστ', 'κρουασαν', 'κουλουρ', 'brot', 'toast', 'croissant', 'bread', 'baguette']],
  ['dough',      ['φυλλο', 'ζυμη', 'blatterteig', 'teig', 'dough']],
  ['dips',       ['τζατζικ', 'ταραμ', 'χουμουσ', 'hummus', 'aufstrich']],
  ['sauces',     ['σαλτσ', 'κετσαπ', 'μουσταρδ', 'μαγιονεζ', 'ελιεσ', 'μελι', 'μαρμελαδ', 'ελαιολαδ', 'λαδι', 'ξυδι', 'ketchup', 'senf', 'mayo', 'honig', 'marmelade', 'olive', 'sauce']],
  ['drinks',     ['χυμοσ', 'νερο', 'αναψυκτ', 'μπυρ', 'κρασι', 'cola', 'saft', 'wasser', 'bier', 'wein', 'juice', 'water', 'beer', 'wine', 'limonade']],
  ['canned',     ['κονσερβ', 'τονοσ', 'καλαμποκ', 'thunfisch', 'canned', 'tuna']],
  ['dry',        ['μακαρον', 'ζυμαρ', 'σπαγγετ', 'πεννε', 'κριθαρακ', 'ρυζι', 'φακεσ', 'φασολ', 'ρεβιθ', 'αλευρ', 'ζαχαρ', 'δημητριακ', 'βρωμ', 'nudeln', 'spaghetti', 'reis', 'mehl', 'zucker', 'linsen', 'pasta', 'rice', 'flour', 'sugar', 'cereal', 'hafer']],
  ['desserts',   ['κεικ', 'τουρτ', 'κουλουρακ', 'kuchen', 'torte', 'dessert', 'pudding']],
];

/* Receipts: lines that aren't food — bags, bottle deposits, household
   goods. They're left unticked when a receipt is read (you can still tick
   them). Same stem rules as RECEIPT_HINTS. */
export const NOT_FOOD_WORDS = [
  'σακουλ', 'σακκουλ', 'τσαντ', 'εγγυοδοσ', 'εγγυησ', 'περιβαλλοντικ', 'ανακυκλ',
  'απορρυπ', 'μαλακτικ', 'χλωριν', 'καθαριστ', 'χαρτι', 'χαρτομαντ', 'χαρτοπετσ', 'σαμπουαν', 'αφρολουτρ',
  'σαπουν', 'οδοντο', 'αποσμητ', 'ξυραφ', 'σερβιετ', '=πανεσ', 'μωρομαντ', 'σφουγγ', 'αλουμινοχαρτ', 'μεμβραν', 'μπαταρ',
  'pfand', 'leergut', 'tasche', 'tragetasche', '=tute', 'waschmittel', 'spulmittel', 'weichspul', 'toilettenpap',
  'klopapier', 'kuchenroll', 'taschentuch', 'shampoo', 'duschgel', 'zahnpast', 'zahnburst', 'seife', 'deodor', 'windel', 'batteri',
  'deposit', '=bag', '=bags', 'detergent', 'toilet', 'tissue', 'bleach', 'sponge', 'diaper', 'nappies', 'consigne', '=sac', 'statiegeld',
];
