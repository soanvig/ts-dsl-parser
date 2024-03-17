/** Parser result helpers */

import { AnySymbol, Char, Digit, NewLine, Space } from './parser/defs';
import { Split } from './parser/helpers';
import { ApplyParser, Assume, Parser, ParserFailResult, ParserSuccessResult } from './parser/parser';
import { ChainParsers, DropParser, Many0Parser, ManyParser, MapConcatParser, OneOfParsers } from './parser/parser-combinators';
import { FlatParserJoin } from './parser/parser-result-combinators';

/** CharT -> [CharT] | ParserFailResult */
export interface CharParser<CharT extends string> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  (typeof input) extends [infer C extends CharT, ...infer Rest extends string[]]
    ? ParserSuccessResult<[C], Rest>
    : ParserFailResult<typeof input>;
}

/** ...Str -> [Str] | ParserFailResult */
export interface StringParser<Str extends string> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  (typeof input) extends [...Split<Str>, ...infer Rest extends string[]]
    ? ParserSuccessResult<[Str], Rest>
    : ParserFailResult<typeof input>;
}

/** ([a-zA-Z]+) -> ['$1'] | ParserFailResult */
export type WordParser = MapConcatParser<ManyParser<CharParser<Char>>>;

/** ' ' -> [] | ParserFailResult */
export type DropSpaceParser = DropParser<CharParser<' '>>

/** ' ' -> [] | ParserFailResult */
export type DropWhitespaceParser = DropParser<CharParser<' ' | NewLine>>

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
export type AnySpaceSymbolParser<P extends Parser> = ChainParsers<[Many0Parser<CharParser<Space>>, P, Many0Parser<CharParser<Space>>]>;

/** Domain parsers */

type NamedArrowParser = MapConcatParser<ChainParsers<[StringParser<'--'>, WordParser, StringParser<'-->'>]>>;
type NamelessArrowParser = StringParser<'-->'>;

/** Implementation */

type AnyParser = OneOfParsers<[
  NamedArrowParser,
  NamelessArrowParser,
  SymbolParser,
  DropSpaceParser,
  WordParser
]>;

type TokenParser<T extends string[]> = 
  ApplyParser<T, AnyParser> extends infer R extends ParserSuccessResult<string[]>
  ? FlatParserJoin<R, TokenParser<R[1]>>
  : ParserFailResult<T>;

type TestParsing = TokenParser<Split<'-->[qwe, qeq]--qweqeq-->'>>;

export { };

