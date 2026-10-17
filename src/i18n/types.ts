import type en from './messages/en';

/** CLDR plural categories. `other` is mandatory and is the fallback for every count. */
export interface PluralForms { zero?: string; one?: string; two?: string; few?: string; many?: string; other: string }
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends PluralForms ? PluralForms : Shape<T[K]> };
type Leaves<T, Prefix extends string = ''> = { [K in keyof T & string]: T[K] extends string | PluralForms ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`> }[keyof T & string];

/** The English dictionary is the source of truth: every other language must match its shape. */
export type Messages = Shape<typeof en>;
export type MessageKey = Leaves<typeof en>;
export type MessageParams = Record<string, string | number>;
export type Translator = (key: MessageKey, params?: MessageParams) => string;
