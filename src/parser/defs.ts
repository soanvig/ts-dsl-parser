export type LeftBracket = '[';
export type RightBracket = ']';
export type Comma = ',';
export type NewLine = '\n';
export type AnySymbol = LeftBracket | RightBracket | Comma | NewLine;

export type UppercaseChar = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
export type Char = UppercaseChar | Lowercase<UppercaseChar>;