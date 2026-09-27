// Crop Doctor knowledge base.
//
// A farmer picks the crop and the signs they see. `diagnose()` scores every
// problem by how strongly its signs match and returns the likely causes with
// the fertilizer / treatment, tools and steps needed to fix them.
//
// These are general field guides (PhilRice / DA / IRRI style practices), not a
// lab diagnosis. The app always reminds farmers to confirm with their
// Municipal Agriculture Office and to follow product labels.

export const SYMPTOM_GROUPS = [
  { id: 'leaves', label: 'Leaves', tl: 'Dahon', emoji: '🍃' },
  { id: 'plant', label: 'Stem & whole plant', tl: 'Tangkay at buong halaman', emoji: '🌿' },
  { id: 'fruit', label: 'Grains & fruits', tl: 'Butil at bunga', emoji: '🍅' },
  { id: 'field', label: 'Field & soil', tl: 'Bukid at lupa', emoji: '🟫' },
]

// `crops` limits a sign to the crops it applies to; omitted = every crop.
export const SYMPTOMS = [
  { id: 'yellow_old', group: 'leaves', label: 'Older / lower leaves turning yellow', tl: 'Naninilaw ang lumang dahon' },
  { id: 'yellow_young', group: 'leaves', label: 'Young / top leaves turning yellow', tl: 'Naninilaw ang bagong dahon' },
  { id: 'yellow_veins', group: 'leaves', label: 'Yellow between the leaf veins', tl: 'Dilaw sa pagitan ng ugat ng dahon' },
  { id: 'purple', group: 'leaves', label: 'Purple or reddish leaves', tl: 'Nangungulay-ube o pula ang dahon' },
  { id: 'brown_edges', group: 'leaves', label: 'Brown, burnt leaf tips & edges', tl: 'Parang sunog ang dulo ng dahon' },
  { id: 'spots_diamond', group: 'leaves', label: 'Diamond / eye-shaped spots, gray center', tl: 'Hugis-mata na batik', crops: ['rice'] },
  { id: 'spots_brown', group: 'leaves', label: 'Small brown round spots', tl: 'Maliliit na kayumangging batik' },
  { id: 'leaf_streak', group: 'leaves', label: 'Leaf edges drying, yellow-white wavy streaks', tl: 'Natutuyo ang gilid ng dahon', crops: ['rice'] },
  { id: 'orange_leaves', group: 'leaves', label: 'Orange-yellow leaves on stunted hills', tl: 'Kulay-dalandan ang dahon', crops: ['rice'] },
  { id: 'white_powder', group: 'leaves', label: 'White powder on leaves', tl: 'Parang may pulbos na puti', crops: ['vegetables', 'fruit', 'root'] },
  { id: 'holes', group: 'leaves', label: 'Holes or chewed leaves', tl: 'May butas o kinain ang dahon' },
  { id: 'sawdust_whorl', group: 'leaves', label: 'Sawdust-like dirt in the whorl / leaf center', tl: 'May parang kusot sa ubod', crops: ['corn'] },
  { id: 'curling', group: 'leaves', label: 'Curled or crinkled leaves', tl: 'Kulubot o kulot ang dahon' },
  { id: 'tiny_insects', group: 'leaves', label: 'Tiny insects under leaves / sticky leaves', tl: 'Maliliit na insekto, malagkit ang dahon' },
  { id: 'too_lush', group: 'leaves', label: 'Very dark green, soft & lush leaves', tl: 'Sobrang berde at malambot' },
  { id: 'wilting_wet', group: 'plant', label: 'Wilting even if soil is wet', tl: 'Nalalanta kahit basa ang lupa' },
  { id: 'wilting_dry', group: 'plant', label: 'Wilting and soil is dry / cracked', tl: 'Nalalanta, tuyo ang lupa' },
  { id: 'stunted', group: 'plant', label: 'Stunted or slow growth', tl: 'Bansot o mabagal lumaki' },
  { id: 'hopperburn', group: 'plant', label: 'Round patches of dried brown plants', tl: 'Bilog na patse ng tuyong palay', crops: ['rice'] },
  { id: 'deadheart', group: 'plant', label: 'Dead center shoot or white empty heads', tl: 'Patay ang ubod / puting uhay', crops: ['rice', 'corn'] },
  { id: 'cut_tillers', group: 'plant', label: 'Stems cut at the base / missing plants', tl: 'Putol ang puno / nawawalang tanim' },
  { id: 'stem_rot', group: 'plant', label: 'Rotting stem base, bad smell', tl: 'Nabubulok ang puno, mabaho' },
  { id: 'lodging', group: 'plant', label: 'Plants falling over (lodging)', tl: 'Nadadapa ang tanim', crops: ['rice', 'corn'] },
  { id: 'empty_grains', group: 'fruit', label: 'Empty or unfilled grains', tl: 'Ipa / walang laman ang butil', crops: ['rice', 'corn'] },
  { id: 'panicle_bugs', group: 'fruit', label: 'Long slender bugs on grains, bad smell', tl: 'Atangya sa uhay, mabaho', crops: ['rice'] },
  { id: 'fruit_holes', group: 'fruit', label: 'Holes or worms in fruits, pods or ears', tl: 'May butas o uod ang bunga' },
  { id: 'fruit_rot', group: 'fruit', label: 'Rotting fruits with dark sunken spots', tl: 'Nabubulok ang bunga', crops: ['vegetables', 'fruit', 'root'] },
  { id: 'weeds', group: 'field', label: 'Many weeds competing with crop', tl: 'Maraming damo', },
  { id: 'snails', group: 'field', label: 'Pink egg masses / snails, seedlings eaten', tl: 'Kuhol at pink na itlog', crops: ['rice'] },
  { id: 'waterlogged', group: 'field', label: 'Standing water / soggy soil for days', tl: 'Laging lubog sa tubig' },
]

export const PROBLEM_TYPES = {
  nutrient: { label: 'Nutrient problem', emoji: '🧪' },
  disease: { label: 'Disease', emoji: '🦠' },
  pest: { label: 'Pest', emoji: '🐛' },
  water: { label: 'Water problem', emoji: '💧' },
  soil: { label: 'Soil / field problem', emoji: '🟫' },
}

// items: what to apply/buy. `cat` maps to a budget category so the farmer can
// record the purchase in one tap.
export const CONDITIONS = [
  {
    id: 'nitrogen_def',
    name: 'Nitrogen (N) deficiency',
    tl: 'Kulang sa Nitrogen',
    type: 'nutrient',
    crops: 'all',
    signs: { yellow_old: 4, stunted: 2 },
    about: 'Plants move nitrogen from old leaves to new ones, so the lower leaves turn pale yellow first and the plant grows slowly.',
    items: [
      { name: 'Urea (46-0-0)', note: 'Top-dress in split doses', cat: 'fertilizer' },
      { name: 'Ammonium sulfate (21-0-0)', note: 'Good for sulfur-poor soils', cat: 'fertilizer' },
      { name: 'Vermicast / chicken manure', note: 'Organic option, slower', cat: 'fertilizer' },
    ],
    tools: [
      { name: 'Leaf Color Chart (LCC)', note: 'Tells rice farmers when to add N', cat: 'tool_buy' },
      { name: 'Pail or fertilizer spreader', cat: 'tool_buy' },
    ],
    steps: [
      'Check that the yellowing starts on the lowest, oldest leaves.',
      'Apply nitrogen in small split doses instead of one big dose.',
      'For rice, use the Leaf Color Chart: add N only when leaves read below the target shade.',
      'Apply when the soil is moist; for rice keep shallow water so it is not washed away.',
    ],
    prevent: 'Get a soil test and follow the recommended rate. Too much nitrogen invites pests and lodging.',
  },
  {
    id: 'phosphorus_def',
    name: 'Phosphorus (P) deficiency',
    tl: 'Kulang sa Phosphorus',
    type: 'nutrient',
    crops: 'all',
    signs: { purple: 4, stunted: 2 },
    about: 'Low phosphorus makes leaves dark or purplish and slows root growth, tillering and flowering.',
    items: [
      { name: 'Solophos (0-18-0)', note: 'Apply as basal before planting', cat: 'fertilizer' },
      { name: 'Ammophos (16-20-0)', cat: 'fertilizer' },
      { name: 'Complete fertilizer (14-14-14)', cat: 'fertilizer' },
    ],
    tools: [
      { name: 'Soil Test Kit (BSWM / DA)', cat: 'tool_buy' },
      { name: 'Hoe (asarol) to mix into soil', cat: 'tool_buy' },
    ],
    steps: [
      'Phosphorus works best applied early — at land prep or planting.',
      'Mix it into the soil near the roots, not just on top.',
      'Add compost or manure to help plants take up phosphorus.',
    ],
    prevent: 'Apply basal fertilizer every season based on a soil test.',
  },
  {
    id: 'potassium_def',
    name: 'Potassium (K) deficiency',
    tl: 'Kulang sa Potassium',
    type: 'nutrient',
    crops: 'all',
    signs: { brown_edges: 4, lodging: 2, spots_brown: 1, empty_grains: 1 },
    about: 'Leaf tips and edges look scorched, stems are weak and grains or fruits fill poorly.',
    items: [
      { name: 'Muriate of Potash (0-0-60)', cat: 'fertilizer' },
      { name: 'Complete fertilizer (14-14-14)', cat: 'fertilizer' },
      { name: 'Rice straw / ash returned to field', note: 'Free source of potassium', cat: 'fertilizer' },
    ],
    tools: [
      { name: 'Soil Test Kit (BSWM / DA)', cat: 'tool_buy' },
      { name: 'Pail or fertilizer spreader', cat: 'tool_buy' },
    ],
    steps: [
      'Apply potash at planting and again before flowering / panicle initiation.',
      'Do not burn all the straw — plow it back in to return potassium.',
      'Balance with nitrogen; too much N with low K makes plants fall over.',
    ],
    prevent: 'Include potassium in your fertilizer plan every season.',
  },
  {
    id: 'micro_def',
    name: 'Zinc / Iron / Magnesium deficiency',
    tl: 'Kulang sa micronutrients',
    type: 'nutrient',
    crops: 'all',
    signs: { yellow_veins: 4, yellow_young: 3, stunted: 1 },
    about: 'Young leaves turn yellow while the veins stay green. Common in very wet, very alkaline or very acidic soils.',
    items: [
      { name: 'Zinc sulfate', note: 'Common fix for rice', cat: 'fertilizer' },
      { name: 'Foliar micronutrient fertilizer', cat: 'fertilizer' },
      { name: 'Epsom salt (magnesium sulfate)', note: 'Foliar spray for vegetables', cat: 'fertilizer' },
      { name: 'Dolomite', note: 'If soil is acidic', cat: 'fertilizer' },
    ],
    tools: [
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
      { name: 'Soil pH tester', cat: 'tool_buy' },
    ],
    steps: [
      'Test soil pH first — the fix depends on it.',
      'Spray foliar nutrients early morning or late afternoon, never at noon.',
      'For rice, drain the field briefly to let air into the soil.',
    ],
    prevent: 'Keep soil pH near neutral and add organic matter.',
  },
  {
    id: 'excess_n',
    name: 'Too much fertilizer (excess nitrogen)',
    tl: 'Sobra sa abono',
    type: 'nutrient',
    crops: 'all',
    signs: { too_lush: 4, lodging: 3, tiny_insects: 1, hopperburn: 1 },
    about: 'Very lush, soft plants fall over easily and attract pests. More fertilizer does not always mean more harvest.',
    items: [
      { name: 'Muriate of Potash (0-0-60)', note: 'Strengthens stems', cat: 'fertilizer' },
    ],
    tools: [{ name: 'Leaf Color Chart (LCC)', cat: 'tool_buy' }],
    steps: [
      'Stop or reduce the next nitrogen top-dressing.',
      'Add potassium to make stems stronger.',
      'Compare with your past records in the Records tab to find the right amount.',
    ],
    prevent: 'Use only the amount that gave your best harvest before — see the Records tab.',
  },
  {
    id: 'rice_blast',
    name: 'Rice blast',
    tl: 'Leaf blast / neck rot',
    type: 'disease',
    crops: ['rice'],
    signs: { spots_diamond: 5, empty_grains: 1, spots_brown: 1 },
    about: 'A fungus that makes diamond-shaped spots with gray centers. At heading it can rot the panicle neck and empty the grains.',
    items: [
      { name: 'Fungicide for blast (e.g. tricyclazole)', note: 'Follow the label dose', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
      { name: 'Protective gear (mask, gloves, long sleeves)', cat: 'tool_buy' },
    ],
    steps: [
      'Spray at the first signs and again at booting / early heading if blast is common in your area.',
      'Avoid adding more nitrogen while the disease is active.',
      'Keep the field flooded — dry fields make blast worse.',
    ],
    prevent: 'Plant resistant varieties, use clean seeds and destroy infected straw after harvest.',
  },
  {
    id: 'leaf_spot',
    name: 'Leaf spot / brown spot',
    tl: 'Batik sa dahon',
    type: 'disease',
    crops: 'all',
    signs: { spots_brown: 4, yellow_old: 1 },
    about: 'Fungal spots that spread in humid weather, worse on weak plants with low potassium.',
    items: [
      { name: 'Mancozeb or copper fungicide', note: 'Follow the label dose', cat: 'pesticide' },
      { name: 'Muriate of Potash (0-0-60)', note: 'Makes plants tougher', cat: 'fertilizer' },
    ],
    tools: [
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
      { name: 'Pruning shears', cat: 'tool_buy' },
    ],
    steps: [
      'Remove and bury badly spotted leaves.',
      'Spray fungicide on the rest, covering both sides of the leaves.',
      'Water the soil, not the leaves.',
    ],
    prevent: 'Use clean seed, balanced fertilizer and wider spacing for airflow.',
  },
  {
    id: 'blb',
    name: 'Bacterial leaf blight',
    tl: 'BLB / Kresek',
    type: 'disease',
    crops: ['rice'],
    signs: { leaf_streak: 5, wilting_wet: 2 },
    about: 'Bacteria that dry the leaf from the edges inward. Spreads through water and after strong storms.',
    items: [
      { name: 'Copper-based bactericide', note: 'Only slows it down', cat: 'pesticide' },
    ],
    tools: [{ name: 'Shovel for drainage canals', cat: 'tool_buy' }],
    steps: [
      'Drain the field for a few days to slow the spread.',
      'Hold off on nitrogen until the field recovers.',
      'Do not let water from infected paddies flow into healthy ones.',
    ],
    prevent: 'Plant resistant varieties and use certified seeds.',
  },
  {
    id: 'tungro',
    name: 'Tungro virus',
    tl: 'Tungro',
    type: 'disease',
    crops: ['rice'],
    signs: { orange_leaves: 5, stunted: 2 },
    about: 'A virus carried by green leafhoppers. Infected hills are yellow-orange and stunted with fewer tillers.',
    items: [
      { name: 'Insecticide for leafhoppers', note: 'Follow the label dose', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Light trap', cat: 'tool_buy' },
      { name: 'Sweep net', cat: 'tool_buy' },
    ],
    steps: [
      'Pull out and bury infected hills right away (rogueing).',
      'Control green leafhoppers — check with a sweep net or light trap.',
      'Tell neighbors so everyone controls leafhoppers at the same time.',
    ],
    prevent: 'Plant resistant varieties and plant at the same time as neighboring farms.',
  },
  {
    id: 'powdery_mildew',
    name: 'Powdery mildew',
    tl: 'Amag na parang pulbos',
    type: 'disease',
    crops: ['vegetables', 'fruit', 'root'],
    signs: { white_powder: 5, curling: 1, yellow_old: 1 },
    about: 'A fungus that looks like white flour on leaves, common in dry days with humid nights.',
    items: [
      { name: 'Sulfur-based fungicide', cat: 'pesticide' },
      { name: 'Baking soda spray (1 tbsp per 4 L water + few drops soap)', note: 'Home remedy', cat: 'pesticide' },
      { name: 'Neem oil', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Hand or knapsack sprayer', cat: 'tool_buy' },
      { name: 'Pruning shears', cat: 'tool_buy' },
    ],
    steps: [
      'Cut off the worst leaves and throw them away from the field.',
      'Spray every 7 days, covering both sides of leaves.',
      'Improve airflow by pruning and wider spacing.',
    ],
    prevent: 'Avoid crowded planting and water in the morning.',
  },
  {
    id: 'armyworm',
    name: 'Caterpillars / Armyworm',
    tl: 'Harabas / Uod',
    type: 'pest',
    crops: 'all',
    signs: { holes: 3, sawdust_whorl: 5, fruit_holes: 1 },
    about: 'Caterpillars chew leaves and the whorl. Fall armyworm in corn leaves sawdust-like droppings in the center.',
    items: [
      { name: 'Bt (Bacillus thuringiensis) biopesticide', note: 'Safe for beneficial insects', cat: 'pesticide' },
      { name: 'Insecticide for armyworm (e.g. emamectin benzoate)', note: 'Follow the label dose', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
      { name: 'Pheromone traps', cat: 'tool_buy' },
      { name: 'Flashlight for night scouting', cat: 'tool_buy' },
    ],
    steps: [
      'Walk the field every few days and check the whorl / under leaves.',
      'Hand-pick egg masses and caterpillars when numbers are low.',
      'Spray late afternoon when caterpillars are active; aim into the whorl for corn.',
    ],
    prevent: 'Plow after harvest, plant on time with neighbors and use pheromone traps to monitor.',
  },
  {
    id: 'fruit_borer',
    name: 'Fruit / pod borer',
    tl: 'Uod sa bunga',
    type: 'pest',
    crops: 'all',
    signs: { fruit_holes: 5, holes: 1 },
    about: 'Larvae bore into fruits, pods, shoots or corn ears, making them unsellable.',
    items: [
      { name: 'Bt (Bacillus thuringiensis) biopesticide', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Fruit bags', note: 'Wrap fruits early', cat: 'tool_buy' },
      { name: 'Pheromone traps', cat: 'tool_buy' },
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
    ],
    steps: [
      'Pick and bury all damaged fruits and wilted shoot tips every week.',
      'Bag young fruits (eggplant, ampalaya, mango) to keep moths out.',
      'Use pheromone traps to catch the adult moths.',
    ],
    prevent: 'Rotate crops and clean up old plants after harvest.',
  },
  {
    id: 'sucking_insects',
    name: 'Aphids, whiteflies, thrips or mites',
    tl: 'Dapulak / Kuto ng halaman',
    type: 'pest',
    crops: 'all',
    signs: { tiny_insects: 5, curling: 3, yellow_young: 1 },
    about: 'Tiny insects suck sap, curl leaves and leave sticky honeydew. Some also spread viruses.',
    items: [
      { name: 'Neem oil', cat: 'pesticide' },
      { name: 'Insecticidal soap (mild soap + water)', note: 'Home remedy', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Yellow sticky traps', cat: 'tool_buy' },
      { name: 'Hand or knapsack sprayer', cat: 'tool_buy' },
    ],
    steps: [
      'Spray the underside of leaves where they hide.',
      'Hang yellow sticky traps just above the plants.',
      'Blast small colonies off with a strong water spray.',
    ],
    prevent: 'Protect natural enemies like lady beetles — avoid unnecessary spraying.',
  },
  {
    id: 'planthopper',
    name: 'Brown planthopper',
    tl: 'Kayumangging ngusong-kabayo',
    type: 'pest',
    crops: ['rice'],
    signs: { hopperburn: 5, stunted: 1, too_lush: 1 },
    about: 'Planthoppers crowd at the base of rice plants and suck sap, causing round patches that dry out ("hopperburn").',
    items: [
      { name: 'Insecticide for planthoppers (e.g. buprofezin)', note: 'Aim at the plant base; follow the label', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Light trap', cat: 'tool_buy' },
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
    ],
    steps: [
      'Check the base of plants — tap them and look for hoppers on the water.',
      'Drain the field for 3–4 days.',
      'Avoid early spraying of broad insecticides that kill spiders and other natural enemies.',
    ],
    prevent: 'Avoid too much nitrogen and plant resistant varieties.',
  },
  {
    id: 'stem_borer',
    name: 'Stem borer',
    tl: 'Aksip',
    type: 'pest',
    crops: ['rice', 'corn'],
    signs: { deadheart: 5, empty_grains: 2 },
    about: 'Larvae tunnel inside the stem. Young plants get a dead center shoot; at heading the panicle turns white and empty.',
    items: [
      { name: 'Trichogramma cards (from DA)', note: 'Natural enemy of the eggs', cat: 'pesticide' },
      { name: 'Insecticide for stem borer', note: 'Only if damage is high; follow the label', cat: 'pesticide' },
    ],
    tools: [{ name: 'Light trap', cat: 'tool_buy' }],
    steps: [
      'Collect and destroy egg masses on the leaves.',
      'Use light traps to catch adult moths.',
      'After harvest, plow the stubble under to kill hiding larvae.',
    ],
    prevent: 'Plant at the same time as neighboring farms to break the pest cycle.',
  },
  {
    id: 'rice_bug',
    name: 'Rice bug',
    tl: 'Atangya',
    type: 'pest',
    crops: ['rice'],
    signs: { panicle_bugs: 5, empty_grains: 3 },
    about: 'Slender bugs suck milk from developing grains, leaving them empty or spotted. They smell bad when disturbed.',
    items: [
      { name: 'Insecticide for rice bug', note: 'At milking stage only if many bugs; follow the label', cat: 'pesticide' },
    ],
    tools: [{ name: 'Sweep net', cat: 'tool_buy' }],
    steps: [
      'Check in early morning or late afternoon when bugs are active.',
      'Catch them with a sweep net.',
      'Clear weeds around the field where they hide.',
    ],
    prevent: 'Plant at the same time as neighbors so the field does not flower alone.',
  },
  {
    id: 'rats',
    name: 'Rats',
    tl: 'Daga',
    type: 'pest',
    crops: 'all',
    signs: { cut_tillers: 4 },
    about: 'Rats cut stems at an angle near the base, usually starting from the middle of the field.',
    items: [
      { name: 'Rat bait (in bait stations)', note: 'Coordinate with neighbors', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Rat traps', cat: 'tool_buy' },
      { name: 'Plastic barrier for trap barrier system', cat: 'tool_buy' },
    ],
    steps: [
      'Join or organize community-wide rat control — alone it does not work.',
      'Clean bunds and nearby grass where rats nest.',
      'Set traps along rat runways and bunds.',
    ],
    prevent: 'Plant at the same time as neighbors and keep dikes clean and narrow.',
  },
  {
    id: 'golden_snail',
    name: 'Golden apple snail',
    tl: 'Kuhol',
    type: 'pest',
    crops: ['rice'],
    signs: { snails: 5, cut_tillers: 2 },
    about: 'Snails eat young rice seedlings in the first weeks after transplanting. They lay bright pink egg masses.',
    items: [
      { name: 'Molluscicide', note: 'Last resort — follow the label', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Wire / mesh screens for water inlets', cat: 'tool_buy' },
      { name: 'Bamboo stakes (snails lay eggs on them)', cat: 'tool_buy' },
      { name: 'Pail for hand-picking', cat: 'tool_buy' },
    ],
    steps: [
      'Hand-pick snails and crush pink egg masses morning and afternoon.',
      'Put screens on water inlets and outlets.',
      'Keep water shallow for the first 2 weeks after transplanting.',
    ],
    prevent: 'Transplant older seedlings (about 25 days) and let ducks graze after harvest.',
  },
  {
    id: 'wilt_rot',
    name: 'Bacterial wilt / root rot',
    tl: 'Pagkalanta / bulok na ugat',
    type: 'disease',
    crops: ['vegetables', 'root', 'fruit', 'corn'],
    signs: { wilting_wet: 5, stem_rot: 4, waterlogged: 1 },
    about: 'Soil-borne bacteria or fungi block the plant\'s water pipes, so it wilts even with enough water.',
    items: [
      { name: 'Trichoderma (bio-fungicide)', note: 'Prevention in the soil', cat: 'pesticide' },
      { name: 'Copper-based fungicide / bactericide', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Shovel / hoe for drainage and raised beds', cat: 'tool_buy' },
      { name: 'Gloves', cat: 'tool_buy' },
    ],
    steps: [
      'Pull out and burn or bury wilted plants with their roots.',
      'Improve drainage — make raised beds and canals.',
      'Clean tools after working on sick plants.',
    ],
    prevent: 'Rotate with rice or corn and avoid planting tomato, eggplant and pepper in the same spot every season.',
  },
  {
    id: 'anthracnose',
    name: 'Fruit rot / anthracnose',
    tl: 'Bulok na bunga',
    type: 'disease',
    crops: ['vegetables', 'fruit', 'root'],
    signs: { fruit_rot: 5, spots_brown: 1 },
    about: 'A fungus that makes dark sunken spots on fruits, worse in rainy weather.',
    items: [
      { name: 'Copper fungicide or mancozeb', note: 'Follow the label dose', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Pruning shears', cat: 'tool_buy' },
      { name: 'Fruit bags', cat: 'tool_buy' },
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
    ],
    steps: [
      'Remove and bury all rotten fruits — do not leave them on the ground.',
      'Spray protectant fungicide during rainy weeks.',
      'Harvest on time and handle fruits gently.',
    ],
    prevent: 'Prune for airflow, bag fruits and avoid overhead watering.',
  },
  {
    id: 'drought',
    name: 'Not enough water',
    tl: 'Kulang sa tubig',
    type: 'water',
    crops: 'all',
    signs: { wilting_dry: 5, brown_edges: 1, stunted: 1, empty_grains: 1 },
    about: 'Plants wilt in the heat and recover at night at first. Long dry spells during flowering cut the harvest.',
    items: [{ name: 'Rice straw mulch', note: 'Keeps soil moist', cat: 'other_cost' }],
    tools: [
      { name: 'Water pump', cat: 'tool_buy' },
      { name: 'Hose or drip irrigation kit', cat: 'tool_buy' },
      { name: 'AWD observation pipe (for rice)', cat: 'tool_buy' },
    ],
    steps: [
      'Water early morning or late afternoon.',
      'Mulch around plants to keep moisture in.',
      'For rice, keep water during flowering — that is the most sensitive stage.',
    ],
    prevent: 'Plan planting dates around the rainy season and store water if you can.',
  },
  {
    id: 'waterlogging',
    name: 'Too much water / poor drainage',
    tl: 'Sobrang tubig',
    type: 'water',
    crops: ['corn', 'vegetables', 'root', 'fruit'],
    signs: { waterlogged: 5, wilting_wet: 2, yellow_old: 1, stem_rot: 1 },
    about: 'Roots cannot breathe in soggy soil, so plants yellow, wilt and rot.',
    items: [],
    tools: [{ name: 'Shovel / hoe for canals and raised beds', cat: 'tool_buy' }],
    steps: [
      'Dig canals so water can drain out of the field.',
      'Make raised beds or mounds for vegetables and root crops.',
      'Stop watering until the soil dries a bit.',
    ],
    prevent: 'Plant upland crops on raised beds, especially in the rainy season.',
  },
  {
    id: 'poor_soil',
    name: 'Poor or acidic soil',
    tl: 'Maasim o mahinang lupa',
    type: 'soil',
    crops: 'all',
    signs: { stunted: 3, yellow_old: 1, purple: 1 },
    about: 'When the whole field grows poorly, the soil may be acidic or low in organic matter.',
    items: [
      { name: 'Agricultural lime / dolomite', note: 'Only if soil test says acidic', cat: 'fertilizer' },
      { name: 'Compost or vermicast', cat: 'fertilizer' },
    ],
    tools: [
      { name: 'Soil Test Kit (BSWM / DA)', cat: 'tool_buy' },
      { name: 'Soil pH tester', cat: 'tool_buy' },
    ],
    steps: [
      'Get a soil test — your Municipal Agriculture Office can help, often for free.',
      'Apply lime 2–4 weeks before planting if the soil is acidic.',
      'Add compost every season and plant legumes (mongo, peanuts) in rotation.',
    ],
    prevent: 'Test your soil every 2–3 years and return crop residues to the field.',
  },
  {
    id: 'weeds',
    name: 'Weed competition',
    tl: 'Damo',
    type: 'soil',
    crops: 'all',
    signs: { weeds: 5, stunted: 1, yellow_old: 1 },
    about: 'Weeds steal fertilizer, water and light — especially in the first 30–40 days.',
    items: [
      { name: 'Pre-emergence herbicide', note: 'Follow the label', cat: 'pesticide' },
    ],
    tools: [
      { name: 'Rotary weeder (for rice)', cat: 'tool_buy' },
      { name: 'Hoe / bolo', cat: 'tool_buy' },
      { name: 'Knapsack sprayer', cat: 'tool_buy' },
    ],
    steps: [
      'Weed early — the first month matters most.',
      'For rice, use a rotary weeder between rows and keep the field level.',
      'Mulch vegetable beds to block weeds.',
    ],
    prevent: 'Good land preparation and leveling reduce weeds for the whole season.',
  },
]

export function symptomsForCrop(cropId) {
  return SYMPTOMS.filter((s) => !s.crops || !cropId || s.crops.includes(cropId))
}

function appliesTo(condition, cropId) {
  return condition.crops === 'all' || !cropId || condition.crops.includes(cropId)
}

/**
 * Rank likely problems for the given crop and selected symptom ids.
 * Returns [{ condition, score, matched: [symptomId], level: 'strong'|'possible' }]
 */
export function diagnose(cropId, symptomIds) {
  const selected = new Set(symptomIds)
  if (!selected.size) return []
  return CONDITIONS.filter((c) => appliesTo(c, cropId))
    .map((condition) => {
      const matched = Object.keys(condition.signs).filter((s) => selected.has(s))
      const score = matched.reduce((sum, s) => sum + condition.signs[s], 0)
      const topSign = Math.max(...Object.values(condition.signs))
      // Strong when the problem's main sign is present, or several signs agree.
      const hasMainSign = matched.some((s) => condition.signs[s] === topSign)
      const level = hasMainSign && score >= 4 ? 'strong' : 'possible'
      return { condition, score, matched, level }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)
}

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id)
}

export function getSymptom(id) {
  return SYMPTOMS.find((s) => s.id === id)
}
