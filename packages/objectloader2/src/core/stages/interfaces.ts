import Queue from "../../queues/queue.js";
import { Item } from "../../types/types.js";


export interface Writer extends Queue<Item> {
  disposeAsync(): Promise<void>
}
