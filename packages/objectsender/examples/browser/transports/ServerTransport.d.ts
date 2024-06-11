import { ITransport } from './ITransport';
import { IDisposable } from '../utils/IDisposable';
/**
 * Basic object sender to a speckle server
 */
export declare class ServerTransport implements ITransport, IDisposable {
    buffer: string[];
    maxSize: number;
    currSize: number;
    serverUrl: string;
    projectId: string;
    authToken: string;
    constructor(serverUrl: string, projectId: string, authToken: string, maxSize?: number);
    write(serialisedObject: string, size: number): Promise<void>;
    flush(): Promise<void>;
    dispose(): void;
}
