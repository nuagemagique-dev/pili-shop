/*
 * The illustrated ingredient icons (public/images/ingredients, 64x64 SVGs drawn for the 2026 redesign): one per thing
 * that goes in a bowl, matched to a choice or product NAME by keyword in the four locales of the seeds, since the
 * catalogue is the dashboard's and ships no icon ids. The bowl composer tiles, the static menu and the product cards
 * without photography all draw from this one list, so an ingredient looks the same everywhere.
 *
 * Order matters, the first pattern wins: "boulettes de poisson" is a fish ball before "poisson" means anything,
 * "peau de tofu" before "tofu", "pleurote royal" before "pleurote", "chou chinois" before "chou".
 */

export const INGREDIENT_ICON_KEYS = [
  'fish-balls',
  'beef-balls',
  'quail-eggs',
  'tofu-skin',
  'fried-tofu',
  'silken-tofu',
  'tofu',
  'sweet-potato-noodles',
  'rice-vermicelli',
  'udon',
  'instant-noodles',
  'enoki',
  'shiitake',
  'king-oyster',
  'oyster-mushroom',
  'wood-ear',
  'kombu',
  'bean-sprouts',
  'pak-choi',
  'chinese-cabbage',
  'spinach',
  'lettuce',
  'broccoli',
  'corn',
  'potato',
  'lotus-root',
  'shrimp',
  'squid',
  'surimi',
  'pork-belly',
  'lamb',
  'sausage',
  'beef-slices',
] as const

/** The dishes and drinks of the menu that have an illustration instead of a photo (public/images/illustrations). */
export const ILLUSTRATION_KEYS = [
  'dumplings',
  'baozi',
  'spring-rolls',
  'cucumber',
  'noodle-bowl',
  'iced-tea',
  'plum-juice',
  'soda-can',
  'water',
] as const

export type IngredientIconKey = (typeof INGREDIENT_ICON_KEYS)[number]
export type IllustrationKey = (typeof ILLUSTRATION_KEYS)[number]
export type FoodIconKey = IngredientIconKey | IllustrationKey

const ICON_KEYWORDS: readonly { key: FoodIconKey; pattern: RegExp }[] = [
  { key: 'fish-balls', pattern: /boulettes? de poisson|fish ?balls?|visbal|鱼丸|鱼豆腐|鱼圆/iu },
  {
    key: 'beef-balls',
    pattern:
      /boulettes? de (?:bœuf|boeuf|viande|porc)|beef ?balls?|meat ?balls?|gehaktbal|vleesbal|牛肉丸|肉丸|丸子|撒尿/iu,
  },
  // "bœuf" and "boeuf" contain the egg: an egg starts a word.
  {
    key: 'quail-eggs',
    pattern: /caille|quail|kwartel|鹌鹑|(?<!\p{L})(?:œuf|oeuf)|eggs?\b|\bei\b|eieren|蛋/iu,
  },
  { key: 'tofu-skin', pattern: /peau de tofu|tofu ?skin|yuba|tofuvel|腐竹|豆皮|千张|油皮/iu },
  {
    key: 'fried-tofu',
    pattern: /tofu frit|fried tofu|gefrituurde tofu|gebakken tofu|油豆腐|炸豆腐|豆泡/iu,
  },
  { key: 'silken-tofu', pattern: /tofu soyeux|silken|zijden ?tofu|嫩豆腐|内酯|日本豆腐/iu },
  { key: 'tofu', pattern: /tofu|bean ?curd|豆腐|豆干/iu },
  {
    key: 'sweet-potato-noodles',
    pattern:
      /patate douce|sweet potato|zoete aardappel|红薯|vermicelle|glass ?noodle|glasnoedel|粉条|粉丝|宽粉|川粉/iu,
  },
  {
    key: 'rice-vermicelli',
    pattern: /nouilles? de riz|rice ?(?:noodle|vermicelli)|rijstnoedel|米粉|米线|河粉/iu,
  },
  { key: 'udon', pattern: /udon|乌冬/iu },
  { key: 'instant-noodles', pattern: /instantan|instant|方便面|泡面|拉面/iu },
  { key: 'enoki', pattern: /enoki|金针/iu },
  { key: 'shiitake', pattern: /shiitak|香菇|冬菇|花菇/iu },
  { key: 'king-oyster', pattern: /pleurote royal|king ?oyster|eryngii|kruidenzwam|杏鲍菇/iu },
  {
    key: 'oyster-mushroom',
    pattern: /pleurote|oyster ?mushroom|oesterzwam|平菇|蘑菇|口蘑|蟹味菇|海鲜菇/iu,
  },
  {
    key: 'wood-ear',
    pattern: /champignon noir|oreille de judas|wood ?ear|black fungus|judasoor|木耳|银耳/iu,
  },
  { key: 'kombu', pattern: /kombu|algue|seaweed|kelp|zeewier|海带|昆布|裙带/iu },
  { key: 'bean-sprouts', pattern: /pousses? de soja|germes? de soja|bean ?sprouts?|taug|豆芽/iu },
  { key: 'pak-choi', pattern: /pak ?cho|bok ?cho|paksoi|油菜|小白菜|青菜|上海青/iu },
  {
    key: 'chinese-cabbage',
    pattern:
      /chou chinois|napa|chinese ?cabbage|chinese kool|大白菜|娃娃菜|白菜|\bchou\b|cabbage|kool\b/iu,
  },
  { key: 'spinach', pattern: /épinard|epinard|spinach|spinazie|菠菜/iu },
  { key: 'lettuce', pattern: /laitue|lettuce|\bsla\b|生菜|油麦菜|莴/iu },
  { key: 'broccoli', pattern: /brocoli|broccoli|西兰花|西蓝花/iu },
  { key: 'corn', pattern: /maïs|\bmais\b|\bcorn\b|玉米/iu },
  { key: 'potato', pattern: /pomme de terre|pommes de terre|potato|aardappel|土豆|马铃薯|薯片/iu },
  { key: 'lotus-root', pattern: /lotus|藕/iu },
  { key: 'shrimp', pattern: /crevette|shrimp|prawn|garnaal|garnalen|虾/iu },
  { key: 'squid', pattern: /calamar|calmar|squid|inktvis|鱿鱼|鱿|墨鱼/iu },
  { key: 'surimi', pattern: /surimi|crabe|crab|krab|蟹/iu },
  { key: 'pork-belly', pattern: /porc|pork|varken|五花|猪|午餐肉|luncheon|spam/iu },
  { key: 'lamb', pattern: /agneau|mouton|lamb|\blam\b|lamsvlees|羊/iu },
  { key: 'sausage', pattern: /saucisse|sausage|worst|香肠|腊肠|火腿|肠/iu },
  { key: 'beef-slices', pattern: /bœuf|boeuf|beef|rund|牛/iu },
  // Dishes and drinks (illustrations)
  { key: 'dumplings', pattern: /ravioli|dumpling|gyoza|jiaozi|wonton|饺|馄饨|抄手/iu },
  { key: 'baozi', pattern: /baozi|\bbao\b|brioche|包子/iu },
  { key: 'spring-rolls', pattern: /rouleau|spring ?roll|loempia|春卷/iu },
  { key: 'cucumber', pattern: /concombre|cucumber|komkommer|黄瓜/iu },
  { key: 'noodle-bowl', pattern: /nouille|noodle|noedel|\b面\b|面条|拌面|汤面/iu },
  {
    key: 'iced-tea',
    pattern: /thé glacé|the glace|iced ?tea|ijsthee|冰茶|柠檬茶|litchi|lychee|荔枝/iu,
  },
  { key: 'plum-juice', pattern: /prune|plum|pruim|酸梅|梅/iu },
  { key: 'soda-can', pattern: /coca|cola|soda|sprite|fanta|limonade|可乐|汽水|雪碧|芬达/iu },
  { key: 'water', pattern: /\beau\b|water|矿泉水|\b水\b/iu },
]

const ILLUSTRATIONS = new Set<string>(ILLUSTRATION_KEYS)

/** Site-relative path of an icon: the ingredient set, or the dish and drink illustrations. */
export const foodIconSrc = (key: FoodIconKey): string =>
  `/images/${ILLUSTRATIONS.has(key) ? 'illustrations' : 'ingredients'}/${key}.svg`

/** The icon key a choice or product name maps to, if its name says what it is. */
export const foodIconKey = (name: string): FoodIconKey | undefined =>
  ICON_KEYWORDS.find(({ pattern }) => pattern.test(name))?.key

/** The icon of a choice or product name, if its name says what it is. */
export const foodIconFor = (name: string): { key: FoodIconKey; src: string } | undefined => {
  const key = foodIconKey(name)
  return key === undefined ? undefined : { key, src: foodIconSrc(key) }
}

/*
 * The products that are still awaiting photography (data/productPhotos.ts) by slug (tsb-service/seeds/ygfliege_menu.sql):
 * their card and dialog show the illustration instead of the logo placeholder. A dashboard upload still wins (the
 * illustration is only the fallback of a missing S3 image), and any product not listed here falls back to its name.
 */
const ILLUSTRATION_BY_SLUG: Record<string, IllustrationKey> = {
  'raviolis-chinois': 'dumplings',
  'rouleaux-de-printemps': 'spring-rolls',
  'salade-concombre': 'cucumber',
  'baozi-porc': 'baozi',
  'nouilles-boeuf-braise': 'noodle-bowl',
  'nouilles-fruits-de-mer': 'noodle-bowl',
  'coca-cola': 'soda-can',
  'coca-cola-zero': 'soda-can',
  'the-glace-litchi': 'iced-tea',
  'jus-de-prune': 'plum-juice',
  'eau-minerale': 'water',
}

/** The illustration to show for a product without a photo: by slug, else by what its name says. */
export const productIllustration = (
  slug: string | null | undefined,
  name: string,
): { key: FoodIconKey; src: string } | undefined => {
  const bySlug =
    slug !== undefined && slug !== null && Object.hasOwn(ILLUSTRATION_BY_SLUG, slug)
      ? ILLUSTRATION_BY_SLUG[slug]
      : undefined
  if (bySlug !== undefined) return { key: bySlug, src: foodIconSrc(bySlug) }
  // A product is a dish: its illustration before one of its ingredients ("Gyoza de bœuf" is dumplings, not beef).
  const dish = ICON_KEYWORDS.find(
    ({ key, pattern }) => ILLUSTRATIONS.has(key) && pattern.test(name),
  )?.key
  if (dish !== undefined) return { key: dish, src: foodIconSrc(dish) }
  return foodIconFor(name)
}
