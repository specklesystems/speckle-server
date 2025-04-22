/* eslint-disable @typescript-eslint/no-explicit-any */

export type OverridesOf<T extends (deps: any) => any> = Partial<Parameters<T>[0]>
