import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { highflyPortraitCrop } from '../src/highfly/origin/f7_portrait_crop';
import {
  MOBILE_ACTION_BUTTONS,
  sourceSlotForMobileButton,
} from '../src/ui/hud/action_bar/mobile_action_page_view';
import { HIGHFLY_ORIGIN_MODE_CONTRACT } from '../src/highfly/origin/unified_mode';
const source = (p: string) => readFileSync(p,'utf8');

describe('HIGHFLY F7.1A — native reuse and save-safe polish', () => {
  it('keeps four distinct normal S1–S4 buttons, not a fourth UNIQUE', () => {
    expect(MOBILE_ACTION_BUTTONS).toBe(4);
    expect([0,1,2,3].map(i=>sourceSlotForMobileButton(0,i))).toEqual([1,2,3,4]);
    const html=source('index.html');
    const row=html.slice(html.indexOf('id="mobile-action-ring"'), html.indexOf('id="mobile-action-radial"'));
    for (let i=0;i<4;i++) {
      expect(row).toContain('class="mobile-action-slot" type="button" data-mobile-index="'+i+'"');
    }
    expect((row.match(/class="mobile-action-slot" type="button"/g) ?? []).length).toBe(4);
    const mobile=source('src/styles/hud.mobile.css');
    expect(mobile).toContain('.mobile-action-slot[data-mobile-index="3"]');
  });

  it('only alters the UNIFIED player face crop, never bars, target or historical labs', () => {
    expect(highflyPortraitCrop('pf-portrait',true).verticalOffsetFrac).toBeLessThan(0);
    expect(highflyPortraitCrop('pf-portrait',true).overscan).toBeGreaterThan(1);
    for(const canvasId of ['tf-portrait','party-portrait','pf-portrait']){
      expect(highflyPortraitCrop(canvasId,false)).toEqual({overscan:1,verticalOffsetFrac:0});
    }
    expect(highflyPortraitCrop('tf-portrait',true)).toEqual({overscan:1,verticalOffsetFrac:0});
    const painter=source('src/ui/unit_portrait_painter.ts');
    expect(painter).toContain("canvas.id, unified");
    expect(painter).toContain("verticalOffsetFrac * size");
    const resource=source('src/highfly/origin/f1_world_ui.ts');
    expect(resource).toContain('if (unifiedFrame && hp) hp.after(meter)');
  });

  it('preserves the exact WORLD and LAB save keys and prohibits cross-mode preview', () => {
    const w=HIGHFLY_ORIGIN_MODE_CONTRACT.world, l=HIGHFLY_ORIGIN_MODE_CONTRACT.lab;
    expect(w.saveLocal).toBe('highfly.origin.primary.v1');
    expect(w.saveDb).toBe('highfly-offline');
    expect(w.saveSlot).toBe('origin-f1:primary');
    expect(l.saveLocal).toBe('highfly.origin.lab.primary.v1');
    expect(l.saveDb).not.toBe(w.saveDb);
    expect(l.saveSlot).not.toBe(w.saveSlot);
    expect(w.temporaryContentAccess).toBe(false);
    expect(l.temporaryContentAccess).toBe(true);
  });

  it('does not introduce a second auto-loot or movement engine', () => {
    const loot=source('src/game/autoloot.ts');
    expect(loot).toContain('world.autoLoot(e.id)');
    expect(loot).not.toContain('moveSpeed =');
    expect(loot).not.toContain('walkSpeed =');
    expect(source('src/main.ts')).toContain('if (settings.get(\'walkByAutoloot\')) autoLoot.run(world, now)');
  });
});
