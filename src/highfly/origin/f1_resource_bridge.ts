/** ORIGIN-only live resource authority shared by mobile actions and the native
 * portrait meter. No localStorage mirrors or donor class resource substitution.
 * Mount owns lifetime; consumers cannot spend if no Hunter is active.
 */
export type OriginResourceKind = 'mana'|'stamina';
export interface OriginResourceController {
  canSpend(kind:OriginResourceKind, amount:number): boolean;
  spend(kind:OriginResourceKind, amount:number): boolean;
}
let active:OriginResourceController|null=null;
export function registerOriginResourceController(next:OriginResourceController|null): void {
  active=next;
}
export function getOriginResourceController():OriginResourceController|null {
  return active;
}
