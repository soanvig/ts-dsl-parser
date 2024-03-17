import { AnySpaceSymbolParser, CharParser, NumberParser, StringParser } from './parser';
import { Colon, Comma, LeftBrace, LeftBracket, Quote, RightBrace, RightBracket, Space } from './parser/defs';
import { Is, Split } from './parser/helpers';
import { ApplyParser, Assume, Parser, ParserFailResult, ParserSuccessResult } from './parser/parser';
import { ChainParsers, DropParser, Many0Parser, MapConcatParser, OneOfParsers, SeparatedBy0Parser, UntilParser } from './parser/parser-combinators';

type JSONNumber<T extends any> = { number: T };
type JSONArray<T extends any[]> = { array: T };
type JSONString<T extends any> = { string: T };
type JSONObject<T extends Record<string, any>> = { object: T };
type JSONNull = { null: true };
type JSONBoolean<T extends any> = { bool: T };

type JSONValue = JSONNumber<any> | JSONArray<any> | JSONString<any> | JSONObject<any> | JSONNull | JSONBoolean<any>;

/** [...(JSONString<key>, value)] -> { key: value } */
export type JSONListToObject<T extends any[]> = T extends [infer K extends JSONString<any>, ...infer Rest extends any[]]
  ? Rest extends [infer V extends any, ...infer Rest2 extends any[]]
    ? { [k in K['string']]: V } & JSONListToObject<Rest2>
    : never
  : {};

interface JsonNumberParser extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<(typeof input), NumberParser> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONNumber<R[0][0]>], R[1]>
    : ParserFailResult<typeof input>;
}

interface JsonStringParser extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<
    (typeof input),
    ChainParsers<[
      DropParser<CharParser<Quote>>,
      MapConcatParser<UntilParser<CharParser<Quote>>>,
      DropParser<CharParser<Quote>>
    ]>
  > extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONString<R[0][0]>], R[1]>
    : ParserFailResult<typeof input>;
}

interface JsonNullParser extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<(typeof input), StringParser<'null'>> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONNull], R[1]>
    : ParserFailResult<typeof input>;
}

interface JsonBooleanParser extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<(typeof input), OneOfParsers<[StringParser<'true'>, StringParser<'false'>]>> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONBoolean<R[0][0]>], R[1]>
    : ParserFailResult<typeof input>;
}

interface ToJsonArray<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<any[]>
    ? ParserSuccessResult<[JSONArray<R[0]>], R[1]>
    : ParserFailResult<typeof input>;
}

interface ToJsonObject<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string[]>) =>
  ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<any[]>
    ? ParserSuccessResult<[JSONObject<JSONListToObject<R[0]>>], R[1]>
    : ParserFailResult<typeof input>;
}

type JsonArrayParser = ChainParsers<[
  DropParser<CharParser<LeftBracket>>,
  DropParser<Many0Parser<CharParser<Space>>>,
  ToJsonArray<SeparatedBy0Parser<JsonParser, AnySpaceSymbolParser<CharParser<Comma>>>>,
  DropParser<Many0Parser<CharParser<Space>>>,
  DropParser<CharParser<RightBracket>>
]>;

type JsonObjectParser = ChainParsers<[
  DropParser<CharParser<LeftBrace>>,
  DropParser<Many0Parser<CharParser<Space>>>,
  ToJsonObject<SeparatedBy0Parser<
    ChainParsers<[JsonStringParser, DropParser<AnySpaceSymbolParser<CharParser<Colon>>>, JsonParser]>,
    ChainParsers<[Many0Parser<CharParser<Space>>, CharParser<Comma>, Many0Parser<CharParser<Space>>]>
  >>,
  DropParser<Many0Parser<CharParser<Space>>>,
  DropParser<CharParser<RightBrace>>
]>;

type JsonParser = OneOfParsers<[
  JsonNumberParser,
  JsonArrayParser,
  JsonObjectParser,
  JsonNullParser,
  JsonBooleanParser,
  JsonStringParser
]>;

type UnwrapArrayOfJSON<T extends JSONValue[]> = T extends [infer V extends JSONValue, ...infer Rest extends JSONValue[]]
  ? [UnwrapJSON<V>, ...UnwrapArrayOfJSON<Rest>]
  : [];

type UnwrapObjectOfJSON<T extends Record<string, JSONValue>> = {
  [K in keyof T]: UnwrapJSON<T[K]>
}

type UnwrapJSON<T extends JSONValue> =
  T extends JSONNumber<`${Is<infer R, number>}`> ? R
  : T extends JSONArray<infer R extends any[]> ? UnwrapArrayOfJSON<R>
  : T extends JSONString<infer R> ? R
  : T extends JSONObject<infer R> ? UnwrapObjectOfJSON<R>
  : T extends JSONNull ? null
  : T extends JSONBoolean<`${Is<infer R, boolean>}`> ? R
  : never;

type ParsedJson = ApplyParser<Split<'[123,452  ,  "asd"]'>, JsonParser>;
type ParsedJson2 = ApplyParser<Split<'112312321'>, JsonParser>;
type ParsedJson3 = ApplyParser<Split<'{    "asd"   :  123, "qwe": [    1, 2]}'>, JsonParser>;

type ParsedJson4 = ApplyParser<Split<'[1, 2, true, null, { "key": "value" }, []]'>, JsonParser>;
type Result = UnwrapJSON<ParsedJson4[0][0]>;
const a: [1, 2, true, null, { key: "value" }, []] = {} as Result; // NO ERROR ON ASSIGMENT!