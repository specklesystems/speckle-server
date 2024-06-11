import { ITransport } from './transports/ITransport';
import { Base } from './utils/Base';
import { IDisposable } from './utils/IDisposable';
export declare class Serializer implements IDisposable {
    #private;
    chunkSize: number;
    detachLineage: boolean[];
    lineage: string[];
    familyTree: Record<string, Record<string, number>>;
    closureTable: Record<string, unknown>;
    transport: ITransport | null;
    uniqueId: number;
    hashingFunction: (s: string) => string;
    constructor(transport: ITransport, chunkSize?: number, hashingFunction?: (s: string) => string);
    write(obj: Base): Promise<{
        hash: string;
        traversed: Record<string, unknown>;
    }>;
    dispose(): void;
}
