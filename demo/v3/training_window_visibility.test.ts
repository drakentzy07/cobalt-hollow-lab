import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('DEMO V3-01: Training Core window uses actual show and hide channel', () => {
  it('real highfly:open-training handler restores visible managed-window display', () => {
    const source=readFileSync('src/highfly/training/ui.ts','utf8');
    const trigger=source.indexOf("window.addEventListener('highfly:open-training'");
    const close=source.indexOf("const close = document.querySelector<HTMLElement>('#highfly-training-close')");
    expect(trigger).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(trigger);
    const openBody=source.slice(trigger,close);
    expect(openBody).toContain("trainingWindow?.removeAttribute('hidden')");
    expect(openBody).toContain("trainingWindow.style.display = 'flex'");
    expect(source.slice(close,close+1800)).toContain("trainingWindow.style.display = 'none'");
  });
});
