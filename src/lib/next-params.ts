export type MaybePromise<T> = Promise<T>

export async function resolveParams<T>(value: MaybePromise<T>): Promise<T> {
  return await value
}
