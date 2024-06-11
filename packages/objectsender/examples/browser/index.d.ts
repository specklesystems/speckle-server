import { Base } from './utils/Base';
export type SendParams = {
    serverUrl?: string;
    projectId: string;
    token: string;
    logger?: {
        log: (message: unknown) => void;
        error: (message: unknown) => void;
    };
};
export type SendResult = {
    hash: string;
    traversed: Record<string, unknown>;
};
/**
 * Decomposes, serializes and sends to a speckle server a given object. Note, for objects to be detached, they need to have a 'speckle_type' property.
 * @param object object to decompose, serialise and send to speckle
 * @param parameters: server url, project id and token
 * @returns the hash of the root object and the value of the root object
 */
declare const send: (object: Base, { serverUrl, projectId, token, logger }: SendParams) => Promise<SendResult | undefined>;
export { Base, send };
