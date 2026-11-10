'use strict';
/* ===== ANIME EXTRA RANDOM DEFENCE — data (FERD-aligned) ===== */
/* Roster, grade ladder and 177 ascension recipes translated 1:1 from the
   FERD map structure onto an original anime cast. */

const GRADES = {"E": {"color": "#9fb4c8", "dark": "#1c2430", "sell": 8, "label": "E", "gcost": 30}, "D": {"color": "#4aa8ff", "dark": "#152b47", "sell": 14, "label": "D", "gcost": 45}, "C": {"color": "#3dff9a", "dark": "#103324", "sell": 24, "label": "C", "gcost": 65}, "B": {"color": "#ff9440", "dark": "#3d2410", "sell": 40, "label": "B", "gcost": 95}, "A": {"color": "#ffd23d", "dark": "#3d3210", "sell": 70, "label": "A", "gcost": 140}, "S": {"color": "#e14dff", "dark": "#351040", "sell": 120, "label": "S", "gcost": 200}, "EX": {"color": "#ff3d5e", "dark": "#40101c", "sell": 200, "label": "EX", "gcost": 0}, "STAR": {"color": "#ffffff", "dark": "#2a2440", "sell": 360, "label": "\u2605", "gcost": 0}};
const GRADE_ORDER = ['E','D','C','B','A','S','EX','STAR'];

/* kind: single|aoe|chain|slow|crit|burn|poison|stun|beam|pierce|multi */
const UNITS = [
  {id:"AAA", base:"AA", name:"Tala Wildrage", cls:"Berserker", grade:"A", pop:2, dmg:98.8, rate:1.03, range:118, kind:"crit", hair:"#4dc86a", eye:"#ff3d5e", style:2, desc:"High critical strike chance for heavy burst damage. (32% for 2.8\u00d7)", flavor:"\u201cThe hunt turned feral.\u201d", critC:0.32, critX:2.8},
  {id:"AAS", base:"AA", name:"Tala Wildrage", cls:"Berserker", grade:"S", pop:2, dmg:162.5, rate:1.08, range:124, kind:"crit", hair:"#4dc86a", eye:"#ff3d5e", style:2, desc:"High critical strike chance for heavy burst damage. (32% for 2.8\u00d7)", flavor:"\u201cThe hunt turned feral.\u201d", critC:0.32, critX:2.8},
  {id:"AEA", base:"AE", name:"Elize Bloodrage", cls:"Berserker", grade:"A", pop:2, dmg:91.2, rate:0.92, range:118, kind:"burn", hair:"#ff5a7a", eye:"#ff3d5e", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cRage is my crown.\u201d", aoe:49, dot:27.4, dotT:2},
  {id:"AES", base:"AE", name:"Elize Bloodrage", cls:"Berserker", grade:"S", pop:2, dmg:150.0, rate:0.96, range:124, kind:"burn", hair:"#ff5a7a", eye:"#ff3d5e", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cRage is my crown.\u201d", aoe:52, dot:45.0, dotT:2},
  {id:"ALA", base:"AL", name:"Altair Warbrand", cls:"Saber", grade:"A", pop:2, dmg:91.2, rate:0.92, range:168, kind:"beam", hair:"#e8e8f0", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cI am the war that ends all wars.\u201d", aoe:36},
  {id:"ALB", base:"AL", name:"Altair Warbrand", cls:"Saber", grade:"B", pop:2, dmg:55.2, rate:0.88, range:162, kind:"beam", hair:"#e8e8f0", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cI am the war that ends all wars.\u201d", aoe:34},
  {id:"ALS", base:"AL", name:"Altair Warbrand", cls:"Saber", grade:"S", pop:2, dmg:150.0, rate:0.96, range:174, kind:"beam", hair:"#e8e8f0", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cI am the war that ends all wars.\u201d", aoe:39},
  {id:"ALX", base:"AL", name:"Altair Warbrand", cls:"Saber", grade:"EX", pop:3, dmg:480.0, rate:1.04, range:184, kind:"beam", hair:"#e8e8f0", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cI am the war that ends all wars.\u201d", aoe:42, exTitle:"Titan Attilaight Cell"},
  {id:"ANA", base:"AN", name:"Anders Taleweaver", cls:"Caster", grade:"A", pop:1, dmg:53.2, rate:1.26, range:148, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:0, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cEvery story ends; I write the ending.\u201d", aoe:51},
  {id:"ANB", base:"AN", name:"Anders Taleweaver", cls:"Caster", grade:"B", pop:1, dmg:32.2, rate:1.21, range:142, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:0, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cEvery story ends; I write the ending.\u201d", aoe:48},
  {id:"ANC", base:"AN", name:"Anders Taleweaver", cls:"Caster", grade:"C", pop:1, dmg:19.6, rate:1.17, range:138, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:0, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cEvery story ends; I write the ending.\u201d", aoe:46},
  {id:"ANS", base:"AN", name:"Anders Taleweaver", cls:"Caster", grade:"S", pop:1, dmg:87.5, rate:1.32, range:154, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:0, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cEvery story ends; I write the ending.\u201d", aoe:54},
  {id:"APA", base:"AP", name:"Vera Darkforge", cls:"Saber", grade:"A", pop:1, dmg:83.6, rate:1.21, range:138, kind:"crit", hair:"#6a7a9a", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 2.6\u00d7)", flavor:"\u201cThe dark forge burns colder, and brighter.\u201d", critC:0.3, critX:2.6},
  {id:"APB", base:"AP", name:"Vera Darkforge", cls:"Saber", grade:"B", pop:1, dmg:50.6, rate:1.16, range:132, kind:"crit", hair:"#6a7a9a", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 2.6\u00d7)", flavor:"\u201cThe dark forge burns colder, and brighter.\u201d", critC:0.3, critX:2.6},
  {id:"APS", base:"AP", name:"Vera Darkforge", cls:"Saber", grade:"S", pop:1, dmg:137.5, rate:1.26, range:144, kind:"crit", hair:"#6a7a9a", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 2.6\u00d7)", flavor:"\u201cThe dark forge burns colder, and brighter.\u201d", critC:0.3, critX:2.6},
  {id:"AQA", base:"AQ", name:"Luna Whitevamp", cls:"Berserker", grade:"A", pop:2, dmg:98.8, rate:0.98, range:118, kind:"crit", hair:"#f2ead8", eye:"#ff3d5e", style:1, desc:"High critical strike chance for heavy burst damage. (30% for 2.8\u00d7)", flavor:"\u201cThe white princess walks at night.\u201d", critC:0.3, critX:2.8},
  {id:"AQB", base:"AQ", name:"Luna Whitevamp", cls:"Berserker", grade:"B", pop:2, dmg:59.8, rate:0.94, range:112, kind:"crit", hair:"#f2ead8", eye:"#ff3d5e", style:1, desc:"High critical strike chance for heavy burst damage. (30% for 2.8\u00d7)", flavor:"\u201cThe white princess walks at night.\u201d", critC:0.3, critX:2.8},
  {id:"AQC", base:"AQ", name:"Luna Whitevamp", cls:"Berserker", grade:"C", pop:2, dmg:36.4, rate:0.9, range:108, kind:"crit", hair:"#f2ead8", eye:"#ff3d5e", style:1, desc:"High critical strike chance for heavy burst damage. (30% for 2.8\u00d7)", flavor:"\u201cThe white princess walks at night.\u201d", critC:0.3, critX:2.8},
  {id:"AQS", base:"AQ", name:"Luna Whitevamp", cls:"Berserker", grade:"S", pop:2, dmg:162.5, rate:1.02, range:124, kind:"crit", hair:"#f2ead8", eye:"#ff3d5e", style:1, desc:"High critical strike chance for heavy burst damage. (30% for 2.8\u00d7)", flavor:"\u201cThe white princess walks at night.\u201d", critC:0.3, critX:2.8},
  {id:"AST", base:"AS", name:"Zephyr Cloud Trickster", cls:"Rider", grade:"EX", pop:3, dmg:320.0, rate:3.12, range:174, kind:"crit", hair:"#ff9ecb", eye:"#3dff9a", style:1, desc:"High critical strike chance for heavy burst damage. (+1 gold per hit)", flavor:"\u201cIt\u2019s a trap! \u2026No, really, this is just me.\u201d", critC:0.25, critX:2.5, greed:1, exTitle:"False Rider"},
  {id:"ATA", base:"AT", name:"Tala Wildbow", cls:"Archer", grade:"A", pop:1, dmg:53.2, rate:2.18, range:178, kind:"single", hair:"#4dc86a", eye:"#3dff9a", style:1, desc:"Reliable single-target strikes.", flavor:"\u201cThe wild hunts through me.\u201d"},
  {id:"ATB", base:"AT", name:"Tala Wildbow", cls:"Archer", grade:"B", pop:1, dmg:32.2, rate:2.09, range:172, kind:"single", hair:"#4dc86a", eye:"#3dff9a", style:1, desc:"Reliable single-target strikes.", flavor:"\u201cThe wild hunts through me.\u201d"},
  {id:"ATC", base:"AT", name:"Tala Wildbow", cls:"Archer", grade:"C", pop:1, dmg:19.6, rate:2.01, range:168, kind:"single", hair:"#4dc86a", eye:"#3dff9a", style:1, desc:"Reliable single-target strikes.", flavor:"\u201cThe wild hunts through me.\u201d"},
  {id:"ATD", base:"AT", name:"Tala Wildbow", cls:"Archer", grade:"D", pop:1, dmg:11.9, rate:1.96, range:164, kind:"single", hair:"#4dc86a", eye:"#3dff9a", style:1, desc:"Reliable single-target strikes.", flavor:"\u201cThe wild hunts through me.\u201d"},
  {id:"ATE", base:"AT", name:"Tala Wildbow", cls:"Archer", grade:"E", pop:1, dmg:7.0, rate:1.9, range:160, kind:"single", hair:"#4dc86a", eye:"#3dff9a", style:1, desc:"Reliable single-target strikes.", flavor:"\u201cThe wild hunts through me.\u201d"},
  {id:"ATS", base:"AT", name:"Tala Wildbow", cls:"Archer", grade:"S", pop:1, dmg:87.5, rate:2.28, range:184, kind:"single", hair:"#4dc86a", eye:"#3dff9a", style:1, desc:"Reliable single-target strikes.", flavor:"\u201cThe wild hunts through me.\u201d"},
  {id:"BAA", base:"BA", name:"Elize Batori", cls:"Lancer", grade:"A", pop:1, dmg:68.4, rate:1.15, range:158, kind:"chain", hair:"#ff7a2a", eye:"#ffc93d", style:3, desc:"Arcs between several enemies. (chains 2)", flavor:"\u201cBlood is the finest vintage.\u201d", chain:2},
  {id:"BAB", base:"BA", name:"Elize Batori", cls:"Lancer", grade:"B", pop:1, dmg:41.4, rate:1.1, range:152, kind:"chain", hair:"#ff7a2a", eye:"#ffc93d", style:3, desc:"Arcs between several enemies. (chains 2)", flavor:"\u201cBlood is the finest vintage.\u201d", chain:2},
  {id:"BAS", base:"BA", name:"Elize Batori", cls:"Lancer", grade:"S", pop:1, dmg:112.5, rate:1.2, range:164, kind:"chain", hair:"#ff7a2a", eye:"#ffc93d", style:3, desc:"Arcs between several enemies. (chains 2)", flavor:"\u201cBlood is the finest vintage.\u201d", chain:2},
  {id:"BBA", base:"BB", name:"Beebee Mooncell", cls:"Alter Ego", grade:"A", pop:2, dmg:83.6, rate:1.38, range:168, kind:"multi", hair:"#e14dff", eye:"#35e0ff", style:5, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cThe moon cell watches, and giggles.\u201d", multi:2},
  {id:"BBB", base:"BB", name:"Beebee Mooncell", cls:"Alter Ego", grade:"B", pop:2, dmg:50.6, rate:1.32, range:162, kind:"multi", hair:"#e14dff", eye:"#35e0ff", style:5, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cThe moon cell watches, and giggles.\u201d", multi:2},
  {id:"BBS", base:"BB", name:"Beebee Mooncell", cls:"Alter Ego", grade:"S", pop:2, dmg:137.5, rate:1.44, range:174, kind:"multi", hair:"#e14dff", eye:"#35e0ff", style:5, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cThe moon cell watches, and giggles.\u201d", multi:2},
  {id:"BBT", base:"BB", name:"Beebee Mooncell", cls:"Alter Ego", grade:"STAR", pop:4, dmg:880.0, rate:1.68, range:194, kind:"multi", hair:"#e14dff", eye:"#35e0ff", style:5, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cThe moon cell watches, and giggles.\u201d", multi:2, exTitle:"Moon Cell Automaton"},
  {id:"BBX", base:"BB", name:"Beebee Mooncell", cls:"Alter Ego", grade:"EX", pop:3, dmg:440.0, rate:1.56, range:184, kind:"multi", hair:"#e14dff", eye:"#35e0ff", style:5, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cThe moon cell watches, and giggles.\u201d", multi:2, exTitle:"Third Pleasure Deva"},
  {id:"BRA", base:"BR", name:"Nera Blossom", cls:"Saber", grade:"A", pop:1, dmg:68.4, rate:1.15, range:138, kind:"burn", hair:"#ff9ecb", eye:"#ff3d8e", style:1, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cBloom for me, or be cut down.\u201d", aoe:44, dot:18.2, dotT:2},
  {id:"BRS", base:"BR", name:"Nera Blossom", cls:"Saber", grade:"S", pop:1, dmg:112.5, rate:1.2, range:144, kind:"burn", hair:"#ff9ecb", eye:"#ff3d8e", style:1, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cBloom for me, or be cut down.\u201d", aoe:46, dot:30.0, dotT:2},
  {id:"EMA", base:"EM", name:"Shiro Kanzaki", cls:"Archer", grade:"A", pop:1, dmg:60.8, rate:1.72, range:168, kind:"multi", hair:"#c8c8d8", eye:"#ff9440", style:0, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cI am the bone of my sword.\u201d", multi:2},
  {id:"EMB", base:"EM", name:"Shiro Kanzaki", cls:"Archer", grade:"B", pop:1, dmg:36.8, rate:1.65, range:162, kind:"multi", hair:"#c8c8d8", eye:"#ff9440", style:0, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cI am the bone of my sword.\u201d", multi:2},
  {id:"EMC", base:"EM", name:"Shiro Kanzaki", cls:"Archer", grade:"C", pop:1, dmg:22.4, rate:1.59, range:158, kind:"multi", hair:"#c8c8d8", eye:"#ff9440", style:0, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cI am the bone of my sword.\u201d", multi:2},
  {id:"EMS", base:"EM", name:"Shiro Kanzaki", cls:"Archer", grade:"S", pop:1, dmg:100.0, rate:1.8, range:174, kind:"multi", hair:"#c8c8d8", eye:"#ff9440", style:0, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cI am the bone of my sword.\u201d", multi:2},
  {id:"ENT", base:"EN", name:"Enkiel Heaven Chains", cls:"Lancer", grade:"EX", pop:3, dmg:480.0, rate:1.3, range:204, kind:"stun", hair:"#7ae0b0", eye:"#3dff9a", style:0, desc:"Impact may stun enemies in place. (30% stun)", flavor:"\u201cThe chains remember. The chains weep.\u201d", stunC:0.3, stunT:0.8, exTitle:"Chain of Heaven"},
  {id:"ESA", base:"ES", name:"Iskander Kingson", cls:"Rider", grade:"A", pop:2, dmg:91.2, rate:0.92, range:138, kind:"aoe", hair:"#d43a3a", eye:"#ffd23d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cConqueror of horizons, king of riders.\u201d", aoe:54},
  {id:"ESB", base:"ES", name:"Iskander Kingson", cls:"Rider", grade:"B", pop:2, dmg:55.2, rate:0.88, range:132, kind:"aoe", hair:"#d43a3a", eye:"#ffd23d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cConqueror of horizons, king of riders.\u201d", aoe:50},
  {id:"ESC", base:"ES", name:"Iskander Kingson", cls:"Rider", grade:"C", pop:2, dmg:33.6, rate:0.85, range:128, kind:"aoe", hair:"#d43a3a", eye:"#ffd23d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cConqueror of horizons, king of riders.\u201d", aoe:48},
  {id:"ESS", base:"ES", name:"Iskander Kingson", cls:"Rider", grade:"S", pop:2, dmg:150.0, rate:0.96, range:144, kind:"aoe", hair:"#d43a3a", eye:"#ffd23d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cConqueror of horizons, king of riders.\u201d", aoe:57},
  {id:"FDA", base:"FD", name:"Captain Draka", cls:"Rider", grade:"A", pop:1, dmg:68.4, rate:1.84, range:163, kind:"single", hair:"#ff9440", eye:"#35e0ff", style:1, desc:"Reliable single-target strikes. (+1 gold per hit)", flavor:"\u201cThe stars themselves are my wake.\u201d", greed:1},
  {id:"FDB", base:"FD", name:"Captain Draka", cls:"Rider", grade:"B", pop:1, dmg:41.4, rate:1.76, range:157, kind:"single", hair:"#ff9440", eye:"#35e0ff", style:1, desc:"Reliable single-target strikes. (+1 gold per hit)", flavor:"\u201cThe stars themselves are my wake.\u201d", greed:1},
  {id:"FDS", base:"FD", name:"Captain Draka", cls:"Rider", grade:"S", pop:1, dmg:112.5, rate:1.92, range:169, kind:"single", hair:"#ff9440", eye:"#35e0ff", style:1, desc:"Reliable single-target strikes. (+1 gold per hit)", flavor:"\u201cThe stars themselves are my wake.\u201d", greed:1},
  {id:"FDX", base:"FD", name:"Captain Draka", cls:"Rider", grade:"EX", pop:3, dmg:360.0, rate:2.08, range:179, kind:"single", hair:"#ff9440", eye:"#35e0ff", style:1, desc:"Reliable single-target strikes. (+1 gold per hit)", flavor:"\u201cThe stars themselves are my wake.\u201d", greed:1, exTitle:"Pioneer of the Stars"},
  {id:"FRX", base:"FR", name:"Frankie Stein", cls:"Berserker", grade:"EX", pop:3, dmg:600.0, rate:0.98, range:144, kind:"aoe", hair:"#7ae0b0", eye:"#ffc93d", style:2, desc:"Heavy swings splash damage to nearby foes. (20% stun)", flavor:"\u201cA gentle monster, bearing lightning.\u201d", aoe:70, stunC:0.2, stunT:0.5, exTitle:"Frankenstein's Monster"},
  {id:"GAA", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"A", pop:1, dmg:68.4, rate:1.32, range:138, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5},
  {id:"GAB", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"B", pop:1, dmg:41.4, rate:1.26, range:132, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5},
  {id:"GAC", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"C", pop:1, dmg:25.2, rate:1.22, range:128, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5},
  {id:"GAD", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"D", pop:1, dmg:15.3, rate:1.18, range:124, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5},
  {id:"GAE", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"E", pop:1, dmg:9.0, rate:1.15, range:120, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5},
  {id:"GAS", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"S", pop:1, dmg:112.5, rate:1.38, range:144, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5},
  {id:"GAX", base:"GA", name:"Kai Solblade", cls:"Saber", grade:"EX", pop:3, dmg:360.0, rate:1.49, range:154, kind:"crit", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"High critical strike chance for heavy burst damage. (25% for 2.5\u00d7)", flavor:"\u201cThe sun itself kneels to my blade.\u201d", critC:0.25, critX:2.5, exTitle:"Knight of the Sun"},
  {id:"GMA", base:"GM", name:"Gilden Ark", cls:"Archer", grade:"A", pop:2, dmg:83.6, rate:1.49, range:183, kind:"pierce", hair:"#ffd23d", eye:"#ff3d5e", style:4, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cAll treasures in the world are mine.\u201d", pierce:2},
  {id:"GMB", base:"GM", name:"Gilden Ark", cls:"Archer", grade:"B", pop:2, dmg:50.6, rate:1.43, range:177, kind:"pierce", hair:"#ffd23d", eye:"#ff3d5e", style:4, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cAll treasures in the world are mine.\u201d", pierce:2},
  {id:"GMS", base:"GM", name:"Gilden Ark", cls:"Archer", grade:"S", pop:2, dmg:137.5, rate:1.56, range:189, kind:"pierce", hair:"#ffd23d", eye:"#ff3d5e", style:4, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cAll treasures in the world are mine.\u201d", pierce:2},
  {id:"GMX", base:"GM", name:"Gilden Ark", cls:"Archer", grade:"EX", pop:3, dmg:440.0, rate:1.69, range:199, kind:"pierce", hair:"#ffd23d", eye:"#ff3d5e", style:4, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cAll treasures in the world are mine.\u201d", pierce:2, exTitle:"Genesis Mystic Code"},
  {id:"GOA", base:"GO", name:"Suzu Kamui", cls:"Saber", grade:"A", pop:1, dmg:76.0, rate:1.49, range:148, kind:"single", hair:"#b06ae0", eye:"#ff3d8e", style:4, desc:"Reliable single-target strikes.", flavor:"\u201cMy sword dances; the world follows.\u201d"},
  {id:"GOB", base:"GO", name:"Suzu Kamui", cls:"Saber", grade:"B", pop:1, dmg:46.0, rate:1.43, range:142, kind:"single", hair:"#b06ae0", eye:"#ff3d8e", style:4, desc:"Reliable single-target strikes.", flavor:"\u201cMy sword dances; the world follows.\u201d"},
  {id:"GOS", base:"GO", name:"Suzu Kamui", cls:"Saber", grade:"S", pop:1, dmg:125.0, rate:1.56, range:154, kind:"single", hair:"#b06ae0", eye:"#ff3d8e", style:4, desc:"Reliable single-target strikes.", flavor:"\u201cMy sword dances; the world follows.\u201d"},
  {id:"HXT", base:"HX", name:"Mysterious Heroine Z", cls:"Assassin", grade:"EX", pop:3, dmg:520.0, rate:1.95, range:194, kind:"crit", hair:"#35e0ff", eye:"#ffd23d", style:4, desc:"High critical strike chance for heavy burst damage. (40% for 4\u00d7)", flavor:"\u201cI am nobody\u2019s counter. The evidence suggests otherwise.\u201d", critC:0.4, critX:4, exTitle:"Mysterious Heroine X"},
  {id:"JAA", base:"JA", name:"Venge Jehanne", cls:"Ruler", grade:"A", pop:2, dmg:91.2, rate:1.03, range:183, kind:"beam", hair:"#6a7a9a", eye:"#e14dff", style:4, desc:"A focused beam melts single targets.", flavor:"\u201cVengeance is a prayer answered.\u201d", aoe:44},
  {id:"JAS", base:"JA", name:"Venge Jehanne", cls:"Ruler", grade:"S", pop:2, dmg:150.0, rate:1.08, range:189, kind:"beam", hair:"#6a7a9a", eye:"#e14dff", style:4, desc:"A focused beam melts single targets.", flavor:"\u201cVengeance is a prayer answered.\u201d", aoe:46},
  {id:"JEA", base:"JE", name:"Jehanne Oracle", cls:"Ruler", grade:"A", pop:2, dmg:83.6, rate:1.15, range:193, kind:"chain", hair:"#f2ead8", eye:"#ffd23d", style:3, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cThe oracle speaks; heaven answers.\u201d", chain:3},
  {id:"JEB", base:"JE", name:"Jehanne Oracle", cls:"Ruler", grade:"B", pop:2, dmg:50.6, rate:1.1, range:187, kind:"chain", hair:"#f2ead8", eye:"#ffd23d", style:3, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cThe oracle speaks; heaven answers.\u201d", chain:3},
  {id:"JES", base:"JE", name:"Jehanne Oracle", cls:"Ruler", grade:"S", pop:2, dmg:137.5, rate:1.2, range:199, kind:"chain", hair:"#f2ead8", eye:"#ffd23d", style:3, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cThe oracle speaks; heaven answers.\u201d", chain:3},
  {id:"JEX", base:"JE", name:"Jehanne Oracle", cls:"Ruler", grade:"EX", pop:3, dmg:440.0, rate:1.3, range:209, kind:"chain", hair:"#f2ead8", eye:"#ffd23d", style:3, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cThe oracle speaks; heaven answers.\u201d", chain:3, exTitle:"The Crimson Saint"},
  {id:"KAA", base:"KA", name:"Karn Solheir", cls:"Lancer", grade:"A", pop:2, dmg:83.6, rate:1.09, range:168, kind:"burn", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cI bear the dawn. Behold it, and burn.\u201d", aoe:49, dot:27.4, dotT:2},
  {id:"KAB", base:"KA", name:"Karn Solheir", cls:"Lancer", grade:"B", pop:2, dmg:50.6, rate:1.04, range:162, kind:"burn", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cI bear the dawn. Behold it, and burn.\u201d", aoe:46, dot:16.6, dotT:2},
  {id:"KAC", base:"KA", name:"Karn Solheir", cls:"Lancer", grade:"C", pop:2, dmg:30.8, rate:1.01, range:158, kind:"burn", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cI bear the dawn. Behold it, and burn.\u201d", aoe:44, dot:10.1, dotT:2},
  {id:"KAS", base:"KA", name:"Karn Solheir", cls:"Lancer", grade:"S", pop:2, dmg:137.5, rate:1.14, range:174, kind:"burn", hair:"#ffd23d", eye:"#ff9440", style:0, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cI bear the dawn. Behold it, and burn.\u201d", aoe:52, dot:45.0, dotT:2},
  {id:"KHA", base:"KH", name:"Kulan Gaebole", cls:"Lancer", grade:"A", pop:1, dmg:68.4, rate:1.32, range:158, kind:"pierce", hair:"#35a0ff", eye:"#35e0ff", style:0, desc:"Thrusts pierce through multiple enemies. (pierces 3)", flavor:"\u201cThe hound never releases its prey.\u201d", pierce:3},
  {id:"KHB", base:"KH", name:"Kulan Gaebole", cls:"Lancer", grade:"B", pop:1, dmg:41.4, rate:1.26, range:152, kind:"pierce", hair:"#35a0ff", eye:"#35e0ff", style:0, desc:"Thrusts pierce through multiple enemies. (pierces 3)", flavor:"\u201cThe hound never releases its prey.\u201d", pierce:3},
  {id:"KHC", base:"KH", name:"Kulan Gaebole", cls:"Lancer", grade:"C", pop:1, dmg:25.2, rate:1.22, range:148, kind:"pierce", hair:"#35a0ff", eye:"#35e0ff", style:0, desc:"Thrusts pierce through multiple enemies. (pierces 3)", flavor:"\u201cThe hound never releases its prey.\u201d", pierce:3},
  {id:"KHS", base:"KH", name:"Kulan Gaebole", cls:"Lancer", grade:"S", pop:1, dmg:112.5, rate:1.38, range:164, kind:"pierce", hair:"#35a0ff", eye:"#35e0ff", style:0, desc:"Thrusts pierce through multiple enemies. (pierces 3)", flavor:"\u201cThe hound never releases its prey.\u201d", pierce:3},
  {id:"KIA", base:"KI", name:"Kirei Executor", cls:"Assassin", grade:"A", pop:1, dmg:68.4, rate:1.26, range:133, kind:"poison", hair:"#2b2d44", eye:"#ff3d5e", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cRejoice. Your suffering has meaning.\u201d", aoe:41, dot:22.8, dotT:2.5},
  {id:"KIB", base:"KI", name:"Kirei Executor", cls:"Assassin", grade:"B", pop:1, dmg:41.4, rate:1.21, range:127, kind:"poison", hair:"#2b2d44", eye:"#ff3d5e", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cRejoice. Your suffering has meaning.\u201d", aoe:39, dot:13.8, dotT:2.5},
  {id:"KIC", base:"KI", name:"Kirei Executor", cls:"Assassin", grade:"C", pop:1, dmg:25.2, rate:1.17, range:123, kind:"poison", hair:"#2b2d44", eye:"#ff3d5e", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cRejoice. Your suffering has meaning.\u201d", aoe:37, dot:8.4, dotT:2.5},
  {id:"KID", base:"KI", name:"Kirei Executor", cls:"Assassin", grade:"D", pop:1, dmg:15.3, rate:1.13, range:119, kind:"poison", hair:"#2b2d44", eye:"#ff3d5e", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cRejoice. Your suffering has meaning.\u201d", aoe:36, dot:5.1, dotT:2.5},
  {id:"KIE", base:"KI", name:"Kirei Executor", cls:"Assassin", grade:"E", pop:1, dmg:9.0, rate:1.1, range:115, kind:"poison", hair:"#2b2d44", eye:"#ff3d5e", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cRejoice. Your suffering has meaning.\u201d", aoe:34, dot:3.0, dotT:2.5},
  {id:"KIS", base:"KI", name:"Kirei Executor", cls:"Assassin", grade:"S", pop:1, dmg:112.5, rate:1.32, range:139, kind:"poison", hair:"#2b2d44", eye:"#ff3d5e", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cRejoice. Your suffering has meaning.\u201d", aoe:44, dot:37.5, dotT:2.5},
  {id:"LKT", base:"LK", name:"Astraea Star-Spear", cls:"Lancer", grade:"EX", pop:3, dmg:560.0, rate:1.3, range:219, kind:"pierce", hair:"#ffd23d", eye:"#35e0ff", style:3, desc:"Thrusts pierce through multiple enemies. (pierces 4)", flavor:"\u201cAt the edge of the sky, the tower of dawn answers.\u201d", aoe:42, pierce:4, exTitle:"Goddess of Rhongomyniad"},
  {id:"LUA", base:"LU", name:"Bu Fengxian", cls:"Berserker", grade:"A", pop:2, dmg:106.4, rate:0.75, range:108, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cAmong men, the mightiest. Among beasts, the fiercest.\u201d", aoe:49},
  {id:"LUB", base:"LU", name:"Bu Fengxian", cls:"Berserker", grade:"B", pop:2, dmg:64.4, rate:0.72, range:102, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cAmong men, the mightiest. Among beasts, the fiercest.\u201d", aoe:46},
  {id:"LUC", base:"LU", name:"Bu Fengxian", cls:"Berserker", grade:"C", pop:2, dmg:39.2, rate:0.69, range:98, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cAmong men, the mightiest. Among beasts, the fiercest.\u201d", aoe:44},
  {id:"LUD", base:"LU", name:"Bu Fengxian", cls:"Berserker", grade:"D", pop:2, dmg:23.8, rate:0.67, range:94, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cAmong men, the mightiest. Among beasts, the fiercest.\u201d", aoe:42},
  {id:"LUS", base:"LU", name:"Bu Fengxian", cls:"Berserker", grade:"S", pop:2, dmg:175.0, rate:0.78, range:114, kind:"aoe", hair:"#8a5a33", eye:"#ffc93d", style:2, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cAmong men, the mightiest. Among beasts, the fiercest.\u201d", aoe:52},
  {id:"MDA", base:"MD", name:"Mesa Gorgon", cls:"Rider", grade:"A", pop:1, dmg:60.8, rate:1.61, range:153, kind:"slow", hair:"#7a4dc8", eye:"#e14dff", style:4, desc:"Chills enemies, slowing their advance. (\u221230% speed)", flavor:"\u201cLook into my eyes, and stay forever.\u201d", slow:0.3, slowT:1.2},
  {id:"MDB", base:"MD", name:"Mesa Gorgon", cls:"Rider", grade:"B", pop:1, dmg:36.8, rate:1.54, range:147, kind:"slow", hair:"#7a4dc8", eye:"#e14dff", style:4, desc:"Chills enemies, slowing their advance. (\u221230% speed)", flavor:"\u201cLook into my eyes, and stay forever.\u201d", slow:0.3, slowT:1.2},
  {id:"MDC", base:"MD", name:"Mesa Gorgon", cls:"Rider", grade:"C", pop:1, dmg:22.4, rate:1.48, range:143, kind:"slow", hair:"#7a4dc8", eye:"#e14dff", style:4, desc:"Chills enemies, slowing their advance. (\u221230% speed)", flavor:"\u201cLook into my eyes, and stay forever.\u201d", slow:0.3, slowT:1.2},
  {id:"MDD", base:"MD", name:"Mesa Gorgon", cls:"Rider", grade:"D", pop:1, dmg:13.6, rate:1.44, range:139, kind:"slow", hair:"#7a4dc8", eye:"#e14dff", style:4, desc:"Chills enemies, slowing their advance. (\u221230% speed)", flavor:"\u201cLook into my eyes, and stay forever.\u201d", slow:0.3, slowT:1.2},
  {id:"MDS", base:"MD", name:"Mesa Gorgon", cls:"Rider", grade:"S", pop:1, dmg:100.0, rate:1.68, range:159, kind:"slow", hair:"#7a4dc8", eye:"#e14dff", style:4, desc:"Chills enemies, slowing their advance. (\u221230% speed)", flavor:"\u201cLook into my eyes, and stay forever.\u201d", slow:0.3, slowT:1.2},
  {id:"MDX", base:"MD", name:"Mesa Gorgon", cls:"Rider", grade:"EX", pop:3, dmg:320.0, rate:1.82, range:169, kind:"slow", hair:"#7a4dc8", eye:"#e14dff", style:4, desc:"Chills enemies, slowing their advance. (\u221230% speed)", flavor:"\u201cLook into my eyes, and stay forever.\u201d", slow:0.3, slowT:1.2, exTitle:"Gorgon Maid"},
  {id:"MLT", base:"ML", name:"Meltra Ego Blossom", cls:"Alter Ego", grade:"EX", pop:3, dmg:480.0, rate:1.69, range:189, kind:"multi", hair:"#b06ae0", eye:"#ff3d8e", style:1, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cOne\u2026 two\u2026 three\u2026 please, dissolve!\u201d", multi:2},
  {id:"MLX", base:"ML", name:"Meltra Ego Blossom", cls:"Alter Ego", grade:"EX", pop:3, dmg:480.0, rate:1.69, range:189, kind:"multi", hair:"#b06ae0", eye:"#ff3d8e", style:1, desc:"Strikes multiple targets each attack. (2 targets)", flavor:"\u201cOne\u2026 two\u2026 three\u2026 please, dissolve!\u201d", multi:2, exTitle:"Mysterious Alter Ego \u039b"},
  {id:"MST", base:"MS", name:"Mira Shieldheart", cls:"Shielder", grade:"EX", pop:3, dmg:400.0, rate:1.1, range:159, kind:"stun", hair:"#d8a8c8", eye:"#ff9ecb", style:3, desc:"Impact may stun enemies in place. (allies +12% dmg)", flavor:"\u201cNone shall pass. Not even you.\u201d", aoe:62, stunC:0.25, stunT:0.6, aura:0.12, exTitle:"False Shielder"},
  {id:"MXT", base:"MX", name:"Meltra Prime", cls:"Alter Ego", grade:"EX", pop:3, dmg:600.0, rate:1.82, range:204, kind:"multi", hair:"#e0a0ff", eye:"#ff3d5e", style:4, desc:"Strikes multiple targets each attack. (3 targets)", flavor:"\u201cThe highest-spec ego. Nobody dares disagree.\u201d", dot:144.0, dotT:2, multi:3, exTitle:"False Final Ascension"},
  {id:"NCA", base:"NC", name:"Nera Crimson", cls:"Saber", grade:"A", pop:1, dmg:68.4, rate:1.15, range:133, kind:"aoe", hair:"#ff5a7a", eye:"#ffd23d", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cUmu! Praise me louder!\u201d", aoe:41},
  {id:"NCB", base:"NC", name:"Nera Crimson", cls:"Saber", grade:"B", pop:1, dmg:41.4, rate:1.1, range:127, kind:"aoe", hair:"#ff5a7a", eye:"#ffd23d", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cUmu! Praise me louder!\u201d", aoe:39},
  {id:"NCC", base:"NC", name:"Nera Crimson", cls:"Saber", grade:"C", pop:1, dmg:25.2, rate:1.06, range:123, kind:"aoe", hair:"#ff5a7a", eye:"#ffd23d", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cUmu! Praise me louder!\u201d", aoe:37},
  {id:"NCS", base:"NC", name:"Nera Crimson", cls:"Saber", grade:"S", pop:1, dmg:112.5, rate:1.2, range:139, kind:"aoe", hair:"#ff5a7a", eye:"#ffd23d", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cUmu! Praise me louder!\u201d", aoe:44},
  {id:"NCX", base:"NC", name:"Nera Crimson", cls:"Saber", grade:"EX", pop:3, dmg:360.0, rate:1.3, range:149, kind:"aoe", hair:"#ff5a7a", eye:"#ffd23d", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cUmu! Praise me louder!\u201d", aoe:48, exTitle:"Mystic Code of the Emperor"},
  {id:"PAA", base:"PA", name:"Pashia Lip", cls:"Alter Ego", grade:"A", pop:2, dmg:91.2, rate:0.92, range:168, kind:"beam", hair:"#ff3d8e", eye:"#ffd23d", style:4, desc:"A focused beam melts single targets.", flavor:"\u201cLove me, or I will crush you.\u201d", aoe:41},
  {id:"PAB", base:"PA", name:"Pashia Lip", cls:"Alter Ego", grade:"B", pop:2, dmg:55.2, rate:0.88, range:162, kind:"beam", hair:"#ff3d8e", eye:"#ffd23d", style:4, desc:"A focused beam melts single targets.", flavor:"\u201cLove me, or I will crush you.\u201d", aoe:39},
  {id:"PAC", base:"PA", name:"Pashia Lip", cls:"Alter Ego", grade:"C", pop:2, dmg:33.6, rate:0.85, range:158, kind:"beam", hair:"#ff3d8e", eye:"#ffd23d", style:4, desc:"A focused beam melts single targets.", flavor:"\u201cLove me, or I will crush you.\u201d", aoe:37},
  {id:"PAS", base:"PA", name:"Pashia Lip", cls:"Alter Ego", grade:"S", pop:2, dmg:150.0, rate:0.96, range:174, kind:"beam", hair:"#ff3d8e", eye:"#ffd23d", style:4, desc:"A focused beam melts single targets.", flavor:"\u201cLove me, or I will crush you.\u201d", aoe:44},
  {id:"PDA", base:"PD", name:"Aria Starforge", cls:"Saber", grade:"A", pop:1, dmg:76.0, rate:1.38, range:143, kind:"single", hair:"#3a6ea8", eye:"#35e0ff", style:3, desc:"Reliable single-target strikes.", flavor:"\u201cA king does not ask permission to win.\u201d"},
  {id:"PDB", base:"PD", name:"Aria Starforge", cls:"Saber", grade:"B", pop:1, dmg:46.0, rate:1.32, range:137, kind:"single", hair:"#3a6ea8", eye:"#35e0ff", style:3, desc:"Reliable single-target strikes.", flavor:"\u201cA king does not ask permission to win.\u201d"},
  {id:"PDC", base:"PD", name:"Aria Starforge", cls:"Saber", grade:"C", pop:1, dmg:28.0, rate:1.27, range:133, kind:"single", hair:"#3a6ea8", eye:"#35e0ff", style:3, desc:"Reliable single-target strikes.", flavor:"\u201cA king does not ask permission to win.\u201d"},
  {id:"PDS", base:"PD", name:"Aria Starforge", cls:"Saber", grade:"S", pop:1, dmg:125.0, rate:1.44, range:149, kind:"single", hair:"#3a6ea8", eye:"#35e0ff", style:3, desc:"Reliable single-target strikes.", flavor:"\u201cA king does not ask permission to win.\u201d"},
  {id:"PDX", base:"PD", name:"Aria Starforge", cls:"Saber", grade:"EX", pop:3, dmg:400.0, rate:1.56, range:159, kind:"single", hair:"#3a6ea8", eye:"#35e0ff", style:3, desc:"Reliable single-target strikes.", flavor:"\u201cA king does not ask permission to win.\u201d", exTitle:"Mystic Code of the Star"},
  {id:"PTA", base:"PT", name:"Kitsune Casual", cls:"Caster", grade:"A", pop:1, dmg:60.8, rate:1.32, range:153, kind:"aoe", hair:"#ff9ecb", eye:"#3dff9a", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cCasual day, catastrophic power.\u201d", aoe:49},
  {id:"PTB", base:"PT", name:"Kitsune Casual", cls:"Caster", grade:"B", pop:1, dmg:36.8, rate:1.26, range:147, kind:"aoe", hair:"#ff9ecb", eye:"#3dff9a", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cCasual day, catastrophic power.\u201d", aoe:46},
  {id:"PTS", base:"PT", name:"Kitsune Casual", cls:"Caster", grade:"S", pop:1, dmg:100.0, rate:1.38, range:159, kind:"aoe", hair:"#ff9ecb", eye:"#3dff9a", style:1, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cCasual day, catastrophic power.\u201d", aoe:52},
  {id:"RHA", base:"RH", name:"Rime Picturebook", cls:"Caster", grade:"A", pop:1, dmg:53.2, rate:1.21, range:153, kind:"slow", hair:"#bfe8ff", eye:"#4aa8ff", style:3, desc:"Chills enemies, slowing their advance. (\u221235% speed)", flavor:"\u201cOnce upon a time, you were already mine.\u201d", aoe:49, slow:0.35, slowT:1.3},
  {id:"RHB", base:"RH", name:"Rime Picturebook", cls:"Caster", grade:"B", pop:1, dmg:32.2, rate:1.16, range:147, kind:"slow", hair:"#bfe8ff", eye:"#4aa8ff", style:3, desc:"Chills enemies, slowing their advance. (\u221235% speed)", flavor:"\u201cOnce upon a time, you were already mine.\u201d", aoe:46, slow:0.35, slowT:1.3},
  {id:"RHC", base:"RH", name:"Rime Picturebook", cls:"Caster", grade:"C", pop:1, dmg:19.6, rate:1.11, range:143, kind:"slow", hair:"#bfe8ff", eye:"#4aa8ff", style:3, desc:"Chills enemies, slowing their advance. (\u221235% speed)", flavor:"\u201cOnce upon a time, you were already mine.\u201d", aoe:44, slow:0.35, slowT:1.3},
  {id:"RHD", base:"RH", name:"Rime Picturebook", cls:"Caster", grade:"D", pop:1, dmg:11.9, rate:1.08, range:139, kind:"slow", hair:"#bfe8ff", eye:"#4aa8ff", style:3, desc:"Chills enemies, slowing their advance. (\u221235% speed)", flavor:"\u201cOnce upon a time, you were already mine.\u201d", aoe:42, slow:0.35, slowT:1.3},
  {id:"RHS", base:"RH", name:"Rime Picturebook", cls:"Caster", grade:"S", pop:1, dmg:87.5, rate:1.26, range:159, kind:"slow", hair:"#bfe8ff", eye:"#4aa8ff", style:3, desc:"Chills enemies, slowing their advance. (\u221235% speed)", flavor:"\u201cOnce upon a time, you were already mine.\u201d", aoe:52, slow:0.35, slowT:1.3},
  {id:"RYA", base:"RY", name:"Shiki Voidblade", cls:"Assassin", grade:"A", pop:1, dmg:91.2, rate:1.15, range:128, kind:"crit", hair:"#3a3a5a", eye:"#35e0ff", style:4, desc:"High critical strike chance for heavy burst damage. (35% for 3\u00d7)", flavor:"\u201cI will cut even the void.\u201d", critC:0.35, critX:3},
  {id:"RYB", base:"RY", name:"Shiki Voidblade", cls:"Assassin", grade:"B", pop:1, dmg:55.2, rate:1.1, range:122, kind:"crit", hair:"#3a3a5a", eye:"#35e0ff", style:4, desc:"High critical strike chance for heavy burst damage. (35% for 3\u00d7)", flavor:"\u201cI will cut even the void.\u201d", critC:0.35, critX:3},
  {id:"RYC", base:"RY", name:"Shiki Voidblade", cls:"Assassin", grade:"C", pop:1, dmg:33.6, rate:1.06, range:118, kind:"crit", hair:"#3a3a5a", eye:"#35e0ff", style:4, desc:"High critical strike chance for heavy burst damage. (35% for 3\u00d7)", flavor:"\u201cI will cut even the void.\u201d", critC:0.35, critX:3},
  {id:"RYS", base:"RY", name:"Shiki Voidblade", cls:"Assassin", grade:"S", pop:1, dmg:150.0, rate:1.2, range:134, kind:"crit", hair:"#3a3a5a", eye:"#35e0ff", style:4, desc:"High critical strike chance for heavy burst damage. (35% for 3\u00d7)", flavor:"\u201cI will cut even the void.\u201d", critC:0.35, critX:3},
  {id:"SAA", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"A", pop:1, dmg:60.8, rate:1.21, range:153, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:51},
  {id:"SAB", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"B", pop:1, dmg:36.8, rate:1.16, range:147, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:48},
  {id:"SAC", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"C", pop:1, dmg:22.4, rate:1.11, range:143, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:46},
  {id:"SAD", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"D", pop:1, dmg:13.6, rate:1.08, range:139, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:44},
  {id:"SAE", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"E", pop:1, dmg:8.0, rate:1.05, range:135, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:42},
  {id:"SAS", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"S", pop:1, dmg:100.0, rate:1.26, range:159, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:54},
  {id:"SAX", base:"SA", name:"Saku Hollow", cls:"Caster", grade:"EX", pop:3, dmg:320.0, rate:1.37, range:169, kind:"aoe", hair:"#b06ae0", eye:"#e14dff", style:3, desc:"Heavy swings splash damage to nearby foes.", flavor:"\u201cThe hollow blooms with imaginary flowers.\u201d", aoe:59, exTitle:"Bloom Titan Kingprotea"},
  {id:"SET", base:"SE", name:"Shami Hanging Empress", cls:"Assassin", grade:"EX", pop:3, dmg:480.0, rate:1.3, range:204, kind:"poison", hair:"#7a4dc8", eye:"#e14dff", style:5, desc:"Venom rots enemies over time.", flavor:"\u201cMy gardens were a wonder; my wine, the eighth.\u201d", aoe:70, dot:192.0, dotT:3, exTitle:"Empress of Hanging Gardens"},
  {id:"SKT", base:"SK", name:"Scaha the Wise", cls:"Lancer", grade:"EX", pop:3, dmg:560.0, rate:1.37, range:209, kind:"pierce", hair:"#d43a3a", eye:"#e14dff", style:4, desc:"Thrusts pierce through multiple enemies. (pierces 3)", flavor:"\u201cThe shadow lands teach only the worthy.\u201d", aoe:42, pierce:3, exTitle:"Sc\u00e1thach of the Shadow"},
  {id:"STA", base:"ST", name:"Kitsune Vitch", cls:"Caster", grade:"A", pop:1, dmg:68.4, rate:1.15, range:163, kind:"chain", hair:"#e14dff", eye:"#ff3d8e", style:4, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cA witch\u2019s smile hides nine knives.\u201d", chain:3},
  {id:"STB", base:"ST", name:"Kitsune Vitch", cls:"Caster", grade:"B", pop:1, dmg:41.4, rate:1.1, range:157, kind:"chain", hair:"#e14dff", eye:"#ff3d8e", style:4, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cA witch\u2019s smile hides nine knives.\u201d", chain:3},
  {id:"STS", base:"ST", name:"Kitsune Vitch", cls:"Caster", grade:"S", pop:1, dmg:112.5, rate:1.2, range:169, kind:"chain", hair:"#e14dff", eye:"#ff3d8e", style:4, desc:"Arcs between several enemies. (chains 3)", flavor:"\u201cA witch\u2019s smile hides nine knives.\u201d", chain:3},
  {id:"TAA", base:"TA", name:"Tamaki Ninefox", cls:"Caster", grade:"A", pop:1, dmg:60.8, rate:1.15, range:158, kind:"burn", hair:"#ff9ecb", eye:"#ffd23d", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cNine tails, one devoted heart.\u201d", aoe:49, dot:22.8, dotT:2},
  {id:"TAB", base:"TA", name:"Tamaki Ninefox", cls:"Caster", grade:"B", pop:1, dmg:36.8, rate:1.1, range:152, kind:"burn", hair:"#ff9ecb", eye:"#ffd23d", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cNine tails, one devoted heart.\u201d", aoe:46, dot:13.8, dotT:2},
  {id:"TAC", base:"TA", name:"Tamaki Ninefox", cls:"Caster", grade:"C", pop:1, dmg:22.4, rate:1.06, range:148, kind:"burn", hair:"#ff9ecb", eye:"#ffd23d", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cNine tails, one devoted heart.\u201d", aoe:44, dot:8.4, dotT:2},
  {id:"TAS", base:"TA", name:"Tamaki Ninefox", cls:"Caster", grade:"S", pop:1, dmg:100.0, rate:1.2, range:164, kind:"burn", hair:"#ff9ecb", eye:"#ffd23d", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cNine tails, one devoted heart.\u201d", aoe:52, dot:37.5, dotT:2},
  {id:"TAX", base:"TA", name:"Tamaki Ninefox", cls:"Caster", grade:"EX", pop:3, dmg:320.0, rate:1.3, range:174, kind:"burn", hair:"#ff9ecb", eye:"#ffd23d", style:3, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cNine tails, one devoted heart.\u201d", aoe:56, dot:120.0, dotT:2, exTitle:"Mystic Code of the Sun"},
  {id:"TOA", base:"TO", name:"Rina Jewelcaster", cls:"Caster", grade:"A", pop:1, dmg:60.8, rate:1.15, range:163, kind:"slow", hair:"#d8d8e8", eye:"#bfe8ff", style:5, desc:"Chills enemies, slowing their advance. (\u221240% speed)", flavor:"\u201cThe jewels obey my will.\u201d", aoe:54, slow:0.4, slowT:1.4},
  {id:"TOB", base:"TO", name:"Rina Jewelcaster", cls:"Caster", grade:"B", pop:1, dmg:36.8, rate:1.1, range:157, kind:"slow", hair:"#d8d8e8", eye:"#bfe8ff", style:5, desc:"Chills enemies, slowing their advance. (\u221240% speed)", flavor:"\u201cThe jewels obey my will.\u201d", aoe:50, slow:0.4, slowT:1.4},
  {id:"TOC", base:"TO", name:"Rina Jewelcaster", cls:"Caster", grade:"C", pop:1, dmg:22.4, rate:1.06, range:153, kind:"slow", hair:"#d8d8e8", eye:"#bfe8ff", style:5, desc:"Chills enemies, slowing their advance. (\u221240% speed)", flavor:"\u201cThe jewels obey my will.\u201d", aoe:48, slow:0.4, slowT:1.4},
  {id:"TOS", base:"TO", name:"Rina Jewelcaster", cls:"Caster", grade:"S", pop:1, dmg:100.0, rate:1.2, range:169, kind:"slow", hair:"#d8d8e8", eye:"#bfe8ff", style:5, desc:"Chills enemies, slowing their advance. (\u221240% speed)", flavor:"\u201cThe jewels obey my will.\u201d", aoe:57, slow:0.4, slowT:1.4},
  {id:"TOX", base:"TO", name:"Rina Jewelcaster", cls:"Caster", grade:"EX", pop:3, dmg:320.0, rate:1.3, range:179, kind:"slow", hair:"#d8d8e8", eye:"#bfe8ff", style:5, desc:"Chills enemies, slowing their advance. (\u221240% speed)", flavor:"\u201cThe jewels obey my will.\u201d", aoe:62, slow:0.4, slowT:1.4, exTitle:"Jeweled Sword Zelretch"},
  {id:"TSX", base:"TS", name:"Tamaki Summer", cls:"Caster", grade:"EX", pop:3, dmg:480.0, rate:1.3, range:184, kind:"burn", hair:"#ff9ecb", eye:"#35e0ff", style:1, desc:"Explosions ignite enemies, burning them over time.", flavor:"\u201cSummer foxfire burns brightest.\u201d", aoe:68, dot:192.0, dotT:2.5, exTitle:"Summer Tamamo"},
  {id:"VLA", base:"VL", name:"Vlar Impaler", cls:"Lancer", grade:"A", pop:1, dmg:76.0, rate:1.15, range:153, kind:"pierce", hair:"#d43a3a", eye:"#ff6a3d", style:2, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cImpaler of the night, lord of walls.\u201d", pierce:2},
  {id:"VLB", base:"VL", name:"Vlar Impaler", cls:"Lancer", grade:"B", pop:1, dmg:46.0, rate:1.1, range:147, kind:"pierce", hair:"#d43a3a", eye:"#ff6a3d", style:2, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cImpaler of the night, lord of walls.\u201d", pierce:2},
  {id:"VLC", base:"VL", name:"Vlar Impaler", cls:"Lancer", grade:"C", pop:1, dmg:28.0, rate:1.06, range:143, kind:"pierce", hair:"#d43a3a", eye:"#ff6a3d", style:2, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cImpaler of the night, lord of walls.\u201d", pierce:2},
  {id:"VLD", base:"VL", name:"Vlar Impaler", cls:"Lancer", grade:"D", pop:1, dmg:17.0, rate:1.03, range:139, kind:"pierce", hair:"#d43a3a", eye:"#ff6a3d", style:2, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cImpaler of the night, lord of walls.\u201d", pierce:2},
  {id:"VLE", base:"VL", name:"Vlar Impaler", cls:"Lancer", grade:"E", pop:1, dmg:10.0, rate:1.0, range:135, kind:"pierce", hair:"#d43a3a", eye:"#ff6a3d", style:2, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cImpaler of the night, lord of walls.\u201d", pierce:2},
  {id:"VLS", base:"VL", name:"Vlar Impaler", cls:"Lancer", grade:"S", pop:1, dmg:125.0, rate:1.2, range:159, kind:"pierce", hair:"#d43a3a", eye:"#ff6a3d", style:2, desc:"Thrusts pierce through multiple enemies. (pierces 2)", flavor:"\u201cImpaler of the night, lord of walls.\u201d", pierce:2},
  {id:"VOA", base:"VO", name:"Spiritron Construct", cls:"Foreigner", grade:"A", pop:1, dmg:45.6, rate:1.03, range:158, kind:"beam", hair:"#35e0ff", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cA fragment of the imaginary, given form.\u201d", aoe:36},
  {id:"VOC", base:"VO", name:"Spiritron Construct", cls:"Foreigner", grade:"C", pop:1, dmg:16.8, rate:0.95, range:148, kind:"beam", hair:"#35e0ff", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cA fragment of the imaginary, given form.\u201d", aoe:33},
  {id:"VOT", base:"VO", name:"Spiritron Construct", cls:"Foreigner", grade:"STAR", pop:4, dmg:480.0, rate:1.26, range:184, kind:"beam", hair:"#35e0ff", eye:"#35e0ff", style:5, desc:"A focused beam melts single targets.", flavor:"\u201cA fragment of the imaginary, given form.\u201d", aoe:46, exTitle:"Velber 02"},
  {id:"YSA", base:"YS", name:"Shen Lishu", cls:"Assassin", grade:"A", pop:1, dmg:83.6, rate:1.26, range:123, kind:"crit", hair:"#6a3ad4", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 3\u00d7)", flavor:"\u201cYou died three steps ago.\u201d", critC:0.3, critX:3},
  {id:"YSB", base:"YS", name:"Shen Lishu", cls:"Assassin", grade:"B", pop:1, dmg:50.6, rate:1.21, range:117, kind:"crit", hair:"#6a3ad4", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 3\u00d7)", flavor:"\u201cYou died three steps ago.\u201d", critC:0.3, critX:3},
  {id:"YSC", base:"YS", name:"Shen Lishu", cls:"Assassin", grade:"C", pop:1, dmg:30.8, rate:1.17, range:113, kind:"crit", hair:"#6a3ad4", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 3\u00d7)", flavor:"\u201cYou died three steps ago.\u201d", critC:0.3, critX:3},
  {id:"YSD", base:"YS", name:"Shen Lishu", cls:"Assassin", grade:"D", pop:1, dmg:18.7, rate:1.13, range:109, kind:"crit", hair:"#6a3ad4", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 3\u00d7)", flavor:"\u201cYou died three steps ago.\u201d", critC:0.3, critX:3},
  {id:"YSS", base:"YS", name:"Shen Lishu", cls:"Assassin", grade:"S", pop:1, dmg:137.5, rate:1.32, range:129, kind:"crit", hair:"#6a3ad4", eye:"#e14dff", style:2, desc:"High critical strike chance for heavy burst damage. (30% for 3\u00d7)", flavor:"\u201cYou died three steps ago.\u201d", critC:0.3, critX:3},
  {id:"ZMA", base:"ZM", name:"V-0 Nullmodel", cls:"Archer", grade:"A", pop:1, dmg:68.4, rate:1.95, range:168, kind:"single", hair:"#e8e8f0", eye:"#ff3d5e", style:5, desc:"Reliable single-target strikes.", flavor:"\u201cTARGET LOCKED. EMOTION: NULL.\u201d"},
  {id:"ZMB", base:"ZM", name:"V-0 Nullmodel", cls:"Archer", grade:"B", pop:1, dmg:41.4, rate:1.87, range:162, kind:"single", hair:"#e8e8f0", eye:"#ff3d5e", style:5, desc:"Reliable single-target strikes.", flavor:"\u201cTARGET LOCKED. EMOTION: NULL.\u201d"},
  {id:"ZMC", base:"ZM", name:"V-0 Nullmodel", cls:"Archer", grade:"C", pop:1, dmg:25.2, rate:1.8, range:158, kind:"single", hair:"#e8e8f0", eye:"#ff3d5e", style:5, desc:"Reliable single-target strikes.", flavor:"\u201cTARGET LOCKED. EMOTION: NULL.\u201d"},
  {id:"ZMS", base:"ZM", name:"V-0 Nullmodel", cls:"Archer", grade:"S", pop:1, dmg:112.5, rate:2.04, range:174, kind:"single", hair:"#e8e8f0", eye:"#ff3d5e", style:5, desc:"Reliable single-target strikes.", flavor:"\u201cTARGET LOCKED. EMOTION: NULL.\u201d"},
];
const UNIT_BY_ID = Object.fromEntries(UNITS.map(u=>[u.id,u]));

/* base + materials -> result (base transforms in place, materials consumed) */
const RECIPES = [
  {base:"GAS", mats:["BRA", "GMB"], result:"GAX"},
  {base:"GAX", mats:["VOA"], result:"BBT"},
  {base:"FDS", mats:["NCA", "APB"], result:"FDX"},
  {base:"FDX", mats:["VOA"], result:"BBT"},
  {base:"SAS", mats:["VOA", "BBB"], result:"SAX"},
  {base:"SAX", mats:["VOA"], result:"BBT"},
  {base:"MDX", mats:["VOA"], result:"BBT"},
  {base:"JEX", mats:["VOA"], result:"BBT"},
  {base:"MDS", mats:["JAA", "RYB"], result:"MDX"},
  {base:"JES", mats:["ATA", "TAB"], result:"JEX"},
  {base:"VOA", mats:[], result:"VOT"},
  {base:"PDB", mats:[], result:"HXT"},
  {base:"KAS", mats:["STA", "KHB"], result:"TSX"},
  {base:"TSX", mats:["VOA"], result:"BBT"},
  {base:"TOS", mats:["KIA", "SAB"], result:"TOX"},
  {base:"TOX", mats:["VOA"], result:"BBT"},
  {base:"YSS", mats:["PAA", "AQB"], result:"FRX"},
  {base:"FRX", mats:["VOA"], result:"BBT"},
  {base:"RHS", mats:["BRA", "PDC"], result:"MST"},
  {base:"APS", mats:["KAS"], result:"LKT"},
  {base:"AQS", mats:["GMB", "ZMB"], result:"ENT"},
  {base:"MLT", mats:["EMA"], result:"MXT"},
  {base:"SAS", mats:["AEA", "RYA", "VOA"], result:"MLT"},
  {base:"ESS", mats:["RHA", "KAA"], result:"SET"},
  {base:"JEB", mats:["ATS"], result:"AST"},
  {base:"AQA", mats:["JEA", "YSA", "VOC"], result:"AQS"},
  {base:"AAA", mats:["JAA", "ZMA", "VOC"], result:"AAS"},
  {base:"BAA", mats:["ATA", "FDA", "VOC"], result:"BAS"},
  {base:"VLA", mats:["AEA", "ESA", "VOC"], result:"VLS"},
  {base:"KIA", mats:["APA", "BBA", "VOC"], result:"KIS"},
  {base:"TOA", mats:["EMA", "SAA", "VOC"], result:"TOS"},
  {base:"PAA", mats:["LUA", "AQA", "VOC"], result:"PAS"},
  {base:"RYA", mats:["FDA", "MDA", "VOC"], result:"RYS"},
  {base:"YSA", mats:["RYA", "VLA", "VOC"], result:"YSS"},
  {base:"JEA", mats:["PDA", "BRA", "VOC"], result:"JES"},
  {base:"ESA", mats:["GAA", "ATA", "VOC"], result:"ESS"},
  {base:"FDA", mats:["BAA", "TOA", "VOC"], result:"FDS"},
  {base:"MDA", mats:["YSA", "RYA", "VOC"], result:"MDS"},
  {base:"BRA", mats:["NCA", "GOA", "VOC"], result:"BRS"},
  {base:"APA", mats:["SAA", "GMA", "VOC"], result:"APS"},
  {base:"GOA", mats:["AQA", "AAA", "VOC"], result:"GOS"},
  {base:"GAA", mats:["ESA", "PDA", "VOC"], result:"GAS"},
  {base:"PTA", mats:["TAA", "STA", "VOC"], result:"PTS"},
  {base:"STA", mats:["PTA", "TAA", "VOC"], result:"STS"},
  {base:"ANA", mats:["KAA", "JAA", "VOC"], result:"ANS"},
  {base:"RHA", mats:["AEA", "ANA", "VOC"], result:"RHS"},
  {base:"EMA", mats:["MDA", "LUA", "VOC"], result:"EMS"},
  {base:"JAA", mats:["BRA", "JEA", "VOC"], result:"JAS"},
  {base:"ATA", mats:["TOA", "KHA", "VOC"], result:"ATS"},
  {base:"GOB", mats:["YSB", "RYC"], result:"GOA"},
  {base:"ANB", mats:["PAB", "KHC"], result:"ANA"},
  {base:"RHB", mats:["BBB", "SAC"], result:"RHA"},
  {base:"GAC", mats:["TAC"], result:"GOB"},
  {base:"ANC", mats:["AQC"], result:"ANB"},
  {base:"RHC", mats:["ANC"], result:"RHB"},
  {base:"RHD", mats:["GAD", "KIE"], result:"ANC"},
  {base:"RHD", mats:["ATD", "SAE"], result:"RHC"},
  {base:"NCS", mats:["GOA", "YSB"], result:"NCX"},
  {base:"NCA", mats:["BAA", "KAA", "VOC"], result:"NCS"},
  {base:"PDS", mats:["APA", "BAB"], result:"PDX"},
  {base:"PDA", mats:["GMA", "EMA", "VOC"], result:"PDS"},
  {base:"BBB", mats:["SAB", "PAC"], result:"BBA"},
  {base:"AQB", mats:["LUB", "ATC"], result:"AAA"},
  {base:"AQB", mats:["RYB", "MDC"], result:"AQA"},
  {base:"KHB", mats:["BAB", "AQC"], result:"AEA"},
  {base:"BAB", mats:["LUB", "EMC"], result:"BAA"},
  {base:"RYB", mats:["YSB", "RYC"], result:"RYA"},
  {base:"JEB", mats:["TAB", "PDC"], result:"JEA"},
  {base:"ESB", mats:["GMB", "ESC"], result:"ESA"},
  {base:"MDB", mats:["ATB", "YSC"], result:"MDA"},
  {base:"NCB", mats:["JEB", "PDC"], result:"BRA"},
  {base:"APB", mats:["ESB", "NCC"], result:"APA"},
  {base:"PDB", mats:["EMB", "KAC"], result:"PDA"},
  {base:"PTB", mats:["TOB", "TAC"], result:"PTA"},
  {base:"STB", mats:["SAB", "TAC"], result:"STA"},
  {base:"GMB", mats:["VLB", "TOC"], result:"GMA"},
  {base:"ZMB", mats:["JEB", "KHC"], result:"JAA"},
  {base:"ZMB", mats:["KAB", "KIC"], result:"ZMA"},
  {base:"ALS", mats:["ALA", "ALB"], result:"ALX"},
  {base:"ALA", mats:["NCA", "TAA", "VOC"], result:"ALS"},
  {base:"ALB", mats:["VOC"], result:"ALA"},
  {base:"KIC", mats:["LUC"], result:"KIB"},
  {base:"TOC", mats:["SAC"], result:"TOB"},
  {base:"PAC", mats:["RHC"], result:"BBB"},
  {base:"AQC", mats:["ZMC"], result:"AQB"},
  {base:"VLC", mats:["KHC"], result:"BAB"},
  {base:"RYC", mats:["KIC"], result:"RYB"},
  {base:"ESC", mats:["KAC"], result:"JEB"},
  {base:"ESC", mats:["EMC"], result:"ESB"},
  {base:"MDC", mats:["YSC"], result:"MDB"},
  {base:"NCC", mats:["VOC"], result:"ALB"},
  {base:"PDC", mats:["VLC"], result:"APB"},
  {base:"PDC", mats:["NCC"], result:"PDB"},
  {base:"TAC", mats:["TOC"], result:"PTB"},
  {base:"TAC", mats:["RHC"], result:"STB"},
  {base:"ZMC", mats:["ESC"], result:"GMB"},
  {base:"SAD", mats:["ATD", "VLE"], result:"PAC"},
  {base:"LUD", mats:["MDD", "GAE"], result:"AQC"},
  {base:"LUD", mats:["YSD", "VLE"], result:"LUC"},
  {base:"VLD", mats:["ATD", "GAE"], result:"KAC"},
  {base:"VLD", mats:["LUD", "VLE"], result:"KHC"},
  {base:"YSD", mats:["RHD", "KIE"], result:"RYC"},
  {base:"YSD", mats:["GAD", "KIE"], result:"YSC"},
  {base:"MDD", mats:["LUD", "GAE"], result:"ESC"},
  {base:"MDD", mats:["KID", "VLE"], result:"MDC"},
  {base:"GAD", mats:["VLD", "ATE"], result:"NCC"},
  {base:"GAD", mats:["RHD", "ATE"], result:"PDC"},
  {base:"RHD", mats:["SAD", "ATE"], result:"TAC"},
  {base:"ATD", mats:["SAD", "KIE"], result:"EMC"},
  {base:"ATD", mats:["VLD", "SAE"], result:"ZMC"},
  {base:"ATE", mats:["SAE"], result:"RHD"},
  {base:"VLE", mats:["KIE"], result:"LUD"},
  {base:"KIE", mats:[], result:"KID"},
  {base:"GAE", mats:["SAE"], result:"MDD"},
  {base:"VOC", mats:[], result:"VOA"},
  {base:"ATE", mats:["GAE", "VLE", "SAE", "KIE"], result:"VOC"},
  {base:"TOB", mats:["ATB", "KIC"], result:"TOA"},
  {base:"SAD", mats:["KID", "GAE"], result:"TOC"},
  {base:"PDX", mats:["VOA"], result:"BBT"},
  {base:"TAX", mats:["VOA"], result:"BBT"},
  {base:"NCX", mats:["VOA"], result:"BBT"},
  {base:"GMX", mats:["VOA"], result:"BBT"},
  {base:"LUS", mats:["ZMA", "KHA", "VOA"], result:"SKT"},
  {base:"ALX", mats:["VOA"], result:"BBT"},
  {base:"BBX", mats:["VOA"], result:"BBT"},
  {base:"GMS", mats:["JEA", "ESB"], result:"GMX"},
  {base:"FDB", mats:["GAB", "TAC"], result:"FDA"},
  {base:"BBS", mats:["GAA", "ANB"], result:"BBX"},
  {base:"TAS", mats:["LUA", "MDB"], result:"TAX"},
  {base:"TAB", mats:["BBB", "TAC"], result:"TAA"},
  {base:"PAS", mats:["EMA", "PDB"], result:"MLX"},
  {base:"MLX", mats:["VOA"], result:"BBT"},
  {base:"LUB", mats:["AQB", "MDC"], result:"LUA"},
  {base:"LUC", mats:["PAC"], result:"LUB"},
  {base:"MDC", mats:["ATC"], result:"FDB"},
  {base:"KIB", mats:["ZMB", "GAC"], result:"KIA"},
  {base:"YSB", mats:["NCB", "KAC"], result:"YSA"},
  {base:"KHB", mats:["TOB", "ESC"], result:"KHA"},
  {base:"TAC", mats:["MDC"], result:"TAB"},
  {base:"KHC", mats:["EMC"], result:"KHB"},
  {base:"KID", mats:["YSD", "KIE"], result:"KIC"},
  {base:"ZMC", mats:["KHC"], result:"ZMB"},
  {base:"YSC", mats:["GAC"], result:"YSB"},
  {base:"GAE", mats:["KIE"], result:"YSD"},
  {base:"KAB", mats:["APB", "KHC"], result:"KAA"},
  {base:"KAC", mats:["PDC"], result:"KAB"},
  {base:"BBA", mats:["ANA", "KIA", "VOC"], result:"BBS"},
  {base:"PAB", mats:["GMB", "NCC"], result:"PAA"},
  {base:"PAC", mats:["AQC"], result:"PAB"},
  {base:"TAA", mats:["STA", "PTA", "VOC"], result:"TAS"},
  {base:"ZMA", mats:["TAA", "APA", "VOC"], result:"ZMS"},
  {base:"NCB", mats:["MDB", "EMC"], result:"NCA"},
  {base:"NCC", mats:["KHC"], result:"NCB"},
  {base:"GMA", mats:["ZMA", "TOA", "VOC"], result:"GMS"},
  {base:"KHA", mats:["PAA", "NCA", "VOC"], result:"KHS"},
  {base:"EMB", mats:["FDB", "YSC"], result:"EMA"},
  {base:"AEA", mats:["GOA", "JAA", "VOC"], result:"AES"},
  {base:"VLB", mats:["KHB", "ATC"], result:"VLA"},
  {base:"VLC", mats:["MDC"], result:"VLB"},
  {base:"KAA", mats:["KHA", "GAA", "VOC"], result:"KAS"},
  {base:"GAB", mats:["PDB", "ATC"], result:"GAA"},
  {base:"GAC", mats:["RYC"], result:"GAB"},
  {base:"SAA", mats:["AQA", "FDA", "VOC"], result:"SAS"},
  {base:"SAB", mats:["KIB", "TOC"], result:"SAA"},
  {base:"SAC", mats:["KIC"], result:"SAB"},
  {base:"EMC", mats:["TOC"], result:"EMB"},
  {base:"VLD", mats:["GAD", "VLE"], result:"VLC"},
  {base:"VLE", mats:[], result:"VLD"},
  {base:"LUA", mats:["VLA", "BAA", "VOC"], result:"LUS"},
  {base:"ATB", mats:["MDB", "GAC"], result:"ATA"},
  {base:"ATC", mats:["EMC"], result:"ATB"},
  {base:"SAD", mats:["LUD", "ATE"], result:"SAC"},
  {base:"SAE", mats:[], result:"SAD"},
  {base:"GAD", mats:["KID", "GAE"], result:"GAC"},
  {base:"GAE", mats:[], result:"GAD"},
  {base:"ATD", mats:["MDD", "ATE"], result:"ATC"},
  {base:"ATE", mats:[], result:"ATD"},
];

/* cumulative gacha roster per grade (FERD pool sizes) */
const GACHA_POOL = {"E": ["ATE", "GAE", "KIE", "SAE", "VLE"], "D": ["ATD", "GAD", "KID", "LUD", "MDD", "RHD", "SAD", "VLD", "YSD"], "C": ["ANC", "AQC", "ATC", "EMC", "ESC", "GAC", "KAC", "KHC", "KIC", "LUC", "MDC", "NCC", "PAC", "PDC", "RHC", "RYC", "SAC", "TAC", "TOC", "VLC", "YSC", "ZMC"], "B": ["ALB", "ANB", "APB", "AQB", "ATB", "BAB", "BBB", "EMB", "ESB", "FDB", "GAB", "GMB", "GOB", "JEB", "KAB", "KHB", "KIB", "LUB", "MDB", "NCB", "PAB", "PDB", "PTB", "RHB", "RYB", "SAB", "STB", "TAB", "TOB", "VLB", "YSB", "ZMB"], "A": ["AAA", "AEA", "ALA", "ANA", "APA", "AQA", "ATA", "BAA", "BBA", "BRA", "EMA", "ESA", "FDA", "GAA", "GMA", "GOA", "JAA", "JEA", "KAA", "KHA", "KIA", "LUA", "MDA", "NCA", "PAA", "PDA", "PTA", "RHA", "RYA", "SAA", "STA", "TAA", "TOA", "VLA", "YSA", "ZMA"], "S": ["AAS", "AES", "ALS", "ANS", "APS", "AQS", "ATS", "BAS", "BBS", "BRS", "EMS", "ESS", "FDS", "GAS", "GMS", "GOS", "JAS", "JES", "KAS", "KHS", "KIS", "LUS", "MDS", "NCS", "PAS", "PDS", "PTS", "RHS", "RYS", "SAS", "STS", "TAS", "TOS", "VLS", "YSS", "ZMS"]};

const DIFFICULTIES = {
  practice:{name:"Practice", nameTh:"ฝึกซ้อม", blurb:"The training simulation. Gentle waves, generous lives.", blurbTh:"การจำลองฝึกซ้อม เวฟเบาบาง ชีวิตเหลือเฟือ", waves:60, timeout:60, lives:80, speed:1.0, hp:1.0, gold:1.0, color:"#3dff9a"},
  seraph:{name:"SE.RA.PH", nameTh:"SE.RA.PH", blurb:"The standard grail war. The true starting line.", blurbTh:"สงครามจอกมาตรฐาน จุดเริ่มต้นที่แท้จริง", waves:80, timeout:50, lives:80, speed:1.05, hp:1.25, gold:1.0, color:"#4aa8ff"},
  labyrinth:{name:"Sakura Labyrinth", nameTh:"เขาวงกตซากุระ", blurb:"A twisting maze of tougher foes.", blurbTh:"เขาวงกตคดเคี้ยวของศัตรูที่แกร่งกว่า", waves:90, timeout:40, lives:70, speed:1.2, hp:1.5, gold:1.0, color:"#ffd23d"},
  abyss:{name:"Photonic Abyss", nameTh:"อเวจีโฟโตนิก", blurb:"Brutal light. The cell shows no mercy.", blurbTh:"แสงอันโหดร้าย เซลล์ไม่ปรานีใคร", waves:100, timeout:40, lives:60, speed:1.35, hp:2.0, gold:1.0, color:"#ff9440"},
  elite1:{name:"Imaginary Number Space I", nameTh:"ห้วงจำนวนจินตภาพ I", blurb:"Elite proof I \u2014 the imaginary deepens.", blurbTh:"บทพิสูจน์ชั้นยอด I — ห้วงจินตภาพลึกลง", waves:100, timeout:40, lives:50, speed:1.35, hp:2.25, gold:1.0, color:"#e14dff"},
  elite2:{name:"Imaginary Number Space II", nameTh:"ห้วงจำนวนจินตภาพ II", blurb:"Elite proof II \u2014 reality thins.", blurbTh:"บทพิสูจน์ชั้นยอด II — ความจริงบางเบา", waves:100, timeout:40, lives:50, speed:1.35, hp:2.5, gold:1.0, color:"#e14dff"},
  elite3:{name:"Imaginary Number Space III", nameTh:"ห้วงจำนวนจินตภาพ III", blurb:"Elite proof III \u2014 the void presses in.", blurbTh:"บทพิสูจน์ชั้นยอด III — ความว่างเปล่าบีบคั้น", waves:100, timeout:40, lives:50, speed:1.35, hp:2.75, gold:1.0, color:"#c86aff"},
  elite4:{name:"Imaginary Number Space IV", nameTh:"ห้วงจำนวนจินตภาพ IV", blurb:"Elite proof IV \u2014 faster, harder, merciless.", blurbTh:"บทพิสูจน์ชั้นยอด IV — เร็วขึ้น แข็งขึ้น ไร้ความปรานี", waves:100, timeout:40, lives:50, speed:1.5, hp:3.0, gold:1.0, color:"#c86aff"},
  hell1:{name:"Hell Proof I", nameTh:"พิสูจน์นรก I", blurb:"The first hell. Few return.", blurbTh:"นรกขุมแรก แทบไม่มีใครรอดกลับ", waves:100, timeout:40, lives:40, speed:1.5, hp:3.25, gold:1.0, color:"#ff3d5e"},
  hell2:{name:"Hell Proof II", nameTh:"พิสูจน์นรก II", blurb:"The second hell. The moon cell bleeds.", blurbTh:"นรกขุมที่สอง มูนเซลล์หลั่งเลือด", waves:100, timeout:40, lives:40, speed:1.5, hp:3.5, gold:1.0, color:"#ff3d5e"},
  hell3:{name:"Hell Proof III", nameTh:"พิสูจน์นรก III", blurb:"The third hell. Despair has a name.", blurbTh:"นรกขุมที่สาม ความสิ้นหวังมีชื่อเรียก", waves:100, timeout:40, lives:40, speed:1.5, hp:3.75, gold:1.0, color:"#ff3d5e"},
  hell4:{name:"Hell Proof IV", nameTh:"พิสูจน์นรก IV", blurb:"The final hell. Only legends survive.", blurbTh:"นรกขุมสุดท้าย เฉพาะตำนานเท่านั้นที่รอด", waves:100, timeout:40, lives:40, speed:1.65, hp:4.0, gold:1.0, color:"#ff2d4e"},
};

const CFG = {
  W:960, H:640,
  startGold:300, startSpirit:0, startWisps:4,
  popCap:18, benchSize:10, pityEvery:15,
  gachaMaxLv:6, gachaUpCost:lv=>8+lv*6,
  wispsPerWave:2,
  ring:{ l:200, t:130, r:760, b:510, w:34 },
};
/* gacha level 1..6 -> grade */
const GACHA_GRADE = ['E','D','C','B','A','S'];

/* ---- Factions (FERD faction system, original identities) ---- */
const FACTION_MAX_LEVEL = 15;
const FACTION_XP_REQ = [20000,40000,45000,50000,55000,60000,67500,75000,82500,90000,100000,110000,120000,130000];
const PICKUP_REQ = { E:1, D:2, C:5, B:10 };
const FUSION_COUNT = 3;
const FACTIONS = [
  { key:'aurel', tag:'A', name:'Aurel Court', color:'#d0d040', icon:'◈', master:'Golden Sovereign',
    traits:[
      {en:'Servant gambling success rate very high.',th:'อัตราสำเร็จพนันผู้รับใช้สูงมาก'},
      {en:'All servants movement speed increased.',th:'ผู้รับใช้ทุกตัวเคลื่อนที่เร็วขึ้น'},
      {en:'Kill enemies for additional resources.',th:'ฆ่าศัตรูเพื่อทรัพยากรเพิ่มเติม'}],
    passive:'Kill tribute — 50% chance on kill to loot +1–15 gold.',
    passiveTh:'ส่วยสังหาร — ฆ่าศัตรูมีโอกาส 50% ได้ทอง +1–15',
    activeName:'Imperial Privilege', activeType:'supergold', cost:5000, cd:300,
    activeDesc:'Spend ◈5000 for ◈0–25,000. Recharges in 300s.',
    activeDescTh:'จ่าย ◈5000 ลุ้น ◈0–25,000 ฟื้นใน 300 วิ' },
  { key:'kitsune', tag:'B', name:'Kitsune Covenant', color:'#d0d0d0', icon:'✧', master:'Ninefox Matriarch',
    traits:[
      {en:'Enhanced MP skills.',th:'สกิล MP แรงขึ้น'},
      {en:'Summon a servant of your choice.',th:'อัญเชิญผู้รับใช้ที่เลือกเอง'},
      {en:'Reduced teleport time.',th:'เวลาวาร์ปลดลง'}],
    passive:'Shrine meditation — +1 extra spirit every wave.',
    passiveTh:'สมาธิศาลเจ้า — ได้สปิริตเพิ่ม +1 ทุกเวฟ',
    activeName:'Servant Pickup', activeType:'pickup', cost:0,
    activeDesc:'Spend ❋wisps (E1/D2/C5/B10) to choose an exact servant.',
    activeDescTh:'ใช้ ❋วิสป์ (E1/D2/C5/B10) เลือกผู้รับใช้ที่ตรงใจ' },
  { key:'steppe', tag:'C', name:'Steppe Horde', color:'#8080d0', icon:'❋', master:'Storm Khan',
    traits:[
      {en:'Kill enemies for additional draw opportunities.',th:'ฆ่าศัตรูเพื่อโอกาสจับเพิ่ม'},
      {en:'All damage upgrades start at Lvl 1.5.',th:'อัปเกรดดาเมจทั้งหมดเริ่มที่ Lvl 1.5'},
      {en:'Blessing increases servant power.',th:'พรเพิ่มพลังผู้รับใช้'}],
    passive:'Spirit plunder — 1% chance on kill to capture +1 wisp.',
    passiveTh:'ปล้นสปิริต — ฆ่าศัตรูมีโอกาส 1% ยึดวิสป์ +1',
    activeName:'Crest of the Wandering Star', activeType:'crest', cd:30,
    activeDesc:'Bless the selected servant: +50% damage and shot speed.',
    activeDescTh:'ประทานพรผู้รับใช้ที่เลือก: ดาเมจ+50% และกระสุนเร็วขึ้น' },
  { key:'echo', tag:'D', name:'Echo Syndicate', color:'#d08000', icon:'⧉', master:'Mirror Prime', reqMaster:true,
    traits:[
      {en:'Start with increased spirits.',th:'เริ่มด้วยสปิริตมากขึ้น'},
      {en:'Upgradeable Condensing Ray.',th:'Condensing Ray อัปเกรดได้'},
      {en:'Very low chance to double merging output.',th:'โอกาสต่ำมากที่ผลรวมจะคูณสอง'}],
    passive:'Doubled output — 5% chance on ascension to copy the result.',
    passiveTh:'ผลคูณสอง — เลื่อนขั้นมีโอกาส 5% ได้สำเนาผลลัพธ์',
    activeName:'Condensing Ray', activeType:'cd', cd:25,
    activeDesc:'Focus a ray on one mark; damage ramps up to 400% while held.',
    activeDescTh:'โฟกัสลำแสงใส่เป้าเดียว ดาเมจไล่ขึ้นถึง 400% ขณะล็อก' },
  { key:'mooncell', tag:'E', name:'Mooncell Bloc', color:'#d040d0', icon:'⬢', master:'Cell Automaton', reqMaster:true,
    traits:[
      {en:'Gain growth-type Servant BB.',th:'ได้ผู้รับใช้โตแบบ BB'},
      {en:'Upgrade by combining 3 same-grade units.',th:'เลื่อนขั้นโดยรวมยูนิตเกรดเดียวกัน 3 ตัว'},
      {en:'Collect 5 specified units to unlock ultimate unit.',th:'สะสมยูนิตที่กำหนด 5 ตัวเพื่อปลดล็อกยูนิตสุดยอด'}],
    passive:'BB bounty — kills grant +50% faction XP.',
    passiveTh:'ค่าหัว BB — ฆ่าศัตรูได้ XP แฟคชั่น +50%',
    activeName:'Horadric Fusion', activeType:'fusion', cost:0,
    activeDesc:'Fuse 3 equal-grade servants into one random next-grade servant.',
    activeDescTh:'รวมผู้รับใช้เกรดเดียวกัน 3 ตัว เป็นผู้รับใช้เกรดถัดไปแบบสุ่ม 1 ตัว' },
];
const FACTION_BY_KEY = Object.fromEntries(FACTIONS.map(f=>[f.key,f]));

/* exact FERD gambling costs, payouts, success chances, charges and cooldowns */
const GOLD_GAMBLES = [
  { key:'g10', label:'10 Gold Gacha', labelTh:'กาชาทอง 10', cost:10, payout:100, charges:10, cd:10, type:'gold' },
  { key:'g100', label:'100 Gold Gacha', labelTh:'กาชาทอง 100', cost:100, payout:500, charges:5, cd:30, type:'gold' },
  { key:'g500', label:'500 Gold Gacha', labelTh:'กาชาทอง 500', cost:500, payout:1500, charges:2, cd:60, type:'gold' },
  { key:'spirit', label:'Spirit Gamble', labelTh:'พนันสปิริต', cost:500, payout:3, charges:10, cd:10, type:'spirit' },
];
const SERVANT_GAMBLES = [
  { key:'ED', label:'E–D', grades:['E','D'], cost:500, spirit:0, chance:50, special:70 },
  { key:'C', label:'C', grades:['C'], cost:1000, spirit:1, chance:45, special:65 },
  { key:'B', label:'B', grades:['B'], cost:2500, spirit:5, chance:40, special:60 },
  { key:'A', label:'A', grades:['A'], cost:5000, spirit:10, chance:35, special:55 },
  { key:'S', label:'S', grades:['S'], cost:20000, spirit:20, chance:30, special:50 },
];

/* waypoints: enter left gate, 1.5 clockwise laps, exit right gate */
const PATH = [
  [-30,320],[200,320],[200,130],[760,130],[760,510],[200,510],[200,320],
  [200,130],[760,130],[760,320],[990,320],
];
const PATH_SEG = []; let PATH_LEN = 0;
for (let i=0;i<PATH.length-1;i++){
  const [x1,y1]=PATH[i],[x2,y2]=PATH[i+1];
  const len=Math.hypot(x2-x1,y2-y1);
  PATH_SEG.push({x1,y1,x2,y2,len,start:PATH_LEN}); PATH_LEN+=len;
}
function pathPos(d){
  d=Math.max(0,Math.min(PATH_LEN,d));
  for (const s of PATH_SEG){ if (d<=s.start+s.len){ const t=(d-s.start)/s.len;
    return {x:s.x1+(s.x2-s.x1)*t, y:s.y1+(s.y2-s.y1)*t}; } }
  const s=PATH_SEG[PATH_SEG.length-1]; return {x:s.x2,y:s.y2};
}

const SLOTS = [
  {x:258,y:188},{x:702,y:188},{x:702,y:452},{x:258,y:452},
  {x:480,y:320},
  {x:120,y:60},{x:840,y:60},{x:840,y:580},{x:120,y:580},
  {x:95,y:225},{x:95,y:415},{x:865,y:225},{x:865,y:415},
];

const PLACEMENT = { minX:24, maxX:936, minY:24, maxY:616, roadPadding:22, unitGap:30 };
function placementReason(x, y, field=[], ignoreUid=null){
  if (!Number.isFinite(x) || !Number.isFinite(y) || x<PLACEMENT.minX || x>PLACEMENT.maxX || y<PLACEMENT.minY || y>PLACEMENT.maxY) return 'bounds';
  const clearance = CFG.ring.w/2 + PLACEMENT.roadPadding;
  if (Math.abs(y-CFG.H/2)<=clearance && (x<CFG.ring.l || x>CFG.ring.r)) return 'gate';
  for (const s of PATH_SEG){
    const dx=s.x2-s.x1, dy=s.y2-s.y1;
    const t=Math.max(0,Math.min(1,((x-s.x1)*dx+(y-s.y1)*dy)/(s.len*s.len)));
    if (Math.hypot(x-(s.x1+dx*t), y-(s.y1+dy*t))<=clearance) return 'road';
  }
  for (const u of field){
    if (!u || u.uid===ignoreUid) continue;
    if (Math.hypot(x-u.x,y-u.y)<PLACEMENT.unitGap) return 'too-close';
  }
  return '';
}

/* ============ procedural anime portraits ============ */
function shade(hex,f){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.max(0,Math.min(255,Math.round(r*f)));
  g=Math.max(0,Math.min(255,Math.round(g*f)));
  b=Math.max(0,Math.min(255,Math.round(b*f)));
  return `rgb(${r},${g},${b})`;
}
const BANGS = [
  'M27,44 Q30,26 48,25 Q66,26 69,44 L63,38 L58,46 L52,37 L46,46 L40,37 L34,46 Z',
  'M27,46 Q26,24 48,23 Q70,24 69,46 L64,34 Q60,44 54,33 Q50,44 44,33 Q38,44 33,35 Z',
  'M26,48 Q28,22 50,23 Q70,25 70,48 L62,36 L60,48 L52,34 L48,47 L40,35 L36,48 Z',
  'M27,44 Q32,24 48,24 Q64,24 69,44 Q60,32 48,33 Q36,32 27,44 Z',
  'M26,46 Q28,22 48,22 Q68,22 70,46 L66,52 L60,34 L56,50 L48,32 L42,50 L36,34 L30,52 Z',
  'M27,42 Q34,22 48,24 Q66,22 69,42 L62,32 L58,42 L50,30 L44,42 L36,32 Z',
];
function accessory(cls,hair){
  const dk=shade(hair,0.7);
  switch(cls){
    case 'Saber': return `<path d="M48,22 Q46,8 56,6 Q50,12 52,20" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>`;
    case 'Archer': return `<path d="M70,34 Q84,40 80,62 Q74,52 68,46 Z" fill="${dk}"/><circle cx="70" cy="38" r="4" fill="#ff3d8e"/>`;
    case 'Lancer': return `<path d="M26,38 Q18,58 24,78 L30,72 Q26,54 30,42 Z" fill="${dk}"/><rect x="58" y="28" width="12" height="4" rx="2" fill="#ffd23d" transform="rotate(18 64 30)"/>`;
    case 'Rider': return `<path d="M28,32 Q48,22 68,32 L68,38 Q48,29 28,38 Z" fill="#2b2d44"/><circle cx="40" cy="33" r="5" fill="#35e0ff" opacity="0.9"/><circle cx="56" cy="33" r="5" fill="#35e0ff" opacity="0.9"/>`;
    case 'Caster': return `<path d="M30,28 L48,2 L62,26 Z" fill="${dk}"/><ellipse cx="47" cy="27" rx="24" ry="6" fill="${shade(hair,0.55)}"/><rect x="38" y="18" width="16" height="5" fill="#ffd23d" transform="rotate(-4 46 20)"/>`;
    case 'Assassin': return `<path d="M28,58 Q48,70 68,58 L68,66 Q48,76 28,66 Z" fill="#1a1633" opacity="0.85"/><path d="M26,40 Q22,18 48,14 Q74,18 70,40 L66,34 Q64,20 48,19 Q32,20 30,34 Z" fill="${dk}"/>`;
    case 'Berserker': return `<path d="M30,26 L22,8 L36,20 Z" fill="#f2ead8"/><path d="M66,26 L74,8 L60,20 Z" fill="#f2ead8"/>`;
    case 'Shielder': return `<rect x="27" y="33" width="42" height="7" rx="3" fill="#2b2d44"/><circle cx="48" cy="36" r="4" fill="#4aa8ff"/>`;
    case 'Alter Ego': return `<path d="M60,24 L74,14 L72,28 Z" fill="#ff3d8e"/><path d="M60,24 L76,30 L68,36 Z" fill="#ff3d8e"/><circle cx="61" cy="25" r="4" fill="#ffd23d"/>`;
    case 'Ruler': return `<path d="M36,22 L40,10 L46,20 L50,6 L54,20 L60,10 L64,22 Z" fill="#ffd23d"/><circle cx="50" cy="14" r="2.4" fill="#ff3d5e"/>`;
    case 'Foreigner': return `<ellipse cx="48" cy="12" rx="20" ry="5" fill="none" stroke="#35e0ff" stroke-width="2" opacity="0.9"/><path d="M70,8 l2,4 4,1 -4,1 -2,4 -2,-4 -4,-1 4,-1 Z" fill="#ffd23d"/>`;
    default: return '';
  }
}
const PORTRAIT_CACHE = {};
function portraitSVG(u){
  if (PORTRAIT_CACHE[u.id]) return PORTRAIT_CACHE[u.id];
  const g=GRADES[u.grade], hair=u.hair, dk=shade(hair,0.72), lt=shade(hair,1.25);
  const eye=u.eye||g.color, skin='#ffe3d0';
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<defs><radialGradient id="bg" cx="50%" cy="38%" r="75%">
<stop offset="0%" stop-color="${g.color}" stop-opacity="0.34"/><stop offset="100%" stop-color="#120e26"/>
</radialGradient></defs>
<rect width="96" height="96" fill="url(#bg)"/>
<path d="M22,42 Q14,76 26,90 L70,90 Q82,76 74,42 Q74,12 48,11 Q22,12 22,42 Z" fill="${dk}"/>
<path d="M18,96 Q24,72 48,72 Q72,72 78,96 Z" fill="${shade(g.color,0.5)}"/>
<path d="M40,74 L48,84 L56,74 L52,72 L48,76 L44,72 Z" fill="#f2ead8"/>
<ellipse cx="48" cy="52" rx="19" ry="21" fill="${skin}"/>
<ellipse cx="37" cy="61" rx="4" ry="2.2" fill="#ff9ecb" opacity="0.4"/>
<ellipse cx="59" cy="61" rx="4" ry="2.2" fill="#ff9ecb" opacity="0.4"/>
<ellipse cx="40" cy="55" rx="5.4" ry="6.4" fill="#fff"/>
<ellipse cx="56" cy="55" rx="5.4" ry="6.4" fill="#fff"/>
<circle cx="40" cy="56" r="3.7" fill="${eye}"/><circle cx="56" cy="56" r="3.7" fill="${eye}"/>
<circle cx="40" cy="56" r="1.8" fill="#14102a"/><circle cx="56" cy="56" r="1.8" fill="#14102a"/>
<circle cx="38.6" cy="54" r="1.3" fill="#fff"/><circle cx="54.6" cy="54" r="1.3" fill="#fff"/>
<path d="M34,47 Q40,44 45,47" stroke="#14102a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M51,47 Q56,44 62,47" stroke="#14102a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M45,66 Q48,68.5 51,66" stroke="#c86a5a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="${BANGS[u.style%6]}" fill="${hair}"/>
<path d="M27,40 Q24,58 28,70 L33,64 Q30,52 32,42 Z" fill="${hair}"/>
<path d="M69,40 Q72,58 68,70 L63,64 Q66,52 64,42 Z" fill="${hair}"/>
<path d="M34,28 Q42,24 50,26" stroke="${lt}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.8"/>
${accessory(u.cls,hair)}
</svg>`;
  const url='data:image/svg+xml;utf8,'+encodeURIComponent(svg);
  PORTRAIT_CACHE[u.id]=url;
  return url;
}
const PORTRAIT_IMG = {};
function portraitImg(u){
  if (!PORTRAIT_IMG[u.id]){
    const im=new Image();
    im.src=portraitSVG(u);
    PORTRAIT_IMG[u.id]=im;
  }
  return PORTRAIT_IMG[u.id];
}