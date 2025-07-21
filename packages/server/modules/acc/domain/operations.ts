import { PendingAccSyncItem } from "@/modules/acc/domain/types";

export type UpsertPendingAccSyncItem = (item: PendingAccSyncItem) => Promise<void>

export type DeletePendingAccSyncItem = (args: { id: string }) => Promise<void>

export type QueryAllPendingAccSyncItems = () => AsyncGenerator<PendingAccSyncItem[], void, unknown>