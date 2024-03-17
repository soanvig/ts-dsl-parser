import { Concat } from './helpers';
import { ParserFailResult, ParserResult, ParserSuccessResult } from './parser';

/** ParserResult P1 -> ParserResult P2 -> `${P1}${P2}` || P1 || ParserFailResult */
export type FlatParserConcat<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends ParserSuccessResult<string[]>
  ? P2 extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[Concat<[...P1[0], ...P2[0]]>], P2[1]>
    : P1
  : ParserFailResult<P1[1]>;

/** ParserResult P1 -> ParserResult P2 -> `${P1}${P2}` || P1 || ParserFailResult */
export type FlatParserSuccessConcat<P1 extends ParserResult, P2 extends ParserResult> =
  P1 extends ParserSuccessResult<string[]>
  ? P2 extends ParserSuccessResult<string[]>
    ? ParserSuccessResult<[Concat<[...P1[0], ...P2[0]]>], P2[1]>
    : P1
  : ParserFailResult<P1[1]>;

/** ParserResult P1 -> ParserResult P2 -> [...P1, ...P2] || P1 || ParserFailResult */
export type FlatParserJoin<P1 extends ParserResult<unknown[]>, P2 extends ParserResult<unknown[]>> =
  P1 extends ParserSuccessResult<unknown[]>
  ? P2 extends ParserSuccessResult<unknown[]>
    ? ParserSuccessResult<[...P1[0], ...P2[0]], P2[1]>
    : P1
  : ParserFailResult<P1[1]>;

/** ParserResult P1 -> ParserResult P2 -> [...P1, ...P2] || ParserFailResult */
export type FlatParserSuccessJoin<P1 extends ParserResult<unknown[]>, P2 extends ParserResult<unknown[]>, FailResult extends string[] = P1[1]> =
  P1 extends ParserSuccessResult<unknown[]>
  ? P2 extends ParserSuccessResult<unknown[]>
    ? ParserSuccessResult<[...P1[0], ...P2[0]], P2[1]>
    : ParserFailResult<FailResult>
  : ParserFailResult<FailResult>;