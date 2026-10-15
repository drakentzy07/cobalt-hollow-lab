/** ORIGIN OR-1 P2: only one unacknowledged online basic strike at a time.
 * An ACK is server swing acceptance, NOT a guaranteed hit/damage.
 * No persistent state, timers or class dependency.
 */
export class HighflyOriginStrikeAckGate {
  private nextId = 0;
  private inflight: number | null = null;

  begin(): number | null {
    if (this.inflight !== null) return null;
    const id = ++this.nextId;
    this.inflight = id;
    return id;
  }
  /** true only when the matching latest outstanding intent was accepted. */
  settle(id: number, accepted: boolean): boolean {
    if (this.inflight !== id) return false;
    this.inflight = null;
    return accepted === true;
  }
  cancel(): void {
    this.inflight = null;
    ++this.nextId;
  }
  get pending(): boolean {
    return this.inflight !== null;
  }
}
