/**
 * G01 world-donor contract. References, not clones or new damage authorities.
 * Read-only staging: none of these objects are spawned into live production.
 */
export const G01_BINDINGS = {
  map: {
    id: 'highfly.capital.rgpoly.g01',
    glb: 'highfly/world-genesis/rgpoly-city01.glb',
    sourceRepository: 'drakentzy07/HIGHFLY-NEXUS-UNITY',
    sourceRef: '6d37c76b7ea3954445302e6c0ff3e8174f9d9dbe',
    sourceScene: 'Assets/Stylized Medieval Kingdom URP/Scenes/Demo Stylized Medieval.unity',
    sourceBuilder: 'Assets/Highfly/Editor/HighflyCombatLabBuilder.RgPoly.cs',
    unitySourceSpawn: { x: 0, y: 13.35, z: -42 },
    exportStatus: 'PENDING_GLB_EXPORT',
  },
  hunter: {
    visualDonor: 'KayKit Character Pack Adventurers',
    role: 'universal_hunter',
    sourceRigAuditRequired: true,
  },
  skill: {
    id: 'fireball',
    nativeDefinition: 'src/sim/content/classes.ts',
    ownership: 'existing_sim_damage_authority',
    universalCastAdapterStatus: 'PENDING_REMOVE_CLASS_GATE',
  },
  wolf: {
    id: 'forest_wolf',
    nativeDefinition: 'src/sim/content/zone1.ts',
    ownership: 'existing_sim_ai_damage_loot',
    visualAndPlacementStatus: 'PENDING_G01_SCENE',
  },
  npc: {
    id: 'hf_g01_blacksmith',
    behaviorDonorId: 'smith_haldren',
    nativeDefinition: 'src/sim/content/zone1.ts',
    nexusBuilding: 'Smithy',
    nexusInteraction: 'interior.capital.forge',
    dialogueIntegrationStatus: 'PENDING_G01_SCENE',
  },
} as const;

export const G01_ACCEPTANCE_SEQUENCE = [
  'rgpoly_glb_loaded_with_collision',
  'kaykit_hunter_moves_camera_relative',
  'fireball_universal_cast_with_native_hit',
  'one_wolf_receives_real_damage_and_drops',
  'blacksmith_npc_interacts_via_use',
  'training_stats_and_world_save_isolation',
] as const;
