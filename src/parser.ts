/** Parser result helpers */

import { AnySymbol, Char, Digit, LeftBracket, NewLine, Quote, RightBracket } from './parser/defs';
import { Split } from './parser/helpers';
import { ApplyParser, Assume, Parser, ParserFailResult, ParserSuccessResult } from './parser/parser';
import { ChainParsers, DropParser, ManyParser, MapConcatParser, OneOfParsers, OptParser, UntilParser } from './parser/parser-combinators';
import { FlatParserJoin } from './parser/parser-result-combinators';

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

/** ([a-zA-Z]+) -> ['$1'] | ParserFailResult */
type WordParser = MapConcatParser<ManyParser<CharParser<Char>>>;

/** ' ' -> [] | ParserFailResult */
type DropSpaceParser = DropParser<CharParser<' '>>

/** ' ' -> [] | ParserFailResult */
type DropWhitespaceParser = DropParser<CharParser<' ' | NewLine>>

/** AnySymbol -> [$1] | ParserFailResult */
type SymbolParser = CharParser<AnySymbol>;

/** ([0-9]) -> [$1] | ParserFailResult */
type DigitParser = CharParser<Digit>;

/** ([0-9]+) -> [$1] | ParserFailResult */
type NumberParser = ManyParser<DigitParser>;

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

// JSON parser

type JSONNumber = NumberParser;
type JSONString = ChainParsers<[CharParser<Quote>, MapConcatParser<UntilParser<CharParser<Quote>>>, CharParser<Quote>]>;
type JSONArray = ChainParsers<[
  CharParser<LeftBracket>,
  ManyParser<ChainParsers<[JSONParser, DropParser<OptParser<CharParser<','>>>]>>,
  CharParser<RightBracket>
]>;

type JSONParser = OneOfParsers<[
  JSONArray,
  JSONNumber,
  JSONString,
]>;

type ParsedJson = ApplyParser<Split<'[5]'>, JSONParser>;

// this doesn't work:
type A = ApplyParser<Split<'123'>, NumberParser>;