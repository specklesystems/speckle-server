export default interface Queue<T> {
  add(value: T): void
  addAll(items: T[]): void
  disposeAsync(): Promise<void>
}
