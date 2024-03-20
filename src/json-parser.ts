import { AnySpaceSymbolParser, CharParser, DropAllWhitespaceParser, NumberParser, StringParser } from './parser';
import { Colon, Comma, LeftBrace, LeftBracket, Quote, RightBrace, RightBracket, Space } from './parser/defs';
import { Is } from './parser/helpers';
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
  apply: (input: Assume<this['input'], string>) =>
  ApplyParser<(typeof input), NumberParser> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONNumber<R['result'][0]>], R['rest']>
    : ParserFailResult<typeof input>;
}

interface JsonStringParser extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  ApplyParser<
    (typeof input),
    ChainParsers<[
      DropParser<CharParser<Quote>>,
      MapConcatParser<UntilParser<CharParser<Quote>>>,
      DropParser<CharParser<Quote>>
    ]>
  > extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONString<R['result'][0]>], R['rest']>
    : ParserFailResult<typeof input>;
}

interface JsonNullParser extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  ApplyParser<(typeof input), StringParser<'null'>> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONNull], R['rest']>
    : ParserFailResult<typeof input>;
}

interface JsonBooleanParser extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  ApplyParser<(typeof input), OneOfParsers<[StringParser<'true'>, StringParser<'false'>]>> extends infer R extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[JSONBoolean<R['result'][0]>], R['rest']>
    : ParserFailResult<typeof input>;
}

interface ToJsonArray<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<any[]>
    ? ParserSuccessResult<[JSONArray<R['result']>], R['rest']>
    : ParserFailResult<typeof input>;
}

interface ToJsonObject<P extends Parser> extends Parser {
  apply: (input: Assume<this['input'], string>) =>
  ApplyParser<typeof input, P> extends infer R extends ParserSuccessResult<any[]>
    ? ParserSuccessResult<[JSONObject<JSONListToObject<R['result']>>], R['rest']>
    : ParserFailResult<typeof input>;
}

type JsonArrayParser = ChainParsers<[
  DropParser<CharParser<LeftBracket>>,
  DropAllWhitespaceParser,
  ToJsonArray<SeparatedBy0Parser<JsonParser, AnySpaceSymbolParser<CharParser<Comma>>>>,
  DropAllWhitespaceParser,
  DropParser<CharParser<RightBracket>>
]>;

type JsonObjectParser = ChainParsers<[
  DropParser<CharParser<LeftBrace>>,
  DropAllWhitespaceParser,
  ToJsonObject<SeparatedBy0Parser<
    ChainParsers<[JsonStringParser, DropParser<AnySpaceSymbolParser<CharParser<Colon>>>, JsonParser]>,
    ChainParsers<[Many0Parser<CharParser<Space>>, CharParser<Comma>, Many0Parser<CharParser<Space>>]>
  >>,
  DropAllWhitespaceParser,
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

type ParsedJson = ApplyParser<'[123,452  ,  "asd"]', JsonParser>;
type ParsedJson2 = ApplyParser<'112312321', JsonParser>;
type ParsedJson3 = ApplyParser<'{    "asd"   :  123, "qwe": [    1, 2]}', JsonParser>;

type ParsedJson4 = ApplyParser<'[1, 2, true, null, { "key": "value" }, []]', JsonParser>;
type Result = UnwrapJSON<ParsedJson4['result'][0]>;
const a: [1, 2, true, null, { key: "value" }, []] = {} as Result; // NO ERROR ON ASSIGMENT!

type ParsedJson5 = ApplyParser<'[{"title":"Fuel Provider Holding Account","const":"fuelProviderHoldingAccount"},{"title":"General Holding Account","const":"generalHoldingAccount"}]', JsonParser>;
type Result5 = UnwrapJSON<ParsedJson5['result'][0]>;

// performance tests
// type ParsedJson7 = ApplyParser<'{"definitions":{"accountType":{"oneOf":[{"title":"Air Transport Provider Holding Account","const":"airTransportProviderHoldingAccount"},{"title":"Fuel Provider Holding Account","const":"fuelProviderHoldingAccount"},{"title":"General Holding Account","const":"generalHoldingAccount"},{"title":"Logistics Provider Holding Account","const":"logisticsProviderHoldingAccount"}]},"certificationScheme":{"oneOf":[{"title":"RSB CORSIA","const":"rsbCorsia"},{"title":"ISCC CORSIA","const":"isccCorsia"},{"title":"RSB EU RED","const":"rsbEuRed"},{"title":"ISCC EU","const":"isccEu"},{"title":"RSB Global","const":"rsbGlobal"},{"title":"ISCC PLUS","const":"isccPlus"}]}}}', JsonParser>;
// type ParsedJson6 = ApplyParser<'[1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9]', JsonParser>;

