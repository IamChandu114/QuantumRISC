/** Formatting helpers shared by every engineering panel. */

export function hex(value: number, digits = 8): string {
  return `0x${(value >>> 0).toString(16).toUpperCase().padStart(digits, "0")}`;
}

export function bin(value: number, digits = 32): string {
  return (value >>> 0).toString(2).padStart(digits, "0");
}

export function groupBits(binary: string, size = 8): string {
  return binary.replace(new RegExp(`(.{${size}})(?=.)`, "g"), "$1 ");
}

export function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function ascii(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : ".";
}
