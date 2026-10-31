/** The first letter of a name, upper-case — "?" for a blank one. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
