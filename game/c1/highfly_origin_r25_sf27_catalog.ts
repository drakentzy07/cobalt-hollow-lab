/** HIGHFLY Skill Factory SF3 — fixed contract, source: skill wiki V2.0.
 * Each donor is a REAL ID from pinned ClaudeCraft v0.44.0, not a guessed new asset.
 * UNICAS remain 3 locked future slots. Training stats are NOT modified here.
 * Stage SF3 keeps these data/abilities behind an explicit LAB flag.
 */
export type HighflyClass = 'warrior' | 'paladin' | 'hunter' | 'rogue' | 'priest' | 'shaman' | 'mage' | 'warlock' | 'druid';
export const HIGHFLY_SKILL_LEVELS=[1,5,10,15,20,25,30] as const;
export interface HighflyFusionSpec {
 readonly id:string;readonly classId:HighflyClass;readonly slot:number;
 readonly unlockLevel:number;readonly name:string;readonly donors:readonly string[];
 readonly ultimate:boolean;
}
export const HIGHFLY_FUSED_SKILLS:Record<HighflyClass,readonly HighflyFusionSpec[]> = {
  "warrior": [
    {
      "id": "hf_warrior_s1",
      "classId": "warrior",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Corte de Vanguardia",
      "donors": [
        "heroic_strike",
        "sunder_armor"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warrior_s2",
      "classId": "warrior",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Impacto de Falla",
      "donors": [
        "slam",
        "overpower"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warrior_s3",
      "classId": "warrior",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Avance del León",
      "donors": [
        "charge",
        "hamstring"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warrior_s4",
      "classId": "warrior",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Guardia de Acero",
      "donors": [
        "raised_guard",
        "revenge"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warrior_s5",
      "classId": "warrior",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Torbellino Carmesí",
      "donors": [
        "whirlwind",
        "red_harvest"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warrior_u1",
      "classId": "warrior",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Grito del Capitán",
      "donors": [
        "battle_shout",
        "rallying_cry"
      ],
      "ultimate": true
    },
    {
      "id": "hf_warrior_u2",
      "classId": "warrior",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Ruptura de Fallaline",
      "donors": [
        "heroic_leap",
        "faultline",
        "execute"
      ],
      "ultimate": true
    }
  ],
  "paladin": [
    {
      "id": "hf_paladin_s1",
      "classId": "paladin",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Tajo del Cruzado",
      "donors": [
        "crusader_strike",
        "seal_of_righteousness"
      ],
      "ultimate": false
    },
    {
      "id": "hf_paladin_s2",
      "classId": "paladin",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Disco Solar",
      "donors": [
        "sunward_disc",
        "hammer_of_wrath"
      ],
      "ultimate": false
    },
    {
      "id": "hf_paladin_s3",
      "classId": "paladin",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Muro de Devoción",
      "donors": [
        "holy_shield",
        "devotion_ward"
      ],
      "ultimate": false
    },
    {
      "id": "hf_paladin_s4",
      "classId": "paladin",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Choque Consagrado",
      "donors": [
        "holy_shock",
        "flash_of_light"
      ],
      "ultimate": false
    },
    {
      "id": "hf_paladin_s5",
      "classId": "paladin",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Paso del Alba",
      "donors": [
        "solar_step",
        "hammer_of_justice"
      ],
      "ultimate": false
    },
    {
      "id": "hf_paladin_u1",
      "classId": "paladin",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Veredicto del Sol",
      "donors": [
        "final_edict",
        "sun_gods_verdict"
      ],
      "ultimate": true
    },
    {
      "id": "hf_paladin_u2",
      "classId": "paladin",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Ascensión Divina",
      "donors": [
        "divine_ascension",
        "avenging_wrath"
      ],
      "ultimate": true
    }
  ],
  "hunter": [
    {
      "id": "hf_hunter_s1",
      "classId": "hunter",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Disparo de Apertura",
      "donors": [
        "measured_shot",
        "arcane_shot"
      ],
      "ultimate": false
    },
    {
      "id": "hf_hunter_s2",
      "classId": "hunter",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Picadura de Caza",
      "donors": [
        "serpent_sting",
        "aimed_shot"
      ],
      "ultimate": false
    },
    {
      "id": "hf_hunter_s3",
      "classId": "hunter",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Trampa Escarchada",
      "donors": [
        "frostjaw_trap",
        "concussive_shot"
      ],
      "ultimate": false
    },
    {
      "id": "hf_hunter_s4",
      "classId": "hunter",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Lluvia de Astillas",
      "donors": [
        "shrapnel_charge",
        "volley"
      ],
      "ultimate": false
    },
    {
      "id": "hf_hunter_s5",
      "classId": "hunter",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Colmillo de Raptor",
      "donors": [
        "raptor_strike",
        "trailbreak"
      ],
      "ultimate": false
    },
    {
      "id": "hf_hunter_u1",
      "classId": "hunter",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Fuego Rápido del Alfa",
      "donors": [
        "rapid_fire",
        "bloodtrail_assault"
      ],
      "ultimate": true
    },
    {
      "id": "hf_hunter_u2",
      "classId": "hunter",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Comando de Estampida",
      "donors": [
        "stampede",
        "pack_command"
      ],
      "ultimate": true
    }
  ],
  "rogue": [
    {
      "id": "hf_rogue_s1",
      "classId": "rogue",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Estocada Cobarde",
      "donors": [
        "backstab",
        "ambush"
      ],
      "ultimate": false
    },
    {
      "id": "hf_rogue_s2",
      "classId": "rogue",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Corte Siniestro",
      "donors": [
        "sinister_strike",
        "eviscerate"
      ],
      "ultimate": false
    },
    {
      "id": "hf_rogue_s3",
      "classId": "rogue",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Ruptura Venenosa",
      "donors": [
        "rupture",
        "deadly_poison",
        "instant_poison"
      ],
      "ultimate": false
    },
    {
      "id": "hf_rogue_s4",
      "classId": "rogue",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Danza de Sombras",
      "donors": [
        "sprint",
        "evasion"
      ],
      "ultimate": false
    },
    {
      "id": "hf_rogue_s5",
      "classId": "rogue",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Silencio del Verdugo",
      "donors": [
        "gouge",
        "kick",
        "kidney_shot"
      ],
      "ultimate": false
    },
    {
      "id": "hf_rogue_u1",
      "classId": "rogue",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Frenesí Carmesí",
      "donors": [
        "adrenaline_rush",
        "expose_armor"
      ],
      "ultimate": true
    },
    {
      "id": "hf_rogue_u2",
      "classId": "rogue",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Eclipse del Acecho",
      "donors": [
        "stealth",
        "blind",
        "ambush"
      ],
      "ultimate": true
    }
  ],
  "priest": [
    {
      "id": "hf_priest_s1",
      "classId": "priest",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Castigo de Misericordia",
      "donors": [
        "smite",
        "scouring_mercy"
      ],
      "ultimate": false
    },
    {
      "id": "hf_priest_s2",
      "classId": "priest",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Azote Mental",
      "donors": [
        "mind_blast",
        "shadow_word_pain"
      ],
      "ultimate": false
    },
    {
      "id": "hf_priest_s3",
      "classId": "priest",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Escudo Renovador",
      "donors": [
        "power_word_shield",
        "renew"
      ],
      "ultimate": false
    },
    {
      "id": "hf_priest_s4",
      "classId": "priest",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Sanación Relámpago",
      "donors": [
        "lesser_heal",
        "flash_heal"
      ],
      "ultimate": false
    },
    {
      "id": "hf_priest_s5",
      "classId": "priest",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Nova Vigilante",
      "donors": [
        "holy_nova",
        "seraphic_vigil"
      ],
      "ultimate": false
    },
    {
      "id": "hf_priest_u1",
      "classId": "priest",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Plegaria de Retorno",
      "donors": [
        "prayer_of_healing",
        "prayer_of_returning"
      ],
      "ultimate": true
    },
    {
      "id": "hf_priest_u2",
      "classId": "priest",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Tithefiend del Juicio",
      "donors": [
        "summon_tithefiend",
        "psychic_scream"
      ],
      "ultimate": true
    }
  ],
  "shaman": [
    {
      "id": "hf_shaman_s1",
      "classId": "shaman",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Latigazo de Relámpago",
      "donors": [
        "lightning_bolt",
        "chain_lightning"
      ],
      "ultimate": false
    },
    {
      "id": "hf_shaman_s2",
      "classId": "shaman",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Choque de Lava",
      "donors": [
        "flame_shock",
        "lava_burst"
      ],
      "ultimate": false
    },
    {
      "id": "hf_shaman_s3",
      "classId": "shaman",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Oleada del Tótem Vivo",
      "donors": [
        "healing_wave",
        "tidecall"
      ],
      "ultimate": false
    },
    {
      "id": "hf_shaman_s4",
      "classId": "shaman",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Desatar Arma",
      "donors": [
        "unleash_weapon",
        "flametongue_weapon"
      ],
      "ultimate": false
    },
    {
      "id": "hf_shaman_s5",
      "classId": "shaman",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Lobo de Vendaval",
      "donors": [
        "ghost_wolf",
        "frost_shock"
      ],
      "ultimate": false
    },
    {
      "id": "hf_shaman_u1",
      "classId": "shaman",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Terremoto de Tempestad",
      "donors": [
        "earthquake",
        "thunderstorm"
      ],
      "ultimate": true
    },
    {
      "id": "hf_shaman_u2",
      "classId": "shaman",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Furia del Tótem Mayor",
      "donors": [
        "bloodlust",
        "elemental_trance"
      ],
      "ultimate": true
    }
  ],
  "mage": [
    {
      "id": "hf_mage_s1",
      "classId": "mage",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Rayo de Escarcha Ígnea",
      "donors": [
        "frostbolt",
        "fireball"
      ],
      "ultimate": false
    },
    {
      "id": "hf_mage_s2",
      "classId": "mage",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Lanza Arcana",
      "donors": [
        "ice_lance",
        "arcane_missiles"
      ],
      "ultimate": false
    },
    {
      "id": "hf_mage_s3",
      "classId": "mage",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Parpadeo de Nova",
      "donors": [
        "blink",
        "frost_nova"
      ],
      "ultimate": false
    },
    {
      "id": "hf_mage_s4",
      "classId": "mage",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Barrera de Fase",
      "donors": [
        "ice_barrier",
        "temporal_barrier"
      ],
      "ultimate": false
    },
    {
      "id": "hf_mage_s5",
      "classId": "mage",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Impulso del Mago",
      "donors": [
        "arcane_surge",
        "scorch",
        "flurry"
      ],
      "ultimate": false
    },
    {
      "id": "hf_mage_u1",
      "classId": "mage",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Órbita Meteórica",
      "donors": [
        "meteor",
        "frozen_orb"
      ],
      "ultimate": true
    },
    {
      "id": "hf_mage_u2",
      "classId": "mage",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Reloj del Umbral",
      "donors": [
        "temporal_hourglass",
        "combustion"
      ],
      "ultimate": true
    }
  ],
  "warlock": [
    {
      "id": "hf_warlock_s1",
      "classId": "warlock",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Lanza de Ruina",
      "donors": [
        "shadow_bolt",
        "soul_lance"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warlock_s2",
      "classId": "warlock",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Corrupción Agónica",
      "donors": [
        "corruption",
        "curse_of_agony"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warlock_s3",
      "classId": "warlock",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Pacto de Vida",
      "donors": [
        "life_tap",
        "drain_life",
        "cruel_pact"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warlock_s4",
      "classId": "warlock",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Ojo Maldito",
      "donors": [
        "evil_eye",
        "fear"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warlock_s5",
      "classId": "warlock",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Mandato Demoníaco",
      "donors": [
        "summon_imp",
        "summon_voidwalker"
      ],
      "ultimate": false
    },
    {
      "id": "hf_warlock_u1",
      "classId": "warlock",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Lluvia Infernal",
      "donors": [
        "rain_of_fire",
        "chaos_bolt"
      ],
      "ultimate": true
    },
    {
      "id": "hf_warlock_u2",
      "classId": "warlock",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Legión Profana",
      "donors": [
        "army_of_the_dead",
        "raise_graveguard"
      ],
      "ultimate": true
    }
  ],
  "druid": [
    {
      "id": "hf_druid_s1",
      "classId": "druid",
      "slot": 1,
      "unlockLevel": 1,
      "name": "Garra Lunar",
      "donors": [
        "claw",
        "moonfire"
      ],
      "ultimate": false
    },
    {
      "id": "hf_druid_s2",
      "classId": "druid",
      "slot": 2,
      "unlockLevel": 5,
      "name": "Espinas del Enjambre",
      "donors": [
        "rake",
        "insect_swarm",
        "thorns"
      ],
      "ultimate": false
    },
    {
      "id": "hf_druid_s3",
      "classId": "druid",
      "slot": 3,
      "unlockLevel": 10,
      "name": "Toque Renovador",
      "donors": [
        "rejuvenation",
        "regrowth",
        "healing_touch"
      ],
      "ultimate": false
    },
    {
      "id": "hf_druid_s4",
      "classId": "druid",
      "slot": 4,
      "unlockLevel": 15,
      "name": "Carga de Ursa",
      "donors": [
        "bear_charge",
        "maul",
        "swipe"
      ],
      "ultimate": false
    },
    {
      "id": "hf_druid_s5",
      "classId": "druid",
      "slot": 5,
      "unlockLevel": 20,
      "name": "Paso Salvaje",
      "donors": [
        "travel_form",
        "dash",
        "barkskin"
      ],
      "ultimate": false
    },
    {
      "id": "hf_druid_u1",
      "classId": "druid",
      "slot": 6,
      "unlockLevel": 25,
      "name": "Despertar del Bosque",
      "donors": [
        "grove_awakening",
        "wildwake"
      ],
      "ultimate": true
    },
    {
      "id": "hf_druid_u2",
      "classId": "druid",
      "slot": 7,
      "unlockLevel": 30,
      "name": "Corazón de Estrellas",
      "donors": [
        "starfire",
        "moonseed",
        "hurricane"
      ],
      "ultimate": true
    }
  ]
};
export const HIGHFLY_PASSIVES:Record<HighflyClass,readonly string[]> = {
  "warrior": [
    "Resolución de Hierro",
    "Instinto de Venganza",
    "Avance Implacable"
  ],
  "paladin": [
    "Juramento de Luz",
    "Baluarte Sagrado",
    "Sello del Justiciero"
  ],
  "hunter": [
    "Instinto del Rastreador",
    "Corazón de Manada",
    "Ojo del Tirador"
  ],
  "rogue": [
    "Filo Afilado",
    "Maestro Tóxico",
    "Sombra Oportuna"
  ],
  "priest": [
    "Fortaleza del Credo",
    "Forma Velada",
    "Juzgar y Redimir"
  ],
  "shaman": [
    "Reservorio de Trueno",
    "Arma Viva",
    "Eco Elemental"
  ],
  "mage": [
    "Afinidad Elemental",
    "Eco Arcano",
    "Paso del Sabio"
  ],
  "warlock": [
    "Ofrenda Cruel",
    "Mirada del Vacío",
    "Pacto Persistente"
  ],
  "druid": [
    "Piel de Corteza",
    "Ciclo Natural",
    "Instinto Feral"
  ]
};
export const HIGHFLY_UNIQUE_SLOTS = ['U1','U2','U3'] as const;
export function highflyUnlockedFusions(classId:HighflyClass,level:number):readonly HighflyFusionSpec[] {
 return HIGHFLY_FUSED_SKILLS[classId].filter(x=>level>=x.unlockLevel);
}
export function highflyCatalogIsValid(abilityIds:ReadonlySet<string>):string[] {
 const errors:string[]=[];
 for(const [classId,skills] of Object.entries(HIGHFLY_FUSED_SKILLS)){
   if(skills.length!==7)errors.push(classId+':expected 7');
   for(const spec of skills){
     if(spec.classId!==classId)errors.push(spec.id+':class mismatch');
     if(spec.donors.length<2)errors.push(spec.id+':not a fusion');
     for(const donor of spec.donors)if(!abilityIds.has(donor)) errors.push(spec.id+':missing '+donor);
   }
 }
 return errors;
}
