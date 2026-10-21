/** F7.1A — purely visual, reversible player-only portrait framing.
 * Keep target/party/chips and native HP/MP/ST bar geometry untouched.
 * The 3D capture remains unchanged; this only pans/overscans the player disc.
 */
export interface HighflyPortraitCrop { overscan: number; verticalOffsetFrac: number }
const ORIGINAL: HighflyPortraitCrop = { overscan: 1, verticalOffsetFrac: 0 };
const UNIFIED_PLAYER: HighflyPortraitCrop = { overscan: 1.08, verticalOffsetFrac: -0.035 };
export function highflyPortraitCrop(canvasId: string, unified: boolean): HighflyPortraitCrop {
  return unified && canvasId === 'pf-portrait' ? UNIFIED_PLAYER : ORIGINAL;
}
