/** Basic types */

type LeftBracket = '[';
type RightBracket = ']';
type Comma = ',';
type NewLine = '\n';
type AnySymbol = LeftBracket | RightBracket | Comma | NewLine;

type UppercaseChar = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
type Char = UppercaseChar | Lowercase<UppercaseChar>;

/** Helpers */

/** string -> string[] */
type Split<T extends string> = T extends `${infer V}${infer Rest}`
  ? [V, ...Split<Rest>]
  : [];

/** string[] -> string */
type Concat<T extends string[]> = T extends [infer V extends string, ...infer Rest extends string[]]
  ? `${V}${Concat<Rest>}`
  : ''

/** Parser results */

type ParserResult<T = string[], R extends string[] = string[]> = [T | null, R];
type ParserSuccessResult<T, R extends string[] = string[]> = [T, R];
type ParserFailResult<R extends string[] = string[]> = [null, R];

/** Parser result helpers */

type FlatParserConcat<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends [string[], any]
  ? P2 extends [string[], any]
    ? ParserSuccessResult<[Concat<[...P1[0], ...P2[0]]>], P2[1]>
    : P1
  : P2 extends [string[], any]
    ? P2
    : ParserFailResult<P1[1]>;

type FlatParserJoin<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends [string[], any]
  ? P2 extends [string[], any]
    ? ParserSuccessResult<[...P1[0], ...P2[0]], P2[1]>
    : P1
  : P2 extends [string[], any]
    ? P2
    : ParserFailResult<P1[1]>;

type FlatParserOneOf<P extends ParserResult[]> = P extends [
  infer R extends ParserResult,
  ...infer Rest extends ParserResult[]
] ? R extends ParserSuccessResult<string[]>
    ? R
    : FlatParserOneOf<Rest>
  : ParserFailResult;

/** Basic parsers */

type CharParser<T extends string[], CharT extends string> = T extends [infer C extends CharT, ...infer Rest extends string[]]
  ? ParserSuccessResult<[C], Rest>
  : ParserFailResult<T>;

type StringParser<T extends string[], Str extends string> = T extends [...Split<Str>, ...infer Rest extends string[]]
  ? ParserSuccessResult<[Str], Rest>
  : ParserFailResult<T>;

type WordParser<T extends string[]> = CharParser<T, Char> extends infer Result extends ParserSuccessResult<string[]>
  ? FlatParserConcat<Result, WordParser<Result[1]>>
  : ParserFailResult<T>;

type SpaceParser<T extends string[]> = CharParser<T, ' '> extends infer Result extends ParserSuccessResult<string[]>
  ? ParserSuccessResult<[], Result[1]>
  : ParserFailResult<T>;

type SymbolParser<T extends string[]> = CharParser<T, AnySymbol>;

/** Domain parsers */

type NamedArrowParser<T extends string[]> =
  StringParser<T, '--'> extends infer R1 extends ParserSuccessResult<string[]>
    ? WordParser<R1[1]> extends infer R3 extends ParserSuccessResult<string[]>
      ? StringParser<R3[1], '-->'> extends infer R4 extends ParserSuccessResult<string[]>
        ? ParserSuccessResult<[`--${R3[0][0]}->`], R4[1]>
      : ParserFailResult<T>
    : ParserFailResult<T>
  : ParserFailResult<T>;

type NamelessArrowParser<T extends string[]> = StringParser<T, '-->'>;

/** Implementation */

type AnyParser<T extends string[]> = FlatParserOneOf<[
  NamedArrowParser<T>,
  NamelessArrowParser<T>,
  SymbolParser<T>,
  SpaceParser<T>,
  WordParser<T>
]>;

type TokenParser<T extends string[]> = 
  AnyParser<T> extends infer R extends ParserSuccessResult<string[]>
  ? FlatParserJoin<R, TokenParser<R[1]>>
  : ParserFailResult<T>;

type B = TokenParser<Split<'-->[qwe, qeq]--qweqeq-->'>>;

export { };
