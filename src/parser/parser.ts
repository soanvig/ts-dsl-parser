export type ParserResult<T = string[], R extends string[] = string[]> = [T | null, R];
export type ParserSuccessResult<T, R extends string[] = string[]> = [T, R];
export type ParserFailResult<R extends string[] = string[]> = [null, R];

export abstract class Parser {
  input: unknown; // this unknown seems to be required, otherwise not-parsed rest will be string[] instead of proper tuple
  abstract apply: (...x: any[]) => ParserResult<any>;
}

/** Input -> Parser -> ParserResult */
export type ApplyParser<Input, P extends Parser> = ReturnType<
  (P & {
    input: Input;
  })["apply"]
>;

/** Helper to write proper parser definitions */
export type Assume<T, U> = T extends U ? T : U;