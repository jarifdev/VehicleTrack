export function calculateUsed(taken: number, returned: number): number {
  return taken - returned;
}

export function isValidReturn(taken: number, returned: number): boolean {
  return Number.isFinite(returned) && returned >= 0 && returned <= taken;
}
