// Type declarations for thirty-two library
declare module 'thirty-two' {
  export function encode(buffer: Uint8Array): { toString(): string };
  export function decode(str: string): Uint8Array;
}
