/** P02-I native render palette can only change the isolated monster islands. */
import {describe,it,expect} from 'vitest';
import {getActiveWorldContent,setActiveWorldContent} from '../src/sim/data';
import {BIOME_PALETTE} from '../src/render/terrain_palette';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {
  HIGHFLY_HUNT_RENDER_BIOMES,
  highflyHuntActiveGroundPalette,
  highflyHuntPaletteCoverage,
} from '../src/highfly/monsters/hunt_render_palette';

describe('P02-I native distinct dungeon palettes, no V4 side effects',()=>{
  it('has eight distinct ground palette IDs and all native palettes exist',()=>{
    expect(HIGHFLY_HUNT_RENDER_BIOMES).toHaveLength(8);
    expect(new Set(HIGHFLY_HUNT_RENDER_BIOMES).size).toBe(8);
    expect(highflyHuntPaletteCoverage()).toBe(true);
    expect(HIGHFLY_HUNT_SCENARIOS.map(s=>s.biome)).toEqual(HIGHFLY_HUNT_RENDER_BIOMES);
    expect(HIGHFLY_HUNT_RENDER_BIOMES.every(key=>!!BIOME_PALETTE[key])).toBe(true);
  });
  it('gates 8 live palettes by active native WorldContent generation, never public world',()=>{
    const original=getActiveWorldContent();
    expect(highflyHuntActiveGroundPalette()).toBeNull();
    try {
      for(const s of HIGHFLY_HUNT_SCENARIOS){
        setActiveWorldContent({
          ...original,
          zones:[{...original.zones[0],id:s.id+'_playtest',biome:s.biome}],
        });
        expect(highflyHuntActiveGroundPalette()).toEqual(BIOME_PALETTE[s.biome]);
      }
      setActiveWorldContent({...original,zones:[{...original.zones[0],id:'v4_public',biome:'frost'}]});
      expect(highflyHuntActiveGroundPalette()).toBeNull();
      setActiveWorldContent({
        ...original,
        zones:[{...original.zones[0],id:'hf_hunt_frost_50_playtest',biome:'frost'},
               {...original.zones[0],id:'another_zone',biome:'frost'}],
      });
      expect(highflyHuntActiveGroundPalette()).toBeNull();
    }finally{
      setActiveWorldContent(original);
    }
    expect(highflyHuntActiveGroundPalette()).toBeNull();
  });
});
