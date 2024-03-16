type GenericFunction = (...x: any[]) => any;

// https://code.lol/post/programming/higher-kinded-types/
abstract class HKT {
  readonly _1: unknown;
  abstract new: GenericFunction;
}

type Assume<T, U> = T extends U ? T : U;

type Apply<F extends HKT, _1> = ReturnType<
  (F & {
    readonly _1: _1;
  })["new"]
>;

interface DoubleString extends HKT {
  new: (x: Assume<this["_1"], string>) => `${typeof x}${typeof x}`;
}

type Result = Apply<DoubleString, "hi!">;

////////

type FlatParserSuccessJoin<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends ParserSuccessResult<string[]>
  ? P2 extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[...P1[0], ...P2[0]], P2[1]>
    : ParserFailResult<P1[1]>
  : ParserFailResult<P1[1]>;

type ParserResult<T = string[], R extends string[] = string[]> = [T | null, R];
type ParserSuccessResult<T, R extends string[] = string[]> = [T, R];
type ParserFailResult<R extends string[] = string[]> = [null, R];

interface CharParser<CharT extends string> extends HKT {
  new: (input: Assume<this["_1"], string[]>) => (typeof input) extends [infer C extends CharT, ...infer Rest extends string[]]
    ? ParserSuccessResult<[C], Rest>
    : ParserFailResult<typeof input>;
}

type JoinParsers<T extends string[], P extends HKT[]> = P extends [
  infer P1 extends HKT,
  ...infer Rest extends HKT[]
] ? Apply<P1, T> extends infer R extends ParserSuccessResult<string[]>
    ? FlatParserSuccessJoin<R, JoinParsers<R[1], Rest>>
    : ParserFailResult<T>
  : ParserSuccessResult<[], T>;

type Result2 = JoinParsers<['a', 'b', 'c'], [CharParser<'a'>, CharParser<'b'>]>

export { };
