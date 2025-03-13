export default interface Queue<T> {
  add(value: T): void
}
