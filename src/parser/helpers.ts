/** string -> string[] */
export type Split<T extends string> = T extends `${infer V}${infer Rest}`
  ? [V, ...Split<Rest>]
  : [];

/** string[] -> string */
export type Concat<T extends string[]> = T extends [infer V extends string, ...infer Rest extends string[]]
  ? `${V}${Concat<Rest>}`
  : ''