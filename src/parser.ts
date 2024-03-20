/** Parser result helpers */

import { AnySymbol, Char, Digit, NewLine, Space, WhiteSpace } from './parser/defs';
import { ApplyParser, Assume, Parser, ParserFailResult, ParserSuccessResult } from './parser/parser';
import { ChainParsers, DropParser, Many0Parser, ManyParser, MapConcatParser, OneOfParsers } from './parser/parser-combinators';

/** CharT -> [CharT] | ParserFailResult */
export interface CharParser<CharT extends string> extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  typeof input extends `${infer V extends CharT}${infer Rest}`
    ? ParserSuccessResult<[V], Rest>
    : ParserFailResult<typeof input>;
}
 
/**
 * Str -> [Str] | ParserFailResult
 * @warn Union type for Str is not supported
 */
export interface StringParser<Str extends string> extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  (typeof input) extends `${Str}${infer Rest}`
    ? ParserSuccessResult<[Str], Rest>
    : ParserFailResult<typeof input>;
}

/** ([a-zA-Z]+) -> ['$1'] | ParserFailResult */
export type WordParser = MapConcatParser<ManyParser<CharParser<Char>>>;

/** ' ' -> [] | ParserFailResult */
export type DropSpaceParser = DropParser<CharParser<Space>>

/** ' ' -> [] | ParserFailResult */
export type DropWhitespaceParser = DropParser<CharParser<Space | NewLine>>

/** ' ' -> [] | ParserFailResult */
export type DropAllWhitespaceParser = DropParser<Many0Parser<CharParser<WhiteSpace>>>

/** AnySymbol -> [$1] | ParserFailResult */
export type SymbolParser = CharParser<AnySymbol>;

/** ([0-9]) -> [$1] | ParserFailResult */
export type DigitParser = CharParser<Digit>;

/** ([0-9]+) -> [$1] | ParserFailResult */
export type NumberParser = MapConcatParser<ManyParser<DigitParser>>;

/**
 * [' ']*<P>[' ']* -> [P]
 * I don't like that name
 */
export type AnySpaceSymbolParser<P extends Parser> = ChainParsers<[DropAllWhitespaceParser, P, DropAllWhitespaceParser]>;

/** Domain parsers */

type NamedArrowParser = MapConcatParser<ChainParsers<[StringParser<'--'>, WordParser, StringParser<'-->'>]>>;
type NamelessArrowParser = StringParser<'-->'>;

/** Implementation */

type AnyParser = OneOfParsers<[
  SymbolParser,
  DropSpaceParser,
  WordParser,
  NamedArrowParser,
  NamelessArrowParser
]>;

type TokenParser<T extends string> = ApplyParser<T, ManyParser<AnyParser>>

export { };
