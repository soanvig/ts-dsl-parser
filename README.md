# ts-dsl-parser

An attempt to create a proper parser in TypeScript types. Repository provides types that allow to compose your own parser.
It is a proof of concept only.
Due to how TypeScript works its performance is limited to very low number of parsed tokens
(number depends on parser computational complexity, however it is almost guaranteed to allow less than 100 tokens being parsed in one go as TypeScript has that limit set as a hard limit for its callstack).

For example, a JSON parser can be implemented as demonstrated in the code: [json-parser.ts](./src/json-parser.ts):

```ts
type ParsedJson = ApplyParser<'[{"label":"Age","value":123},{"label":"Name","value":"Mr Smith"}]', JsonParser>;
type Result = UnwrapJSON<ParsedJson['result'][0]>; // [{ label: "Age", value: 123 }, { label: "Name", value: "Mr Smith" }]
```

It produces real type out of a given string literal.

Building a parser might be useful if one wants to introduce DSL into his library in a way [jssm library](https://github.com/StoneCypher/jssm) did.
In most cases however writing dedicated solution will work much better than using generic parser (due to limitations described above).

## Parser - the higher kinded type

I find this project interesting especially for its usage of *higher kinded types* (HKT for short) even if those are theoretically not available in TypeScript.
You can see [Alice Poteat blog post](https://code.lol/post/programming/higher-kinded-types/) about the particular solution to that problem, and it's [usage in this repository](./src/parser/parser.ts).
Effectively this allows to pass arguments to parametrized types other types that would normally have to be generic. This is very similar to higher order function but on the type level.
Instead of manually iterating over an array we can have `.map` function, that accepts a function that accepts parameter determined at runtime.
Here we have types that accept other types that accept parameter determined at TypeScript compilation time.

The ideal solution would be to have a syntax similar to:

```ts
type Map<Array extends any[], T extends Function<?>> = Array extends infer R[] ? T<R>[] : never;
```

However, that is not possible. The T function would be a HKT.
But using Alice's solution we can have:

```ts
type Map<Array extends any[], T extends FunctionHKT> = Array extends infer R[] ? Apply<R, T>[] : never;
```

Which works very similar. It is not as straightforward, but it works. 

Usage of HKT is a *requirement* for proper parser composition:

```ts
type ArrowParser = MapConcatParser<ChainParsers<[StringParser<'--'>, WordParser, StringParser<'-->'>]>>;
type Result = ApplyParser<'--myArrow-->', ArrowParser>; // ['--myArrow-->'];
```

As you can see we are preparing (composing) a parser without saying which value it is going to parse.
That means a composed parser will have to accept additional generic type (the string literal to parse) *later on* which under normal circumstances is not possible.


