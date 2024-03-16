/**
 * TODO List
 * 
 * 1. Make tokenizer properly tokenize multiple states: [A, B] (currently it splits by space)
 */

type Test = `
  OnChecks --checksDone--> Signatures
  Signatures --> OnIssue
`;

type Test2 = `
[A,B] --> C
[C,D] --someAction--> E
`;

/** Helpers */

type ToLines<T extends string> = T extends `${infer Line}\n${infer Rest}`
  ? Line | ToLines<Rest>
  : T

type Truncate<T extends string> = T extends ` ${infer Str}`
  ? Truncate<Str>
  : T extends `${infer Str} `
    ? Truncate<Str>
    : T;

type CommaSeparatedList<T extends string> = T extends `${infer V},${infer Rest}`
    ? Truncate<V> | CommaSeparatedList<Rest>
    : Truncate<T>;

/** Tokens */

type Tokens<T extends string> = T extends `${infer Token} ${infer Rest}`
  ? [Token, ...Tokens<Rest>]
  : T extends string
    ? [T]
    : never;

/** State */

type OneOrManyStates<T extends string> = T extends `[${infer V}]`
  ? CommaSeparatedList<V>
  : T;

/** Arrows */

type NamedArrow<T extends string> = `--${T}-->`;
type NamelessArrow = `-->`;

type Arrow = NamelessArrow | NamedArrow<string>;

/** Transitions */

type Transition<S1 extends string, S2 extends string, Name extends string> = { from: S1, to: S2, name: Name };

type ParsedTransition<S1 extends string, S2 extends string, Name extends string> =
  // This forces union distribution: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
  S1 extends any
    ? Transition<S1, S2, Name>
    : never;

type CommandTransition<T extends string[]> = T extends [
  infer S1 extends string,
  infer A extends NamedArrow<string>,
  infer S2 extends string,
  ...infer Rest extends string[]
] ? ParsedTransition<OneOrManyStates<S1>, S2, TransitionName<A>> | Transitions<[S2, ...Rest]> : never;

type AutoTransition<T extends string[]> = T extends [
  infer S1 extends string,
  infer A extends NamelessArrow,
  infer S2 extends string,
  ...infer Rest extends string[]
] ? ParsedTransition<OneOrManyStates<S1>, S2, never> | Transitions<[S2, ...Rest]> : never;

type Transitions<T extends string[]> = CommandTransition<T> | AutoTransition<T>;

type TransitionName<T extends Arrow> = T extends NamedArrow<infer Name>
  ? Name
  : never;

/** Playground */

type ResultTokens = Tokens<Truncate<ToLines<Test>>>;
type Result = Transitions<ResultTokens>;

type ResultTokens2 = Tokens<Truncate<ToLines<Test2>>>;
type Result2 = Transitions<ResultTokens2>
  
type List = CommaSeparatedList<'A,B, C , D'>
type States = OneOrManyStates<'[A,B]'> | OneOrManyStates<'C'>;

export { };
