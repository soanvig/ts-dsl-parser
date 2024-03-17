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

/** ParserResult P1 -> ParserResult P2 -> `${P1}${P2}` || P1 || ParserFailResult */
type FlatParserConcat<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends [string[], any]
  ? P2 extends [string[], any]
    ? ParserSuccessResult<[Concat<[...P1[0], ...P2[0]]>], P2[1]>
    : P1
  : ParserFailResult<P1[1]>;

/** ParserResult P1 -> ParserResult P2 -> [...P1, ...P2] || P1 || ParserFailResult */
type FlatParserJoin<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends [string[], any]
  ? P2 extends [string[], any]
    ? ParserSuccessResult<[...P1[0], ...P2[0]], P2[1]>
    : P1
  : ParserFailResult<P1[1]>;

/** ParserResult P1 -> ParserResult P2 -> [...P1, ...P2] || ParserFailResult */
type FlatParserSuccessJoin<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends ParserSuccessResult<string[]>
  ? P2 extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[...P1[0], ...P2[0]], P2[1]>
    : ParserFailResult<P1[1]>
  : ParserFailResult<P1[1]>;

/** Parser HKT */

abstract class Parser {
  input: unknown; // this unknown seems to be required, otherwise not-parsed rest will be string[] instead of proper tuple
  abstract apply: (...x: any[]) => ParserResult;
}

/** Input -> Parser -> ParserResult */
type ApplyParser<Input, P extends Parser> = ReturnType<
  (P & {
    input: Input;
  })["apply"]
>;

/**
 * All parsers need to success (due to FlatParserSucessJoin).
 * If FlatParserJoin would be used instead, then parsing will stop on first fail, however what was parsed will be returned
 */
interface ChainParsers<P extends Parser[]> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  P extends [
    infer P1 extends Parser,
    ...infer Rest extends Parser[]
  ] ? ApplyParser<typeof input, P1> extends infer R extends ParserSuccessResult<string[]>
      ? FlatParserSuccessJoin<R, ApplyParser<R[1], ChainParsers<Rest>>>
      : ParserFailResult<typeof input>
    : ParserSuccessResult<[], typeof input>;
}

/**
 * At least one of parsers needs to success. The first to succeed is chosen.
 */
interface OneOfParsers<P extends Parser[]> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  P extends [
    infer P1 extends Parser,
    ...infer Rest extends Parser[]
  ] ? ApplyParser<typeof input, P1> extends infer R extends ParserSuccessResult<string[]>
      ? R
      : ApplyParser<typeof input, OneOfParsers<Rest>>
    : ParserFailResult<typeof input>;
} 

/**
 * Concatenates parser result
 */
interface MapConcatParser<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
    ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[Concat<R[0]>], R[1]>
    : ParserFailResult<typeof input>
} 

/**
 * Applies parser over and over until fails, then returns joined result.
 * It needs to succeed at least once
 */
interface ManyParser<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<string[]>
    ? FlatParserJoin<R, ApplyParser<R[1], ManyParser<P>>>
    : ParserFailResult<typeof input>
}

/**
 * Applies parser over and over until fails, then returns joined result.
 * It needs to succeed at least once
 */
interface DropParser<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[], R[1]>
    : ParserFailResult<typeof input>
}

/** Helper to write proper parser definitions */
type Assume<T, U> = T extends U ? T : U;

/** Basic parsers */

/** CharT -> [CharT] | ParserFailResult */
interface CharParser<CharT extends string> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  (typeof input) extends [infer C extends CharT, ...infer Rest extends string[]]
    ? ParserSuccessResult<[C], Rest>
    : ParserFailResult<typeof input>;
}

/** ...Str -> [Str] | ParserFailResult */
interface StringParser<Str extends string> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  (typeof input) extends [...Split<Str>, ...infer Rest extends string[]]
    ? ParserSuccessResult<[Str], Rest>
    : ParserFailResult<typeof input>;
}

/** ([a-zA-Z]) -> ['$1'] | ParserFailResult */
type WordParser = MapConcatParser<ManyParser<CharParser<Char>>>;

/** ' ' -> [] | ParserFailResult */
type SpaceParser = DropParser<CharParser<' '>>

type SymbolParser = CharParser<AnySymbol>;

/** Domain parsers */

type NamedArrowParser = MapConcatParser<ChainParsers<[StringParser<'--'>, WordParser, StringParser<'-->'>]>>;
type NamelessArrowParser = StringParser<'-->'>;

/** Implementation */

type AnyParser = OneOfParsers<[
  NamedArrowParser,
  NamelessArrowParser,
  SymbolParser,
  SpaceParser,
  WordParser
]>;

type TokenParser<T extends string[]> = 
  ApplyParser<T, AnyParser> extends infer R extends ParserSuccessResult<string[]>
  ? FlatParserJoin<R, TokenParser<R[1]>>
  : ParserFailResult<T>;

type TestParsing = TokenParser<Split<'-->[qwe, qeq]--qweqeq-->'>>;

export { };
