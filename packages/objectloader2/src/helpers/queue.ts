export default interface Queue<T> {
  add(value: T): void
  addRange(value: T[]): void
}
