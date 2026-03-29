export interface AllergenInfo {
  id: string;
  name: string;
  description: string;
  commonIngredients: string[];
  cautionIngredients: string[];
}

export const ALLERGENS: AllergenInfo[] = [
  {
    id: "alpha-gal",
    name: "Alpha-Gal",
    description: "Food allergy to red meat and other products from mammals",
    commonIngredients: [
      "gelatin", "lard", "tallow", "beef fat", "pork fat",
      "whey", "casein", "lactose", "milk", "cream", "butter", "cheese",
      "stearic acid", "glycerin", "glycerol", "magnesium stearate",
      "collagen", "keratin", "rennet", "beef", "pork", "lamb", "deer",
      "goat", "bison", "veal"
    ],
    cautionIngredients: [
      "carrageenan", "natural flavors", "mono and diglycerides",
      "vitamin d3", "stearic acid", "glycerin"
    ]
  },
  {
    id: "dairy",
    name: "Dairy",
    description: "Allergy to milk and dairy products",
    commonIngredients: [
      "milk", "cream", "butter", "cheese", "yogurt", "whey", "casein",
      "lactose", "ghee", "buttermilk", "sour cream", "cottage cheese",
      "cream cheese", "milk powder", "nonfat dry milk", "milk solids",
      "curds", "custard", "half and half", "ice cream", "pudding",
      "lactalbumin", "lactoglobulin"
    ],
    cautionIngredients: [
      "natural flavors", "caramel color", "high protein flour",
      "lactic acid", "lactate"
    ]
  },
  {
    id: "nuts",
    name: "Tree Nuts",
    description: "Allergy to tree nuts",
    commonIngredients: [
      "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut",
      "macadamia", "brazil nut", "pine nut", "chestnut", "beechnut",
      "butternut", "chinquapin", "ginkgo nut", "hickory nut",
      "nut butter", "nut oil", "nut flour", "marzipan", "nougat",
      "praline", "gianduja", "nut paste"
    ],
    cautionIngredients: [
      "natural flavors", "artificial flavors", "natural nut extract"
    ]
  },
  {
    id: "peanuts",
    name: "Peanuts",
    description: "Allergy to peanuts (legume)",
    commonIngredients: [
      "peanut", "peanut butter", "peanut oil", "peanut flour",
      "groundnut", "goober", "beer nuts", "monkey nuts",
      "arachis oil", "ground nuts", "mixed nuts"
    ],
    cautionIngredients: [
      "natural flavors", "artificial flavors"
    ]
  },
  {
    id: "gluten",
    name: "Gluten/Celiac",
    description: "Sensitivity to gluten found in wheat, barley, and rye",
    commonIngredients: [
      "wheat", "barley", "rye", "malt", "brewer's yeast", "wheat starch",
      "wheat flour", "durum", "semolina", "spelt", "kamut", "farro",
      "bulgur", "couscous", "seitan", "wheat germ", "wheat bran",
      "triticale", "einkorn", "farina", "graham flour", "matzo",
      "wheat protein", "hydrolyzed wheat protein"
    ],
    cautionIngredients: [
      "modified food starch", "natural flavors", "caramel color",
      "dextrin", "maltodextrin", "glucose syrup", "brown rice syrup",
      "soy sauce", "oats"
    ]
  },
  {
    id: "soy",
    name: "Soy",
    description: "Allergy to soybeans and soy products",
    commonIngredients: [
      "soy", "soybean", "soy sauce", "soy milk", "tofu", "tempeh",
      "edamame", "miso", "natto", "soy protein", "soy lecithin",
      "soy flour", "soy oil", "textured vegetable protein", "tvp",
      "soy nuts", "soybean oil", "hydrolyzed soy protein"
    ],
    cautionIngredients: [
      "natural flavors", "artificial flavors", "vegetable oil",
      "vegetable broth", "vegetable starch"
    ]
  },
  {
    id: "eggs",
    name: "Eggs",
    description: "Allergy to eggs",
    commonIngredients: [
      "egg", "egg white", "egg yolk", "egg powder", "albumin",
      "egg albumin", "globulin", "livetin", "lysozyme", "ovalbumin",
      "ovomucin", "ovomucoid", "ovovitellin", "mayonnaise", "meringue",
      "eggnog", "surimi"
    ],
    cautionIngredients: [
      "natural flavors", "lecithin", "simplesse"
    ]
  },
  {
    id: "fish",
    name: "Fish",
    description: "Allergy to fish",
    commonIngredients: [
      "fish", "salmon", "tuna", "cod", "halibut", "bass", "flounder",
      "anchovies", "sardines", "tilapia", "catfish", "haddock",
      "pollock", "trout", "mahi mahi", "snapper", "fish sauce",
      "fish oil", "fish gelatin", "worcestershire sauce", "caesar dressing",
      "imitation crab"
    ],
    cautionIngredients: [
      "natural flavors", "omega-3 supplements", "dha", "fish stock"
    ]
  },
  {
    id: "shellfish",
    name: "Shellfish",
    description: "Allergy to crustaceans and mollusks",
    commonIngredients: [
      "shrimp", "crab", "lobster", "crayfish", "prawns", "clam",
      "oyster", "mussel", "scallop", "squid", "octopus", "cuttlefish",
      "barnacle", "krill", "langoustine", "shellfish stock",
      "shellfish extract", "surimi", "glucosamine", "chitosan"
    ],
    cautionIngredients: [
      "natural flavors", "seafood flavoring", "fish stock", "bouillabaisse"
    ]
  },
  {
    id: "sesame",
    name: "Sesame",
    description: "Allergy to sesame seeds",
    commonIngredients: [
      "sesame", "sesame seed", "sesame oil", "tahini", "sesame paste",
      "sesame flour", "sesamol", "sesamum indicum", "benne", "gingelly",
      "til", "halvah", "hummus", "baba ghanoush"
    ],
    cautionIngredients: [
      "natural flavors", "spices", "flavoring"
    ]
  },
  {
    id: "corn",
    name: "Corn",
    description: "Allergy to corn and corn products",
    commonIngredients: [
      "corn", "cornmeal", "cornstarch", "corn flour", "corn syrup",
      "high fructose corn syrup", "corn oil", "popcorn", "hominy",
      "masa", "polenta", "grits", "maize", "corn chips", "tortilla",
      "dextrose", "maltodextrin", "dextrin", "glucose syrup"
    ],
    cautionIngredients: [
      "natural flavors", "modified food starch", "vegetable oil",
      "citric acid", "xanthan gum", "caramel color", "baking powder",
      "powdered sugar", "vanilla extract"
    ]
  },
  {
    id: "sulfites",
    name: "Sulfites",
    description: "Sensitivity to sulfur-based preservatives",
    commonIngredients: [
      "sulfur dioxide", "sodium sulfite", "sodium bisulfite",
      "potassium bisulfite", "sodium metabisulfite", "potassium metabisulfite",
      "sulfiting agents"
    ],
    cautionIngredients: [
      "dried fruits", "wine", "beer", "pickled foods", "vinegar",
      "fruit juices", "molasses"
    ]
  },
  {
    id: "mustard",
    name: "Mustard",
    description: "Allergy to mustard seeds and products",
    commonIngredients: [
      "mustard", "mustard seed", "mustard powder", "mustard oil",
      "dijon mustard", "yellow mustard", "brown mustard", "mustard greens",
      "prepared mustard", "mustard flour"
    ],
    cautionIngredients: [
      "spices", "curry powder", "natural flavors", "seasonings"
    ]
  },
  {
    id: "legumes",
    name: "Legumes",
    description: "Allergy to beans, lentils, and other legumes",
    commonIngredients: [
      "chickpea", "lentil", "black bean", "kidney bean", "pinto bean",
      "navy bean", "lima bean", "green bean", "pea", "lupin",
      "carob", "fenugreek", "tamarind", "bean flour", "pea protein"
    ],
    cautionIngredients: [
      "vegetable protein", "natural flavors", "guar gum"
    ]
  },
  {
    id: "pork",
    name: "Pork",
    description: "Allergy or avoidance of pork products",
    commonIngredients: [
      "pork", "ham", "bacon", "sausage", "pepperoni", "prosciutto",
      "pancetta", "pork fat", "lard", "pork gelatin", "chitlins",
      "pork rinds"
    ],
    cautionIngredients: [
      "gelatin", "natural flavors", "enzymes", "pepsin"
    ]
  },
  {
    id: "beef",
    name: "Beef",
    description: "Allergy or avoidance of beef products",
    commonIngredients: [
      "beef", "steak", "ground beef", "beef broth", "beef stock",
      "beef tallow", "beef fat", "beef gelatin", "veal", "beef extract"
    ],
    cautionIngredients: [
      "gelatin", "natural flavors", "tallow", "suet"
    ]
  },
  {
    id: "chicken",
    name: "Chicken",
    description: "Allergy to chicken and poultry",
    commonIngredients: [
      "chicken", "chicken broth", "chicken stock", "chicken fat",
      "chicken powder", "poultry seasoning", "chicken extract"
    ],
    cautionIngredients: [
      "natural flavors", "poultry fat", "stock"
    ]
  },
  {
    id: "garlic",
    name: "Garlic",
    description: "Allergy or intolerance to garlic",
    commonIngredients: [
      "garlic", "garlic powder", "garlic salt", "garlic oil",
      "garlic extract", "roasted garlic", "garlic paste", "minced garlic"
    ],
    cautionIngredients: [
      "natural flavors", "spices", "seasonings"
    ]
  },
  {
    id: "onion",
    name: "Onion",
    description: "Allergy or intolerance to onions",
    commonIngredients: [
      "onion", "onion powder", "onion salt", "onion oil",
      "onion extract", "dried onion", "caramelized onion", "shallot",
      "scallion", "leek", "chives"
    ],
    cautionIngredients: [
      "natural flavors", "spices", "seasonings"
    ]
  },
  {
    id: "nightshades",
    name: "Nightshades",
    description: "Sensitivity to nightshade vegetables",
    commonIngredients: [
      "tomato", "potato", "eggplant", "bell pepper", "chili pepper",
      "cayenne", "paprika", "goji berry", "tomatillo", "pepino",
      "tobacco", "potato starch"
    ],
    cautionIngredients: [
      "natural flavors", "spices", "modified food starch"
    ]
  },
  {
    id: "citrus",
    name: "Citrus",
    description: "Allergy to citrus fruits",
    commonIngredients: [
      "orange", "lemon", "lime", "grapefruit", "tangerine", "mandarin",
      "clementine", "citric acid", "citrus oil", "lemon juice",
      "orange juice", "lime juice", "citrus peel", "zest"
    ],
    cautionIngredients: [
      "natural flavors", "ascorbic acid", "vitamin c"
    ]
  },
  {
    id: "strawberry",
    name: "Strawberry",
    description: "Allergy to strawberries",
    commonIngredients: [
      "strawberry", "strawberry juice", "strawberry puree",
      "strawberry extract", "strawberry flavoring"
    ],
    cautionIngredients: [
      "natural flavors", "artificial flavors", "berry flavoring"
    ]
  },
  {
    id: "banana",
    name: "Banana",
    description: "Allergy to bananas",
    commonIngredients: [
      "banana", "banana puree", "banana extract", "banana flavoring",
      "plantain"
    ],
    cautionIngredients: [
      "natural flavors", "artificial flavors"
    ]
  },
  {
    id: "kiwi",
    name: "Kiwi",
    description: "Allergy to kiwi fruit",
    commonIngredients: [
      "kiwi", "kiwifruit", "kiwi juice", "kiwi extract"
    ],
    cautionIngredients: [
      "natural flavors", "tropical fruit flavoring"
    ]
  },
  {
    id: "avocado",
    name: "Avocado",
    description: "Allergy to avocados",
    commonIngredients: [
      "avocado", "avocado oil", "guacamole", "avocado puree"
    ],
    cautionIngredients: [
      "natural flavors"
    ]
  }
];

export function getAllergenById(id: string): AllergenInfo | undefined {
  return ALLERGENS.find(a => a.id === id);
}

export function getAllergenNames(): string[] {
  return ALLERGENS.map(a => a.name);
}
