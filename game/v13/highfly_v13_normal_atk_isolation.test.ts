import { describe,expect,it } from 'vitest';
import { highflyV13MuteNormalAttack } from '../src/highfly/v13_normal_atk_isolation';

const classes=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
describe('V13 lab-only basic ATK/VFX isolation for all nine classes',()=>{
  it.each(classes)('%s: removes only player normal swings under V13 URL',cls=>{
    void cls;
    const pid=71;
    expect(highflyV13MuteNormalAttack('?hf-v13=1&hf-v13-class='+cls,pid,pid)).toBe(true);
    // Class abilities, enemy mobs and summons keep their own casts/attacks.
    expect(highflyV13MuteNormalAttack('?hf-v13=1&hf-v13-class='+cls,pid+1,pid)).toBe(false);
  });
  it('normal HIGHFLY game, SF28 and all non-V13 URLs remain unchanged',()=>{
    for(const query of ['', '?hf-manual-aim=1','?hf-v13=0','?hf-v13=2','?hf-v13','?hf-v13=01','?hf-sf28=1']){
      expect(highflyV13MuteNormalAttack(query,71,71)).toBe(false);
    }
  });
  it('no accidental substring flag or other actor IDs',()=>{
    expect(highflyV13MuteNormalAttack('?hf-v13-extra=1',2,2)).toBe(false);
    expect(highflyV13MuteNormalAttack('?hf-v13=1',72,71)).toBe(false);
  });
});
