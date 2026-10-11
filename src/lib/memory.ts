/**
 * Address of the first illustrative variable or array element.
 *
 * Decimal rather than the hexadecimal a real machine prints, so beginners can do
 * the `1000 + i × 4` arithmetic in their heads. Every screen labels these
 * addresses as an illustration.
 */
export const BASE_ADDRESS = 1000;

/** `sizeof(int)` on the platforms students use. */
export const INT_SIZE_BYTES = 4;

/** C does not allow an array with zero elements. */
export const MIN_ARRAY_LENGTH = 1;

/** Eight cells still fit one row on a projector and keep a loop run short. */
export const MAX_ARRAY_LENGTH = 8;

export function addressOf(index: number): number {
  return BASE_ADDRESS + index * INT_SIZE_BYTES;
}

export function isInBounds(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
