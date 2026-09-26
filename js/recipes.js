/* Built-in simple recipes for "What can I cook?".

   Each ingredient ("need") matches an item in your kitchen when:
   - any word of the item's name (accents ignored) STARTS WITH one of `k`
     (a keyword starting with '=' must match the whole word), or
   - the item came from that quick pick (quick-pick ids work as keywords), or
   - the item's category is listed in `c`.
   `opt: true` = nice to have. Basic staples (oil, salt, flour, herbs) are assumed. */

export const RECIPES = [
  {
    id: 'horiatiki', emoji: '🥗', time: 10,
    en: 'Greek salad (horiatiki)', el: 'Χωριάτικη σαλάτα',
    needs: [
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ'] },
      { en: 'cucumber', el: 'αγγούρι', k: ['cucumber', 'αγγουρ'] },
      { en: 'feta', el: 'φέτα', k: ['feta', 'φετα'] },
      { en: 'onion', el: 'κρεμμύδι', k: ['onion', 'κρεμμυδ'], opt: true },
      { en: 'peppers', el: 'πιπεριά', k: ['pepper', 'πιπερι'], opt: true },
      { en: 'olives', el: 'ελιές', k: ['olive', 'ελι'], opt: true },
    ],
    steps: {
      en: 'Cut tomatoes and cucumber into chunks, add sliced onion and pepper. Top with a slab of feta, olives, oregano and plenty of olive oil.',
      el: 'Κόψτε ντομάτες και αγγούρι σε κομμάτια, προσθέστε κρεμμύδι και πιπεριά. Από πάνω φέτα, ελιές, ρίγανη και άφθονο ελαιόλαδο.',
    },
  },
  {
    id: 'strapatsada', emoji: '🍳', time: 15,
    en: 'Strapatsada (eggs with tomato)', el: 'Στραπατσάδα',
    needs: [
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'] },
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ'] },
      { en: 'feta', el: 'φέτα', k: ['feta', 'φετα'], opt: true },
    ],
    steps: {
      en: 'Grate tomatoes and cook in olive oil until thick. Stir in beaten eggs, scramble softly, crumble feta on top.',
      el: 'Τρίψτε τις ντομάτες και μαγειρέψτε σε ελαιόλαδο να δέσουν. Ρίξτε χτυπημένα αυγά, ανακατέψτε απαλά, θρυμματίστε φέτα από πάνω.',
    },
  },
  {
    id: 'omelette', emoji: '🍳', time: 10,
    en: 'Clear-the-fridge omelette', el: 'Ομελέτα με ό,τι έχει το ψυγείο',
    needs: [
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'] },
      { en: 'vegetables', el: 'λαχανικά', c: ['vegetables', 'leafy', 'herbs'] },
      { en: 'cheese or ham', el: 'τυρί ή ζαμπόν', c: ['cheese', 'softcheese', 'deli'], opt: true },
    ],
    steps: {
      en: 'Sauté chopped vegetables for a few minutes. Pour over beaten eggs, add cheese or ham, cook on low heat and fold.',
      el: 'Σοτάρετε ψιλοκομμένα λαχανικά λίγα λεπτά. Ρίξτε τα χτυπημένα αυγά, προσθέστε τυρί ή ζαμπόν, ψήστε σε χαμηλή φωτιά και διπλώστε.',
    },
  },
  {
    id: 'tzatziki', emoji: '🥣', time: 10,
    en: 'Tzatziki', el: 'Τζατζίκι',
    needs: [
      { en: 'yogurt', el: 'γιαούρτι', k: ['yogurt', 'yoghurt', 'γιαουρτ'] },
      { en: 'cucumber', el: 'αγγούρι', k: ['cucumber', 'αγγουρ'] },
      { en: 'garlic', el: 'σκόρδο', k: ['garlic', 'σκορδ'], opt: true },
      { en: 'dill', el: 'άνηθος', k: ['dill', 'ανηθ'], opt: true },
    ],
    steps: {
      en: 'Grate the cucumber and squeeze out the water. Mix with thick yogurt, crushed garlic, olive oil, a little vinegar and dill.',
      el: 'Τρίψτε το αγγούρι και στύψτε το. Ανακατέψτε με στραγγιστό γιαούρτι, λιωμένο σκόρδο, ελαιόλαδο, λίγο ξίδι και άνηθο.',
    },
  },
  {
    id: 'spanakopita', emoji: '🥧', time: 60,
    en: 'Spinach & feta pie', el: 'Σπανακόπιτα / χορτόπιτα',
    needs: [
      { en: 'spinach or greens', el: 'σπανάκι ή χόρτα', k: ['spinach', 'σπανακ', 'χορτ', 'greens'], c: ['leafy'] },
      { en: 'feta', el: 'φέτα', k: ['feta', 'φετα', 'mizithra', 'μυζηθρ'] },
      { en: 'phyllo', el: 'φύλλο', k: ['phyllo', 'filo', 'φυλλ'], c: ['dough'], opt: true },
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'], opt: true },
      { en: 'dill', el: 'άνηθος', k: ['dill', 'ανηθ'], opt: true },
    ],
    steps: {
      en: 'Wilt chopped greens with onion, drain well. Mix with crumbled feta, an egg and dill. Layer between oiled phyllo sheets and bake at 180°C for ~45 min.',
      el: 'Μαραθείτε τα ψιλοκομμένα χόρτα με κρεμμύδι, στραγγίξτε καλά. Ανακατέψτε με φέτα, ένα αυγό και άνηθο. Στρώστε ανάμεσα σε λαδωμένα φύλλα και ψήστε στους 180°C ~45 λεπτά.',
    },
  },
  {
    id: 'kima', emoji: '🍝', time: 40,
    en: 'Pasta with meat sauce', el: 'Μακαρόνια με κιμά',
    needs: [
      { en: 'minced meat', el: 'κιμάς', k: ['mince', 'minced', 'κιμα'], c: ['mince'] },
      { en: 'tomatoes or passata', el: 'ντομάτες ή πασάτα', k: ['tomato', 'ντοματ', 'passata', 'πασατ', 'τοματακ'] },
      { en: 'onion', el: 'κρεμμύδι', k: ['onion', 'κρεμμυδ'], opt: true },
      { en: 'pasta', el: 'μακαρόνια', k: ['pasta', 'spaghetti', 'μακαρον'], opt: true },
    ],
    steps: {
      en: 'Brown the mince with onion, add tomato, a cinnamon stick and bay leaf, simmer 25 min. Serve over spaghetti with grated cheese.',
      el: 'Σοτάρετε τον κιμά με κρεμμύδι, προσθέστε ντομάτα, ξυλάκι κανέλας και δάφνη, σιγοβράστε 25 λεπτά. Σερβίρετε με μακαρόνια και τριμμένο τυρί.',
    },
  },
  {
    id: 'keftedes', emoji: '🧆', time: 30,
    en: 'Keftedes (meatballs)', el: 'Κεφτέδες',
    needs: [
      { en: 'minced meat', el: 'κιμάς', k: ['mince', 'minced', 'κιμα'], c: ['mince'] },
      { en: 'stale bread', el: 'μπαγιάτικο ψωμί', k: ['bread', 'ψωμ'], c: ['bread'], opt: true },
      { en: 'onion', el: 'κρεμμύδι', k: ['onion', 'κρεμμυδ'], opt: true },
      { en: 'egg', el: 'αυγό', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'], opt: true },
      { en: 'parsley', el: 'μαϊντανός', k: ['parsley', 'μαιντανο'], opt: true },
    ],
    steps: {
      en: 'Mix mince with soaked, squeezed bread, grated onion, egg, parsley, mint, salt and pepper. Shape into balls, dust with flour and fry or bake.',
      el: 'Ζυμώστε τον κιμά με βρεγμένο και στυμμένο ψωμί, τριμμένο κρεμμύδι, αυγό, μαϊντανό, δυόσμο, αλάτι, πιπέρι. Πλάστε μπαλάκια, αλευρώστε και τηγανίστε ή ψήστε.',
    },
  },
  {
    id: 'lemonchicken', emoji: '🍗', time: 60,
    en: 'Lemon chicken with potatoes', el: 'Κοτόπουλο λεμονάτο με πατάτες',
    needs: [
      { en: 'chicken', el: 'κοτόπουλο', k: ['chicken', 'κοτοπουλ'], c: ['poultry'] },
      { en: 'potatoes', el: 'πατάτες', k: ['potato', 'πατατ'] },
      { en: 'lemon', el: 'λεμόνι', k: ['lemon', 'λεμον'], opt: true },
    ],
    steps: {
      en: 'Put chicken and potato wedges in a tray with olive oil, lemon juice, oregano, garlic and a glass of water. Bake at 200°C for about 1 hour, turning once.',
      el: 'Βάλτε κοτόπουλο και πατάτες σε ταψί με ελαιόλαδο, χυμό λεμονιού, ρίγανη, σκόρδο και ένα ποτήρι νερό. Ψήστε στους 200°C περίπου 1 ώρα, γυρίζοντας μία φορά.',
    },
  },
  {
    id: 'briam', emoji: '🍆', time: 70,
    en: 'Briam (roasted vegetables)', el: 'Μπριάμ',
    needs: [
      { en: 'zucchini', el: 'κολοκυθάκια', k: ['zucchini', 'courgette', 'κολοκυθ'] },
      { en: 'eggplant', el: 'μελιτζάνα', k: ['eggplant', 'aubergine', 'μελιτζαν'] },
      { en: 'potatoes', el: 'πατάτες', k: ['potato', 'πατατ'], opt: true },
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ'], opt: true },
      { en: 'peppers', el: 'πιπεριές', k: ['pepper', 'πιπερι'], opt: true },
    ],
    steps: {
      en: 'Slice all vegetables, toss with grated tomato, onion, garlic, parsley and lots of olive oil. Bake at 190°C for about 1 hour.',
      el: 'Κόψτε όλα τα λαχανικά σε ροδέλες, ανακατέψτε με τριμμένη ντομάτα, κρεμμύδι, σκόρδο, μαϊντανό και άφθονο λάδι. Ψήστε στους 190°C περίπου 1 ώρα.',
    },
  },
  {
    id: 'gemista', emoji: '🫑', time: 90,
    en: 'Gemista (stuffed vegetables)', el: 'Γεμιστά',
    needs: [
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ'] },
      { en: 'peppers', el: 'πιπεριές', k: ['pepper', 'πιπερι'] },
      { en: 'rice', el: 'ρύζι', k: ['rice', 'ρυζ'], opt: true },
      { en: 'zucchini', el: 'κολοκυθάκια', k: ['zucchini', 'κολοκυθ'], opt: true },
    ],
    steps: {
      en: 'Hollow out tomatoes and peppers. Mix the tomato pulp with rice, onion, herbs and oil; fill the vegetables. Add potato wedges and bake at 180°C for 1¼ h.',
      el: 'Αδειάστε ντομάτες και πιπεριές. Ανακατέψτε την ψίχα με ρύζι, κρεμμύδι, μυρωδικά και λάδι· γεμίστε. Προσθέστε πατάτες και ψήστε στους 180°C 1¼ ώρα.',
    },
  },
  {
    id: 'plaki', emoji: '🐟', time: 45,
    en: 'Fish plaki', el: 'Ψάρι πλακί',
    needs: [
      { en: 'fish', el: 'ψάρι', k: ['fish', 'ψαρ', 'cod', 'μπακαλιαρ'], c: ['fish'] },
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ', 'passata', 'πασατ'] },
      { en: 'onion', el: 'κρεμμύδι', k: ['onion', 'κρεμμυδ'], opt: true },
    ],
    steps: {
      en: 'Soften sliced onion and garlic in oil, add tomato and parsley. Lay the fish in a dish, cover with the sauce and bake at 180°C for 25–30 min.',
      el: 'Σοτάρετε κρεμμύδι και σκόρδο, προσθέστε ντομάτα και μαϊντανό. Βάλτε το ψάρι σε ταψί, καλύψτε με τη σάλτσα και ψήστε στους 180°C 25–30 λεπτά.',
    },
  },
  {
    id: 'bouyiourdi', emoji: '🧀', time: 20,
    en: 'Bouyiourdi (baked feta)', el: 'Μπουγιουρντί',
    needs: [
      { en: 'feta', el: 'φέτα', k: ['feta', 'φετα'] },
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ'] },
      { en: 'peppers', el: 'πιπεριές', k: ['pepper', 'πιπερι'], opt: true },
    ],
    steps: {
      en: 'Put feta in a small dish, cover with sliced tomato and pepper, chilli flakes, oregano and oil. Bake at 200°C for 15 min. Eat with bread.',
      el: 'Βάλτε τη φέτα σε πυρίμαχο, σκεπάστε με ντομάτα, πιπεριά, μπούκοβο, ρίγανη και λάδι. Ψήστε στους 200°C 15 λεπτά. Με ψωμί.',
    },
  },
  {
    id: 'garides', emoji: '🦐', time: 25,
    en: 'Shrimp saganaki', el: 'Γαρίδες σαγανάκι',
    needs: [
      { en: 'shrimp', el: 'γαρίδες', k: ['shrimp', 'prawn', 'γαριδ'] },
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ', 'passata', 'πασατ'] },
      { en: 'feta', el: 'φέτα', k: ['feta', 'φετα'], opt: true },
    ],
    steps: {
      en: 'Sauté shrimp with garlic, add tomato and simmer 5 min. Crumble feta on top and cook 3 more minutes. Serve with bread or pasta.',
      el: 'Σοτάρετε τις γαρίδες με σκόρδο, προσθέστε ντομάτα και σιγοβράστε 5 λεπτά. Θρυμματίστε φέτα και μαγειρέψτε άλλα 3 λεπτά.',
    },
  },
  {
    id: 'souvlakiwrap', emoji: '🥙', time: 25,
    en: 'Homemade pita wraps', el: 'Σπιτικά πιτόγυρα',
    needs: [
      { en: 'meat or chicken', el: 'κρέας ή κοτόπουλο', k: ['souvlaki', 'σουβλακ', 'γυρο', 'gyros'], c: ['meat', 'poultry'] },
      { en: 'pita bread', el: 'πίτες', k: ['pita', 'πιτε'] },
      { en: 'tzatziki', el: 'τζατζίκι', k: ['tzatziki', 'τζατζικ', 'yogurt', 'γιαουρτ'], opt: true },
      { en: 'tomatoes', el: 'ντομάτες', k: ['tomato', 'ντοματ'], opt: true },
      { en: 'onion', el: 'κρεμμύδι', k: ['onion', 'κρεμμυδ'], opt: true },
    ],
    steps: {
      en: 'Grill or pan-fry the meat in strips with oregano. Warm pitas in a pan, fill with meat, tzatziki, tomato and onion, and roll up.',
      el: 'Ψήστε το κρέας σε λωρίδες με ρίγανη. Ζεστάνετε τις πίτες στο τηγάνι, γεμίστε με κρέας, τζατζίκι, ντομάτα, κρεμμύδι και τυλίξτε.',
    },
  },
  {
    id: 'friedrice', emoji: '🍚', time: 20,
    en: 'Fried rice with leftovers', el: 'Τηγανητό ρύζι με ό,τι περίσσεψε',
    needs: [
      { en: 'rice', el: 'ρύζι', k: ['rice', 'ρυζ'] },
      { en: 'vegetables', el: 'λαχανικά', c: ['vegetables', 'frozen'] },
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'], opt: true },
      { en: 'ham, chicken or leftovers', el: 'ζαμπόν, κοτόπουλο ή φαγητό', c: ['deli', 'leftovers', 'poultry'], opt: true },
    ],
    steps: {
      en: 'Fry chopped vegetables and meat on high heat, add cold cooked rice and soy sauce, push aside and scramble an egg in the pan. Mix and serve.',
      el: 'Τσιγαρίστε σε δυνατή φωτιά ψιλοκομμένα λαχανικά και κρέας, προσθέστε κρύο βρασμένο ρύζι και σόγια, σπάστε ένα αυγό στο πλάι, ανακατέψτε.',
    },
  },
  {
    id: 'vegpasta', emoji: '🍝', time: 20,
    en: 'Pasta with vegetables', el: 'Μακαρόνια με λαχανικά',
    needs: [
      { en: 'vegetables', el: 'λαχανικά', c: ['vegetables', 'leafy'] },
      { en: 'pasta', el: 'μακαρόνια', k: ['pasta', 'spaghetti', 'μακαρον', 'πεν'], opt: true },
      { en: 'cheese or cream', el: 'τυρί ή κρέμα', c: ['cheese', 'softcheese', 'yogurt'], opt: true },
    ],
    steps: {
      en: 'Boil pasta. Meanwhile sauté whatever vegetables need using with garlic and oil. Toss together with some pasta water and grated cheese.',
      el: 'Βράστε τα ζυμαρικά. Στο μεταξύ σοτάρετε τα λαχανικά που πρέπει να φαγωθούν με σκόρδο και λάδι. Ανακατέψτε με λίγο νερό από το βράσιμο και τριμμένο τυρί.',
    },
  },
  {
    id: 'soup', emoji: '🍲', time: 40,
    en: 'Vegetable soup', el: 'Χορτόσουπα',
    needs: [
      { en: 'vegetables', el: 'λαχανικά', c: ['vegetables', 'leafy'] },
      { en: 'potatoes, carrots or onions', el: 'πατάτες, καρότα ή κρεμμύδια', c: ['roots'], k: ['carrot', 'καροτ'] },
      { en: 'herbs', el: 'μυρωδικά', c: ['herbs'], opt: true },
    ],
    steps: {
      en: 'Chop everything, sauté onion in oil, add the vegetables and cover with water. Simmer 30 min, season, blend if you like, finish with lemon.',
      el: 'Ψιλοκόψτε τα πάντα, σοτάρετε κρεμμύδι, προσθέστε τα λαχανικά και σκεπάστε με νερό. Βράστε 30 λεπτά, αλατοπιπερώστε, πολτοποιήστε αν θέλετε, με λίγο λεμόνι.',
    },
  },
  {
    id: 'smoothie', emoji: '🥤', time: 5,
    en: 'Fruit smoothie', el: 'Smoothie φρούτων',
    needs: [
      { en: 'fruit', el: 'φρούτα', c: ['fruit', 'berries'] },
      { en: 'yogurt or milk', el: 'γιαούρτι ή γάλα', c: ['yogurt', 'milk'] },
    ],
    steps: {
      en: 'Blend chopped fruit (soft or bruised is perfect) with yogurt or milk and a spoon of honey. Add ice if you like.',
      el: 'Χτυπήστε στο μπλέντερ κομμένα φρούτα (τα πολύ ώριμα είναι ιδανικά) με γιαούρτι ή γάλα και μια κουταλιά μέλι. Προαιρετικά πάγος.',
    },
  },
  {
    id: 'yogurtbowl', emoji: '🍯', time: 5,
    en: 'Yogurt with fruit & honey', el: 'Γιαούρτι με φρούτα και μέλι',
    needs: [
      { en: 'yogurt', el: 'γιαούρτι', k: ['yogurt', 'γιαουρτ'], c: ['yogurt'] },
      { en: 'fruit', el: 'φρούτα', c: ['fruit', 'berries'], opt: true },
    ],
    steps: {
      en: 'Spoon yogurt into a bowl, top with chopped fruit, honey and walnuts.',
      el: 'Βάλτε γιαούρτι σε μπολ, από πάνω κομμένα φρούτα, μέλι και καρύδια.',
    },
  },
  {
    id: 'frenchtoast', emoji: '🍞', time: 15,
    en: 'French toast (avgofetes)', el: 'Αυγόφετες',
    needs: [
      { en: 'bread', el: 'ψωμί', k: ['bread', 'ψωμ'], c: ['bread'] },
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'] },
      { en: 'milk', el: 'γάλα', k: ['milk', '=γαλα'], c: ['milk'], opt: true },
    ],
    steps: {
      en: 'Beat eggs with a splash of milk. Dip slices of (stale) bread and fry in a little oil or butter. Sweet with honey and cinnamon, or savoury with feta.',
      el: 'Χτυπήστε αυγά με λίγο γάλα. Βουτήξτε φέτες (μπαγιάτικου) ψωμιού και τηγανίστε. Γλυκές με μέλι και κανέλα ή αλμυρές με φέτα.',
    },
  },
  {
    id: 'tost', emoji: '🥪', time: 10,
    en: 'Toasted sandwich', el: 'Τοστ',
    needs: [
      { en: 'bread', el: 'ψωμί', k: ['bread', 'ψωμ'], c: ['bread'] },
      { en: 'ham or turkey', el: 'ζαμπόν ή γαλοπούλα', c: ['deli'] },
      { en: 'cheese', el: 'τυρί', c: ['cheese', 'softcheese'] },
    ],
    steps: {
      en: 'Fill bread with ham and cheese (tomato too, if it needs using) and toast until golden.',
      el: 'Γεμίστε το ψωμί με ζαμπόν και τυρί (και ντομάτα αν πρέπει να φαγωθεί) και ψήστε μέχρι να ροδίσει.',
    },
  },
  {
    id: 'pancakes', emoji: '🥞', time: 20,
    en: 'Pancakes (tiganites)', el: 'Τηγανίτες',
    needs: [
      { en: 'milk', el: 'γάλα', k: ['milk', '=γαλα'], c: ['milk'] },
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'] },
      { en: 'fruit', el: 'φρούτα', c: ['fruit', 'berries'], opt: true },
    ],
    steps: {
      en: 'Whisk 1 cup flour, 1 cup milk, 1 egg, 1 tsp baking powder and a pinch of sugar. Cook small ladlefuls in a hot pan. Serve with honey and fruit.',
      el: 'Χτυπήστε 1 φλ. αλεύρι, 1 φλ. γάλα, 1 αυγό, 1 κ.γ. μπέικιν πάουντερ και λίγη ζάχαρη. Ψήστε κουταλιές σε καυτό τηγάνι. Με μέλι και φρούτα.',
    },
  },
  {
    id: 'rizogalo', emoji: '🍮', time: 35,
    en: 'Rice pudding (rizogalo)', el: 'Ρυζόγαλο',
    needs: [
      { en: 'milk', el: 'γάλα', k: ['milk', '=γαλα'], c: ['milk'] },
      { en: 'rice', el: 'ρύζι', k: ['rice', 'ρυζ'], opt: true },
    ],
    steps: {
      en: 'Simmer ½ cup rice in a cup of water until absorbed, add 1 L milk and sugar, stir on low heat ~20 min until creamy. Cinnamon on top.',
      el: 'Βράστε ½ φλ. ρύζι σε ένα φλ. νερό να το πιει, προσθέστε 1 λίτρο γάλα και ζάχαρη, ανακατεύετε σε χαμηλή φωτιά ~20 λεπτά. Κανέλα από πάνω.',
    },
  },
  {
    id: 'bananabread', emoji: '🍌', time: 60,
    en: 'Banana bread', el: 'Κέικ μπανάνας',
    needs: [
      { en: 'ripe bananas', el: 'ώριμες μπανάνες', k: ['banana', 'μπαναν'] },
      { en: 'eggs', el: 'αυγά', k: ['eggs', '=egg', 'αυγ'], c: ['eggs'], opt: true },
      { en: 'butter', el: 'βούτυρο', c: ['butter'], opt: true },
    ],
    steps: {
      en: 'Mash 3 bananas, mix with 2 eggs, 80 g melted butter, 100 g sugar, 200 g flour and 1 tsp baking soda. Bake at 175°C for ~50 min.',
      el: 'Λιώστε 3 μπανάνες, ανακατέψτε με 2 αυγά, 80 γρ. λιωμένο βούτυρο, 100 γρ. ζάχαρη, 200 γρ. αλεύρι και 1 κ.γ. σόδα. Ψήστε στους 175°C ~50 λεπτά.',
    },
  },
  {
    id: 'leftoverbowl', emoji: '🍱', time: 10,
    en: 'Leftover lunch bowl', el: 'Μπολ με ό,τι περίσσεψε',
    needs: [
      { en: 'leftovers', el: 'φαγητό που περίσσεψε', c: ['leftovers'] },
      { en: 'salad', el: 'σαλάτα', c: ['leafy', 'vegetables'], opt: true },
      { en: 'dip', el: 'ντιπ', c: ['dips', 'yogurt'], opt: true },
    ],
    steps: {
      en: 'Reheat the leftovers until piping hot, serve over fresh salad leaves with a spoon of tzatziki or yogurt.',
      el: 'Ζεστάνετε καλά το φαγητό, σερβίρετε πάνω σε φρέσκια σαλάτα με μια κουταλιά τζατζίκι ή γιαούρτι.',
    },
  },
];
