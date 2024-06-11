/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

/* eslint-disable camelcase */
/**
 * Basic hashing function, to avoid dependencies and crazy build processes
 * @param msg
 * @returns
 */
function SHA1(msg) {
    function rotate_left(n, s) {
        const t4 = (n << s) | (n >>> (32 - s));
        return t4;
    }
    function cvt_hex(val) {
        let str = '';
        let i;
        let v;
        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    }
    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, '\n');
        let utftext = '';
        for (let n = 0; n < string.length; n++) {
            const c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
    let blockstart;
    let i, j;
    const W = new Array(80);
    let H0 = 0x67452301;
    let H1 = 0xefcdab89;
    let H2 = 0x98badcfe;
    let H3 = 0x10325476;
    let H4 = 0xc3d2e1f0;
    let A, B, C, D, E;
    let temp;
    msg = Utf8Encode(msg);
    const msg_len = msg.length;
    const word_array = [];
    for (i = 0; i < msg_len - 3; i += 4) {
        j =
            (msg.charCodeAt(i) << 24) |
                (msg.charCodeAt(i + 1) << 16) |
                (msg.charCodeAt(i + 2) << 8) |
                msg.charCodeAt(i + 3);
        word_array.push(j);
    }
    switch (msg_len % 4) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = (msg.charCodeAt(msg_len - 1) << 24) | 0x0800000;
            break;
        case 2:
            i =
                (msg.charCodeAt(msg_len - 2) << 24) |
                    (msg.charCodeAt(msg_len - 1) << 16) |
                    0x08000;
            break;
        case 3:
            i =
                (msg.charCodeAt(msg_len - 3) << 24) |
                    (msg.charCodeAt(msg_len - 2) << 16) |
                    (msg.charCodeAt(msg_len - 1) << 8) |
                    0x80;
            break;
    }
    word_array.push(i);
    while (word_array.length % 16 !== 14)
        word_array.push(0);
    word_array.push(msg_len >>> 29);
    word_array.push((msg_len << 3) & 0x0ffffffff);
    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
        for (i = 0; i < 16; i++)
            W[i] = word_array[blockstart + i];
        for (i = 16; i <= 79; i++)
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;
        for (i = 0; i <= 19; i++) {
            temp =
                (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5a827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ed9eba1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        for (i = 40; i <= 59; i++) {
            temp =
                (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8f1bbcdc) &
                    0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xca62c1d6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }
    const h = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return h.toLowerCase().substring(0, 32);
}

var _Serializer_instances, _Serializer_traverse, _Serializer_traverseValue, _Serializer_detachHelper, _Serializer_handleChunk, _Serializer_generateId;
class Serializer {
    constructor(transport, chunkSize = 1000, hashingFunction = SHA1) {
        _Serializer_instances.add(this);
        this.chunkSize = chunkSize;
        this.detachLineage = [true]; // first ever call is always detached
        this.lineage = [];
        this.familyTree = {};
        this.closureTable = {};
        this.transport = transport;
        this.uniqueId = 0;
        this.hashingFunction = hashingFunction || SHA1;
    }
    async write(obj) {
        return await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverse).call(this, obj, true);
    }
    dispose() {
        this.detachLineage = [];
        this.lineage = [];
        this.familyTree = {};
        this.closureTable = {};
        this.transport = null;
    }
}
_Serializer_instances = new WeakSet(), _Serializer_traverse = async function _Serializer_traverse(obj, root) {
    const temporaryId = `${this.uniqueId++}-obj`;
    this.lineage.push(temporaryId);
    const traversed = { speckle_type: obj.speckle_type || 'Base' };
    for (const propKey in obj) {
        const value = obj[propKey];
        // 0. skip some props
        if (!value || propKey === 'id' || propKey.startsWith('_'))
            continue;
        // 1. primitives (numbers, bools, strings)
        if (typeof value !== 'object') {
            traversed[propKey] = value;
            continue;
        }
        const isDetachedProp = propKey.startsWith('@');
        // 2. chunked arrays
        const isArray = Array.isArray(value);
        const isChunked = isArray ? propKey.match(/^@\((\d*)\)/) : false; // chunk syntax
        if (isArray && isChunked && value.length !== 0 && typeof value[0] !== 'object') {
            const chunkSize = isChunked[1] !== '' ? parseInt(isChunked[1]) : this.chunkSize;
            const chunkRefs = [];
            let chunk = new DataChunk();
            let count = 0;
            for (const el of value) {
                if (count === chunkSize) {
                    chunkRefs.push(await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_handleChunk).call(this, chunk));
                    chunk = new DataChunk();
                    count = 0;
                }
                chunk.data.push(el);
                count++;
            }
            if (chunk.data.length !== 0)
                chunkRefs.push(await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_handleChunk).call(this, chunk));
            traversed[propKey.replace(isChunked[0], '')] = chunkRefs; // strip chunk syntax
            continue;
        }
        // 3. speckle objects
        if (value.speckle_type) {
            const child = (await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverseValue).call(this, {
                value,
                isDetached: isDetachedProp
            }));
            traversed[propKey] = isDetachedProp ? await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_detachHelper).call(this, child.id) : child;
            continue;
        }
        // 4. other objects (dicts/maps, lists)
        traversed[propKey] = await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverseValue).call(this, {
            value,
            isDetached: isDetachedProp
        });
    }
    // We've finished going through all the properties of this object, now let's perform the last rites
    const detached = this.detachLineage.pop();
    const parent = this.lineage.pop();
    if (this.familyTree[parent]) {
        const closure = {};
        Object.entries(this.familyTree[parent]).forEach(([ref, depth]) => {
            closure[ref] = depth - this.detachLineage.length;
        });
        traversed['totalChildrenCount'] = Object.keys(closure).length;
        if (traversed['totalChildrenCount']) {
            traversed['__closure'] = closure;
        }
    }
    const { hash, serializedObject, size } = __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_generateId).call(this, traversed);
    traversed.id = hash;
    // Pop it in
    if ((detached || root) && this.transport) {
        await this.transport.write(serializedObject, size);
    }
    // We've reached the end, let's flush
    if (root && this.transport) {
        await this.transport.flush();
    }
    return { hash, traversed };
}, _Serializer_traverseValue = async function _Serializer_traverseValue({ value, isDetached = false }) {
    // 1. primitives
    if (typeof value !== 'object')
        return value;
    // 2. arrays
    if (Array.isArray(value)) {
        const arr = value;
        // 2.1 empty arrays
        if (arr.length === 0)
            return value;
        // 2.2 primitive arrays
        if (typeof arr[0] !== 'object')
            return arr;
        // 2.3. non-primitive non-detached arrays
        if (!isDetached) {
            return Promise.all(value.map(async (el) => await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverseValue).call(this, { value: el })));
        }
        // 2.4 non-primitive detached arrays
        const detachedList = [];
        for (const el of value) {
            if (typeof el === 'object' && el.speckle_type) {
                this.detachLineage.push(isDetached);
                const { hash } = await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverse).call(this, el, false);
                detachedList.push(__classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_detachHelper).call(this, hash));
            }
            else {
                detachedList.push(await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverseValue).call(this, { value: el, isDetached }));
            }
        }
        return detachedList;
    }
    // 3. dicts
    if (!value.speckle_type)
        return value;
    // 4. base objects
    if (value.speckle_type) {
        this.detachLineage.push(isDetached);
        const res = await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverse).call(this, value, false);
        return await res.traversed;
    }
    throw new Error(`Unsupported type '${typeof value}': ${value}.`);
}, _Serializer_detachHelper = function _Serializer_detachHelper(refHash) {
    this.lineage.forEach((parent) => {
        if (!this.familyTree[parent])
            this.familyTree[parent] = {};
        if (!this.familyTree[parent][refHash] ||
            this.familyTree[parent][refHash] > this.detachLineage.length) {
            this.familyTree[parent][refHash] = this.detachLineage.length;
        }
    });
    return {
        referencedId: refHash,
        speckle_type: 'reference'
    };
}, _Serializer_handleChunk = async function _Serializer_handleChunk(chunk) {
    this.detachLineage.push(true);
    const { hash } = await __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_traverse).call(this, chunk, false);
    return __classPrivateFieldGet(this, _Serializer_instances, "m", _Serializer_detachHelper).call(this, hash);
}, _Serializer_generateId = function _Serializer_generateId(obj) {
    const s = JSON.stringify(obj);
    const h = this.hashingFunction(s);
    const f = s.substring(0, 1) + `"id":"${h}",` + s.substring(1);
    return {
        hash: SHA1(s),
        serializedObject: f,
        size: s.length // approx, good enough as we're just limiting artificially batch sizes based on this
    };
};
class DataChunk {
    constructor() {
        this.data = [];
        this.speckle_type = 'Speckle.Core.Models.DataChunk';
    }
}

/**
 * Basic object sender to a speckle server
 */
class ServerTransport {
    constructor(serverUrl, projectId, authToken, maxSize = 200000) {
        this.maxSize = maxSize;
        this.currSize = 0;
        this.serverUrl = serverUrl;
        this.projectId = projectId;
        this.authToken = authToken;
        this.buffer = [];
    }
    async write(serialisedObject, size) {
        this.buffer.push(serialisedObject);
        this.currSize += size;
        if (this.currSize < this.maxSize)
            return; // return fast
        await this.flush(); // block until we send objects
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        const formData = new FormData();
        const concat = '[' + this.buffer.join(',') + ']';
        formData.append('object-batch', new Blob([concat], { type: 'application/json' }));
        const url = new URL(`/objects/${this.projectId}`, this.serverUrl);
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.authToken}` },
            body: formData
        });
        if (res.status !== 201) {
            throw new Error(`Unexpected error when sending data. Expected status 200, got ${res.status}`);
        }
        this.buffer = [];
        this.currSize = 0;
    }
    dispose() {
        this.buffer = [];
    }
}

/* eslint-disable camelcase */
/**
 * Basic 'Base'-like object from .NET. It will create a 'speckle_type' prop that defaults to the class' name. This can be overriden by providing yourself a 'speckle_type' property in the props argument of the constructor.
 */
class Base {
    constructor(props) {
        this.speckle_type = this.constructor.name;
        for (const key in props)
            this[key] = props[key];
    }
}

/**
 * Decomposes, serializes and sends to a speckle server a given object. Note, for objects to be detached, they need to have a 'speckle_type' property.
 * @param object object to decompose, serialise and send to speckle
 * @param parameters: server url, project id and token
 * @returns the hash of the root object and the value of the root object
 */
const send = async (object, { serverUrl = 'https://app.speckle.systems', projectId, token, logger = console }) => {
    const t0 = performance.now();
    logger === null || logger === void 0 ? void 0 : logger.log('Starting to send');
    const transport = new ServerTransport(serverUrl, projectId, token);
    const serializer = new Serializer(transport);
    let result;
    try {
        result = await serializer.write(object);
    }
    catch (e) {
        logger.error(e);
    }
    finally {
        transport.dispose();
        serializer.dispose();
    }
    const t1 = performance.now();
    logger.log(`Finished sending in ${(t1 - t0) / 1000}s.`);
    return result;
};

export { Base, send };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0c2VuZGVyLndlYi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL1NoYTEudHMiLCIuLi8uLi9zcmMvU2VyaWFsaXplci50cyIsIi4uLy4uL3NyYy90cmFuc3BvcnRzL1NlcnZlclRyYW5zcG9ydC50cyIsIi4uLy4uL3NyYy91dGlscy9CYXNlLnRzIiwiLi4vLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuLyoqXG4gKiBCYXNpYyBoYXNoaW5nIGZ1bmN0aW9uLCB0byBhdm9pZCBkZXBlbmRlbmNpZXMgYW5kIGNyYXp5IGJ1aWxkIHByb2Nlc3Nlc1xuICogQHBhcmFtIG1zZ1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFNIQTEobXNnOiBzdHJpbmcpIHtcbiAgZnVuY3Rpb24gcm90YXRlX2xlZnQobjogbnVtYmVyLCBzOiBudW1iZXIpIHtcbiAgICBjb25zdCB0NCA9IChuIDw8IHMpIHwgKG4gPj4+ICgzMiAtIHMpKVxuICAgIHJldHVybiB0NFxuICB9XG4gIGZ1bmN0aW9uIGN2dF9oZXgodmFsOiBudW1iZXIpIHtcbiAgICBsZXQgc3RyID0gJydcbiAgICBsZXQgaVxuICAgIGxldCB2XG4gICAgZm9yIChpID0gNzsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHYgPSAodmFsID4+PiAoaSAqIDQpKSAmIDB4MGZcbiAgICAgIHN0ciArPSB2LnRvU3RyaW5nKDE2KVxuICAgIH1cbiAgICByZXR1cm4gc3RyXG4gIH1cbiAgZnVuY3Rpb24gVXRmOEVuY29kZShzdHJpbmc6IHN0cmluZykge1xuICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpXG4gICAgbGV0IHV0ZnRleHQgPSAnJ1xuICAgIGZvciAobGV0IG4gPSAwOyBuIDwgc3RyaW5nLmxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBjID0gc3RyaW5nLmNoYXJDb2RlQXQobilcbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjKVxuICAgICAgfSBlbHNlIGlmIChjID4gMTI3ICYmIGMgPCAyMDQ4KSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiA2KSB8IDE5MilcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjID4+IDEyKSB8IDIyNClcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyA+PiA2KSAmIDYzKSB8IDEyOClcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXRmdGV4dFxuICB9XG4gIGxldCBibG9ja3N0YXJ0XG4gIGxldCBpLCBqXG4gIGNvbnN0IFcgPSBuZXcgQXJyYXkoODApXG4gIGxldCBIMCA9IDB4Njc0NTIzMDFcbiAgbGV0IEgxID0gMHhlZmNkYWI4OVxuICBsZXQgSDIgPSAweDk4YmFkY2ZlXG4gIGxldCBIMyA9IDB4MTAzMjU0NzZcbiAgbGV0IEg0ID0gMHhjM2QyZTFmMFxuICBsZXQgQSwgQiwgQywgRCwgRVxuICBsZXQgdGVtcFxuICBtc2cgPSBVdGY4RW5jb2RlKG1zZylcbiAgY29uc3QgbXNnX2xlbiA9IG1zZy5sZW5ndGhcbiAgY29uc3Qgd29yZF9hcnJheSA9IFtdIGFzIHVua25vd25bXVxuICBmb3IgKGkgPSAwOyBpIDwgbXNnX2xlbiAtIDM7IGkgKz0gNCkge1xuICAgIGogPVxuICAgICAgKG1zZy5jaGFyQ29kZUF0KGkpIDw8IDI0KSB8XG4gICAgICAobXNnLmNoYXJDb2RlQXQoaSArIDEpIDw8IDE2KSB8XG4gICAgICAobXNnLmNoYXJDb2RlQXQoaSArIDIpIDw8IDgpIHxcbiAgICAgIG1zZy5jaGFyQ29kZUF0KGkgKyAzKVxuICAgIHdvcmRfYXJyYXkucHVzaChqKVxuICB9XG4gIHN3aXRjaCAobXNnX2xlbiAlIDQpIHtcbiAgICBjYXNlIDA6XG4gICAgICBpID0gMHgwODAwMDAwMDBcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAxOlxuICAgICAgaSA9IChtc2cuY2hhckNvZGVBdChtc2dfbGVuIC0gMSkgPDwgMjQpIHwgMHgwODAwMDAwXG4gICAgICBicmVha1xuICAgIGNhc2UgMjpcbiAgICAgIGkgPVxuICAgICAgICAobXNnLmNoYXJDb2RlQXQobXNnX2xlbiAtIDIpIDw8IDI0KSB8XG4gICAgICAgIChtc2cuY2hhckNvZGVBdChtc2dfbGVuIC0gMSkgPDwgMTYpIHxcbiAgICAgICAgMHgwODAwMFxuICAgICAgYnJlYWtcbiAgICBjYXNlIDM6XG4gICAgICBpID1cbiAgICAgICAgKG1zZy5jaGFyQ29kZUF0KG1zZ19sZW4gLSAzKSA8PCAyNCkgfFxuICAgICAgICAobXNnLmNoYXJDb2RlQXQobXNnX2xlbiAtIDIpIDw8IDE2KSB8XG4gICAgICAgIChtc2cuY2hhckNvZGVBdChtc2dfbGVuIC0gMSkgPDwgOCkgfFxuICAgICAgICAweDgwXG4gICAgICBicmVha1xuICB9XG4gIHdvcmRfYXJyYXkucHVzaChpKVxuICB3aGlsZSAod29yZF9hcnJheS5sZW5ndGggJSAxNiAhPT0gMTQpIHdvcmRfYXJyYXkucHVzaCgwKVxuICB3b3JkX2FycmF5LnB1c2gobXNnX2xlbiA+Pj4gMjkpXG4gIHdvcmRfYXJyYXkucHVzaCgobXNnX2xlbiA8PCAzKSAmIDB4MGZmZmZmZmZmKVxuICBmb3IgKGJsb2Nrc3RhcnQgPSAwOyBibG9ja3N0YXJ0IDwgd29yZF9hcnJheS5sZW5ndGg7IGJsb2Nrc3RhcnQgKz0gMTYpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTY7IGkrKykgV1tpXSA9IHdvcmRfYXJyYXlbYmxvY2tzdGFydCArIGldXG4gICAgZm9yIChpID0gMTY7IGkgPD0gNzk7IGkrKylcbiAgICAgIFdbaV0gPSByb3RhdGVfbGVmdChXW2kgLSAzXSBeIFdbaSAtIDhdIF4gV1tpIC0gMTRdIF4gV1tpIC0gMTZdLCAxKVxuICAgIEEgPSBIMFxuICAgIEIgPSBIMVxuICAgIEMgPSBIMlxuICAgIEQgPSBIM1xuICAgIEUgPSBINFxuICAgIGZvciAoaSA9IDA7IGkgPD0gMTk7IGkrKykge1xuICAgICAgdGVtcCA9XG4gICAgICAgIChyb3RhdGVfbGVmdChBLCA1KSArICgoQiAmIEMpIHwgKH5CICYgRCkpICsgRSArIFdbaV0gKyAweDVhODI3OTk5KSAmIDB4MGZmZmZmZmZmXG4gICAgICBFID0gRFxuICAgICAgRCA9IENcbiAgICAgIEMgPSByb3RhdGVfbGVmdChCLCAzMClcbiAgICAgIEIgPSBBXG4gICAgICBBID0gdGVtcFxuICAgIH1cbiAgICBmb3IgKGkgPSAyMDsgaSA8PSAzOTsgaSsrKSB7XG4gICAgICB0ZW1wID0gKHJvdGF0ZV9sZWZ0KEEsIDUpICsgKEIgXiBDIF4gRCkgKyBFICsgV1tpXSArIDB4NmVkOWViYTEpICYgMHgwZmZmZmZmZmZcbiAgICAgIEUgPSBEXG4gICAgICBEID0gQ1xuICAgICAgQyA9IHJvdGF0ZV9sZWZ0KEIsIDMwKVxuICAgICAgQiA9IEFcbiAgICAgIEEgPSB0ZW1wXG4gICAgfVxuICAgIGZvciAoaSA9IDQwOyBpIDw9IDU5OyBpKyspIHtcbiAgICAgIHRlbXAgPVxuICAgICAgICAocm90YXRlX2xlZnQoQSwgNSkgKyAoKEIgJiBDKSB8IChCICYgRCkgfCAoQyAmIEQpKSArIEUgKyBXW2ldICsgMHg4ZjFiYmNkYykgJlxuICAgICAgICAweDBmZmZmZmZmZlxuICAgICAgRSA9IERcbiAgICAgIEQgPSBDXG4gICAgICBDID0gcm90YXRlX2xlZnQoQiwgMzApXG4gICAgICBCID0gQVxuICAgICAgQSA9IHRlbXBcbiAgICB9XG4gICAgZm9yIChpID0gNjA7IGkgPD0gNzk7IGkrKykge1xuICAgICAgdGVtcCA9IChyb3RhdGVfbGVmdChBLCA1KSArIChCIF4gQyBeIEQpICsgRSArIFdbaV0gKyAweGNhNjJjMWQ2KSAmIDB4MGZmZmZmZmZmXG4gICAgICBFID0gRFxuICAgICAgRCA9IENcbiAgICAgIEMgPSByb3RhdGVfbGVmdChCLCAzMClcbiAgICAgIEIgPSBBXG4gICAgICBBID0gdGVtcFxuICAgIH1cbiAgICBIMCA9IChIMCArIEEpICYgMHgwZmZmZmZmZmZcbiAgICBIMSA9IChIMSArIEIpICYgMHgwZmZmZmZmZmZcbiAgICBIMiA9IChIMiArIEMpICYgMHgwZmZmZmZmZmZcbiAgICBIMyA9IChIMyArIEQpICYgMHgwZmZmZmZmZmZcbiAgICBINCA9IChINCArIEUpICYgMHgwZmZmZmZmZmZcbiAgfVxuICBjb25zdCBoID0gY3Z0X2hleChIMCkgKyBjdnRfaGV4KEgxKSArIGN2dF9oZXgoSDIpICsgY3Z0X2hleChIMykgKyBjdnRfaGV4KEg0KVxuICByZXR1cm4gaC50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygwLCAzMilcbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuaW1wb3J0IHsgU0hBMSB9IGZyb20gJy4vdXRpbHMvU2hhMSdcbmltcG9ydCB7IElUcmFuc3BvcnQgfSBmcm9tICcuL3RyYW5zcG9ydHMvSVRyYW5zcG9ydCdcbmltcG9ydCB7IEJhc2UgfSBmcm9tICcuL3V0aWxzL0Jhc2UnXG5pbXBvcnQgeyBJRGlzcG9zYWJsZSB9IGZyb20gJy4vdXRpbHMvSURpc3Bvc2FibGUnXG5cbmV4cG9ydCBjbGFzcyBTZXJpYWxpemVyIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xuICBjaHVua1NpemU6IG51bWJlclxuICBkZXRhY2hMaW5lYWdlOiBib29sZWFuW11cbiAgbGluZWFnZTogc3RyaW5nW11cbiAgZmFtaWx5VHJlZTogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyPj5cbiAgY2xvc3VyZVRhYmxlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICB0cmFuc3BvcnQ6IElUcmFuc3BvcnQgfCBudWxsXG4gIHVuaXF1ZUlkOiBudW1iZXJcbiAgaGFzaGluZ0Z1bmN0aW9uOiAoczogc3RyaW5nKSA9PiBzdHJpbmdcblxuICBjb25zdHJ1Y3RvcihcbiAgICB0cmFuc3BvcnQ6IElUcmFuc3BvcnQsXG4gICAgY2h1bmtTaXplOiBudW1iZXIgPSAxMDAwLFxuICAgIGhhc2hpbmdGdW5jdGlvbjogKHM6IHN0cmluZykgPT4gc3RyaW5nID0gU0hBMVxuICApIHtcbiAgICB0aGlzLmNodW5rU2l6ZSA9IGNodW5rU2l6ZVxuICAgIHRoaXMuZGV0YWNoTGluZWFnZSA9IFt0cnVlXSAvLyBmaXJzdCBldmVyIGNhbGwgaXMgYWx3YXlzIGRldGFjaGVkXG4gICAgdGhpcy5saW5lYWdlID0gW11cbiAgICB0aGlzLmZhbWlseVRyZWUgPSB7fVxuICAgIHRoaXMuY2xvc3VyZVRhYmxlID0ge31cbiAgICB0aGlzLnRyYW5zcG9ydCA9IHRyYW5zcG9ydFxuICAgIHRoaXMudW5pcXVlSWQgPSAwXG4gICAgdGhpcy5oYXNoaW5nRnVuY3Rpb24gPSBoYXNoaW5nRnVuY3Rpb24gfHwgU0hBMVxuICB9XG5cbiAgYXN5bmMgd3JpdGUob2JqOiBCYXNlKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3RyYXZlcnNlKG9iaiwgdHJ1ZSlcbiAgfVxuXG4gIGFzeW5jICN0cmF2ZXJzZShvYmo6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCByb290OiBib29sZWFuKSB7XG4gICAgY29uc3QgdGVtcG9yYXJ5SWQgPSBgJHt0aGlzLnVuaXF1ZUlkKyt9LW9iamBcbiAgICB0aGlzLmxpbmVhZ2UucHVzaCh0ZW1wb3JhcnlJZClcblxuICAgIGNvbnN0IHRyYXZlcnNlZCA9IHsgc3BlY2tsZV90eXBlOiBvYmouc3BlY2tsZV90eXBlIHx8ICdCYXNlJyB9IGFzIFJlY29yZDxcbiAgICAgIHN0cmluZyxcbiAgICAgIHVua25vd25cbiAgICA+XG5cbiAgICBmb3IgKGNvbnN0IHByb3BLZXkgaW4gb2JqKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9ialtwcm9wS2V5XVxuICAgICAgLy8gMC4gc2tpcCBzb21lIHByb3BzXG4gICAgICBpZiAoIXZhbHVlIHx8IHByb3BLZXkgPT09ICdpZCcgfHwgcHJvcEtleS5zdGFydHNXaXRoKCdfJykpIGNvbnRpbnVlXG5cbiAgICAgIC8vIDEuIHByaW1pdGl2ZXMgKG51bWJlcnMsIGJvb2xzLCBzdHJpbmdzKVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgdHJhdmVyc2VkW3Byb3BLZXldID0gdmFsdWVcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNEZXRhY2hlZFByb3AgPSBwcm9wS2V5LnN0YXJ0c1dpdGgoJ0AnKVxuXG4gICAgICAvLyAyLiBjaHVua2VkIGFycmF5c1xuICAgICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkodmFsdWUpXG4gICAgICBjb25zdCBpc0NodW5rZWQgPSBpc0FycmF5ID8gcHJvcEtleS5tYXRjaCgvXkBcXCgoXFxkKilcXCkvKSA6IGZhbHNlIC8vIGNodW5rIHN5bnRheFxuICAgICAgaWYgKGlzQXJyYXkgJiYgaXNDaHVua2VkICYmIHZhbHVlLmxlbmd0aCAhPT0gMCAmJiB0eXBlb2YgdmFsdWVbMF0gIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IGNodW5rU2l6ZSA9IGlzQ2h1bmtlZFsxXSAhPT0gJycgPyBwYXJzZUludChpc0NodW5rZWRbMV0pIDogdGhpcy5jaHVua1NpemVcbiAgICAgICAgY29uc3QgY2h1bmtSZWZzID0gW11cblxuICAgICAgICBsZXQgY2h1bmsgPSBuZXcgRGF0YUNodW5rKClcbiAgICAgICAgbGV0IGNvdW50ID0gMFxuICAgICAgICBmb3IgKGNvbnN0IGVsIG9mIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKGNvdW50ID09PSBjaHVua1NpemUpIHtcbiAgICAgICAgICAgIGNodW5rUmVmcy5wdXNoKGF3YWl0IHRoaXMuI2hhbmRsZUNodW5rKGNodW5rKSlcbiAgICAgICAgICAgIGNodW5rID0gbmV3IERhdGFDaHVuaygpXG4gICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICB9XG4gICAgICAgICAgY2h1bmsuZGF0YS5wdXNoKGVsKVxuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaHVuay5kYXRhLmxlbmd0aCAhPT0gMCkgY2h1bmtSZWZzLnB1c2goYXdhaXQgdGhpcy4jaGFuZGxlQ2h1bmsoY2h1bmspKVxuICAgICAgICB0cmF2ZXJzZWRbcHJvcEtleS5yZXBsYWNlKGlzQ2h1bmtlZFswXSwgJycpXSA9IGNodW5rUmVmcyAvLyBzdHJpcCBjaHVuayBzeW50YXhcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMy4gc3BlY2tsZSBvYmplY3RzXG4gICAgICBpZiAoKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5zcGVja2xlX3R5cGUpIHtcbiAgICAgICAgY29uc3QgY2hpbGQgPSAoYXdhaXQgdGhpcy4jdHJhdmVyc2VWYWx1ZSh7XG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgaXNEZXRhY2hlZDogaXNEZXRhY2hlZFByb3BcbiAgICAgICAgfSkpIGFzIHtcbiAgICAgICAgICBpZDogc3RyaW5nXG4gICAgICAgIH1cbiAgICAgICAgdHJhdmVyc2VkW3Byb3BLZXldID0gaXNEZXRhY2hlZFByb3AgPyBhd2FpdCB0aGlzLiNkZXRhY2hIZWxwZXIoY2hpbGQuaWQpIDogY2hpbGRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gNC4gb3RoZXIgb2JqZWN0cyAoZGljdHMvbWFwcywgbGlzdHMpXG4gICAgICB0cmF2ZXJzZWRbcHJvcEtleV0gPSBhd2FpdCB0aGlzLiN0cmF2ZXJzZVZhbHVlKHtcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGlzRGV0YWNoZWQ6IGlzRGV0YWNoZWRQcm9wXG4gICAgICB9KVxuICAgIH1cbiAgICAvLyBXZSd2ZSBmaW5pc2hlZCBnb2luZyB0aHJvdWdoIGFsbCB0aGUgcHJvcGVydGllcyBvZiB0aGlzIG9iamVjdCwgbm93IGxldCdzIHBlcmZvcm0gdGhlIGxhc3Qgcml0ZXNcbiAgICBjb25zdCBkZXRhY2hlZCA9IHRoaXMuZGV0YWNoTGluZWFnZS5wb3AoKVxuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubGluZWFnZS5wb3AoKSBhcyBzdHJpbmdcblxuICAgIGlmICh0aGlzLmZhbWlseVRyZWVbcGFyZW50XSkge1xuICAgICAgY29uc3QgY2xvc3VyZSA9IHt9IGFzIFJlY29yZDxzdHJpbmcsIG51bWJlcj5cblxuICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5mYW1pbHlUcmVlW3BhcmVudF0pLmZvckVhY2goKFtyZWYsIGRlcHRoXSkgPT4ge1xuICAgICAgICBjbG9zdXJlW3JlZl0gPSBkZXB0aCAtIHRoaXMuZGV0YWNoTGluZWFnZS5sZW5ndGhcbiAgICAgIH0pXG5cbiAgICAgIHRyYXZlcnNlZFsndG90YWxDaGlsZHJlbkNvdW50J10gPSBPYmplY3Qua2V5cyhjbG9zdXJlKS5sZW5ndGhcblxuICAgICAgaWYgKHRyYXZlcnNlZFsndG90YWxDaGlsZHJlbkNvdW50J10pIHtcbiAgICAgICAgdHJhdmVyc2VkWydfX2Nsb3N1cmUnXSA9IGNsb3N1cmVcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB7IGhhc2gsIHNlcmlhbGl6ZWRPYmplY3QsIHNpemUgfSA9IHRoaXMuI2dlbmVyYXRlSWQodHJhdmVyc2VkKVxuICAgIHRyYXZlcnNlZC5pZCA9IGhhc2hcblxuICAgIC8vIFBvcCBpdCBpblxuICAgIGlmICgoZGV0YWNoZWQgfHwgcm9vdCkgJiYgdGhpcy50cmFuc3BvcnQpIHtcbiAgICAgIGF3YWl0IHRoaXMudHJhbnNwb3J0LndyaXRlKHNlcmlhbGl6ZWRPYmplY3QsIHNpemUpXG4gICAgfVxuXG4gICAgLy8gV2UndmUgcmVhY2hlZCB0aGUgZW5kLCBsZXQncyBmbHVzaFxuICAgIGlmIChyb290ICYmIHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICBhd2FpdCB0aGlzLnRyYW5zcG9ydC5mbHVzaCgpXG4gICAgfVxuXG4gICAgcmV0dXJuIHsgaGFzaCwgdHJhdmVyc2VkIH1cbiAgfVxuXG4gIGFzeW5jICN0cmF2ZXJzZVZhbHVlKHtcbiAgICB2YWx1ZSxcbiAgICBpc0RldGFjaGVkID0gZmFsc2VcbiAgfToge1xuICAgIHZhbHVlOiB1bmtub3duXG4gICAgaXNEZXRhY2hlZD86IGJvb2xlYW5cbiAgfSk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgIC8vIDEuIHByaW1pdGl2ZXNcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIHZhbHVlXG5cbiAgICAvLyAyLiBhcnJheXNcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGNvbnN0IGFyciA9IHZhbHVlIGFzIHVua25vd25bXVxuICAgICAgLy8gMi4xIGVtcHR5IGFycmF5c1xuICAgICAgaWYgKGFyci5sZW5ndGggPT09IDApIHJldHVybiB2YWx1ZVxuXG4gICAgICAvLyAyLjIgcHJpbWl0aXZlIGFycmF5c1xuICAgICAgaWYgKHR5cGVvZiBhcnJbMF0gIT09ICdvYmplY3QnKSByZXR1cm4gYXJyXG5cbiAgICAgIC8vIDIuMy4gbm9uLXByaW1pdGl2ZSBub24tZGV0YWNoZWQgYXJyYXlzXG4gICAgICBpZiAoIWlzRGV0YWNoZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgIHZhbHVlLm1hcChhc3luYyAoZWwpID0+IGF3YWl0IHRoaXMuI3RyYXZlcnNlVmFsdWUoeyB2YWx1ZTogZWwgfSkpXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgLy8gMi40IG5vbi1wcmltaXRpdmUgZGV0YWNoZWQgYXJyYXlzXG4gICAgICBjb25zdCBkZXRhY2hlZExpc3QgPSBbXSBhcyB1bmtub3duW11cbiAgICAgIGZvciAoY29uc3QgZWwgb2YgdmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PT0gJ29iamVjdCcgJiYgZWwuc3BlY2tsZV90eXBlKSB7XG4gICAgICAgICAgdGhpcy5kZXRhY2hMaW5lYWdlLnB1c2goaXNEZXRhY2hlZClcbiAgICAgICAgICBjb25zdCB7IGhhc2ggfSA9IGF3YWl0IHRoaXMuI3RyYXZlcnNlKGVsLCBmYWxzZSlcbiAgICAgICAgICBkZXRhY2hlZExpc3QucHVzaCh0aGlzLiNkZXRhY2hIZWxwZXIoaGFzaCkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGV0YWNoZWRMaXN0LnB1c2goYXdhaXQgdGhpcy4jdHJhdmVyc2VWYWx1ZSh7IHZhbHVlOiBlbCwgaXNEZXRhY2hlZCB9KSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFjaGVkTGlzdFxuICAgIH1cblxuICAgIC8vIDMuIGRpY3RzXG4gICAgaWYgKCEodmFsdWUgYXMgeyBzcGVja2xlX3R5cGU/OiBzdHJpbmcgfSkuc3BlY2tsZV90eXBlKSByZXR1cm4gdmFsdWVcblxuICAgIC8vIDQuIGJhc2Ugb2JqZWN0c1xuICAgIGlmICgodmFsdWUgYXMgeyBzcGVja2xlX3R5cGU/OiBzdHJpbmcgfSkuc3BlY2tsZV90eXBlKSB7XG4gICAgICB0aGlzLmRldGFjaExpbmVhZ2UucHVzaChpc0RldGFjaGVkKVxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jdHJhdmVyc2UodmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIGZhbHNlKVxuICAgICAgcmV0dXJuIGF3YWl0IHJlcy50cmF2ZXJzZWRcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHR5cGUgJyR7dHlwZW9mIHZhbHVlfSc6ICR7dmFsdWV9LmApXG4gIH1cblxuICAjZGV0YWNoSGVscGVyKHJlZkhhc2g6IHN0cmluZykge1xuICAgIHRoaXMubGluZWFnZS5mb3JFYWNoKChwYXJlbnQpID0+IHtcbiAgICAgIGlmICghdGhpcy5mYW1pbHlUcmVlW3BhcmVudF0pIHRoaXMuZmFtaWx5VHJlZVtwYXJlbnRdID0ge31cblxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5mYW1pbHlUcmVlW3BhcmVudF1bcmVmSGFzaF0gfHxcbiAgICAgICAgdGhpcy5mYW1pbHlUcmVlW3BhcmVudF1bcmVmSGFzaF0gPiB0aGlzLmRldGFjaExpbmVhZ2UubGVuZ3RoXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5mYW1pbHlUcmVlW3BhcmVudF1bcmVmSGFzaF0gPSB0aGlzLmRldGFjaExpbmVhZ2UubGVuZ3RoXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4ge1xuICAgICAgcmVmZXJlbmNlZElkOiByZWZIYXNoLFxuICAgICAgc3BlY2tsZV90eXBlOiAncmVmZXJlbmNlJ1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jICNoYW5kbGVDaHVuayhjaHVuazogRGF0YUNodW5rKSB7XG4gICAgdGhpcy5kZXRhY2hMaW5lYWdlLnB1c2godHJ1ZSlcbiAgICBjb25zdCB7IGhhc2ggfSA9IGF3YWl0IHRoaXMuI3RyYXZlcnNlKFxuICAgICAgY2h1bmsgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIGZhbHNlXG4gICAgKVxuICAgIHJldHVybiB0aGlzLiNkZXRhY2hIZWxwZXIoaGFzaClcbiAgfVxuXG4gICNnZW5lcmF0ZUlkKG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBjb25zdCBzID0gSlNPTi5zdHJpbmdpZnkob2JqKVxuICAgIGNvbnN0IGggPSB0aGlzLmhhc2hpbmdGdW5jdGlvbihzKVxuICAgIGNvbnN0IGYgPSBzLnN1YnN0cmluZygwLCAxKSArIGBcImlkXCI6XCIke2h9XCIsYCArIHMuc3Vic3RyaW5nKDEpXG4gICAgcmV0dXJuIHtcbiAgICAgIGhhc2g6IFNIQTEocyksXG4gICAgICBzZXJpYWxpemVkT2JqZWN0OiBmLFxuICAgICAgc2l6ZTogcy5sZW5ndGggLy8gYXBwcm94LCBnb29kIGVub3VnaCBhcyB3ZSdyZSBqdXN0IGxpbWl0aW5nIGFydGlmaWNpYWxseSBiYXRjaCBzaXplcyBiYXNlZCBvbiB0aGlzXG4gICAgfVxuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmRldGFjaExpbmVhZ2UgPSBbXVxuICAgIHRoaXMubGluZWFnZSA9IFtdXG4gICAgdGhpcy5mYW1pbHlUcmVlID0ge31cbiAgICB0aGlzLmNsb3N1cmVUYWJsZSA9IHt9XG4gICAgdGhpcy50cmFuc3BvcnQgPSBudWxsXG4gIH1cbn1cblxuY2xhc3MgRGF0YUNodW5rIHtcbiAgc3BlY2tsZV90eXBlOiAnU3BlY2tsZS5Db3JlLk1vZGVscy5EYXRhQ2h1bmsnXG4gIGRhdGE6IHVua25vd25bXVxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmRhdGEgPSBbXVxuICAgIHRoaXMuc3BlY2tsZV90eXBlID0gJ1NwZWNrbGUuQ29yZS5Nb2RlbHMuRGF0YUNodW5rJ1xuICB9XG59XG4iLCJpbXBvcnQgeyBJVHJhbnNwb3J0IH0gZnJvbSAnLi9JVHJhbnNwb3J0J1xuaW1wb3J0IHsgSURpc3Bvc2FibGUgfSBmcm9tICcuLi91dGlscy9JRGlzcG9zYWJsZSdcbi8qKlxuICogQmFzaWMgb2JqZWN0IHNlbmRlciB0byBhIHNwZWNrbGUgc2VydmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJUcmFuc3BvcnQgaW1wbGVtZW50cyBJVHJhbnNwb3J0LCBJRGlzcG9zYWJsZSB7XG4gIGJ1ZmZlcjogc3RyaW5nW11cbiAgbWF4U2l6ZTogbnVtYmVyXG4gIGN1cnJTaXplOiBudW1iZXJcbiAgc2VydmVyVXJsOiBzdHJpbmdcbiAgcHJvamVjdElkOiBzdHJpbmdcbiAgYXV0aFRva2VuOiBzdHJpbmdcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzZXJ2ZXJVcmw6IHN0cmluZyxcbiAgICBwcm9qZWN0SWQ6IHN0cmluZyxcbiAgICBhdXRoVG9rZW46IHN0cmluZyxcbiAgICBtYXhTaXplOiBudW1iZXIgPSAyMDBfMDAwXG4gICkge1xuICAgIHRoaXMubWF4U2l6ZSA9IG1heFNpemVcbiAgICB0aGlzLmN1cnJTaXplID0gMFxuICAgIHRoaXMuc2VydmVyVXJsID0gc2VydmVyVXJsXG4gICAgdGhpcy5wcm9qZWN0SWQgPSBwcm9qZWN0SWRcbiAgICB0aGlzLmF1dGhUb2tlbiA9IGF1dGhUb2tlblxuICAgIHRoaXMuYnVmZmVyID0gW11cbiAgfVxuXG4gIGFzeW5jIHdyaXRlKHNlcmlhbGlzZWRPYmplY3Q6IHN0cmluZywgc2l6ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5idWZmZXIucHVzaChzZXJpYWxpc2VkT2JqZWN0KVxuICAgIHRoaXMuY3VyclNpemUgKz0gc2l6ZVxuICAgIGlmICh0aGlzLmN1cnJTaXplIDwgdGhpcy5tYXhTaXplKSByZXR1cm4gLy8gcmV0dXJuIGZhc3RcbiAgICBhd2FpdCB0aGlzLmZsdXNoKCkgLy8gYmxvY2sgdW50aWwgd2Ugc2VuZCBvYmplY3RzXG4gIH1cblxuICBhc3luYyBmbHVzaCgpIHtcbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKClcbiAgICBjb25zdCBjb25jYXQgPSAnWycgKyB0aGlzLmJ1ZmZlci5qb2luKCcsJykgKyAnXSdcbiAgICBmb3JtRGF0YS5hcHBlbmQoJ29iamVjdC1iYXRjaCcsIG5ldyBCbG9iKFtjb25jYXRdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyB9KSlcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGAvb2JqZWN0cy8ke3RoaXMucHJvamVjdElkfWAsIHRoaXMuc2VydmVyVXJsKVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0aGlzLmF1dGhUb2tlbn1gIH0sXG4gICAgICBib2R5OiBmb3JtRGF0YVxuICAgIH0pXG5cbiAgICBpZiAocmVzLnN0YXR1cyAhPT0gMjAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBVbmV4cGVjdGVkIGVycm9yIHdoZW4gc2VuZGluZyBkYXRhLiBFeHBlY3RlZCBzdGF0dXMgMjAwLCBnb3QgJHtyZXMuc3RhdHVzfWBcbiAgICAgIClcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciA9IFtdXG4gICAgdGhpcy5jdXJyU2l6ZSA9IDBcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5idWZmZXIgPSBbXVxuICB9XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbi8qKlxuICogQmFzaWMgJ0Jhc2UnLWxpa2Ugb2JqZWN0IGZyb20gLk5FVC4gSXQgd2lsbCBjcmVhdGUgYSAnc3BlY2tsZV90eXBlJyBwcm9wIHRoYXQgZGVmYXVsdHMgdG8gdGhlIGNsYXNzJyBuYW1lLiBUaGlzIGNhbiBiZSBvdmVycmlkZW4gYnkgcHJvdmlkaW5nIHlvdXJzZWxmIGEgJ3NwZWNrbGVfdHlwZScgcHJvcGVydHkgaW4gdGhlIHByb3BzIGFyZ3VtZW50IG9mIHRoZSBjb25zdHJ1Y3Rvci5cbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2UgaW1wbGVtZW50cyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIHNwZWNrbGVfdHlwZTogc3RyaW5nXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIHRoaXMuc3BlY2tsZV90eXBlID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcHMpIHRoaXNba2V5XSA9IHByb3BzW2tleV1cbiAgfVxuICBbeDogc3RyaW5nXTogdW5rbm93blxufVxuIiwiaW1wb3J0IHsgU2VyaWFsaXplciB9IGZyb20gJy4vU2VyaWFsaXplcidcbmltcG9ydCB7IFNlcnZlclRyYW5zcG9ydCB9IGZyb20gJy4vdHJhbnNwb3J0cy9TZXJ2ZXJUcmFuc3BvcnQnXG5pbXBvcnQgeyBCYXNlIH0gZnJvbSAnLi91dGlscy9CYXNlJ1xuXG5leHBvcnQgdHlwZSBTZW5kUGFyYW1zID0ge1xuICBzZXJ2ZXJVcmw/OiBzdHJpbmdcbiAgcHJvamVjdElkOiBzdHJpbmdcbiAgdG9rZW46IHN0cmluZ1xuICBsb2dnZXI/OiB7XG4gICAgbG9nOiAobWVzc2FnZTogdW5rbm93bikgPT4gdm9pZFxuICAgIGVycm9yOiAobWVzc2FnZTogdW5rbm93bikgPT4gdm9pZFxuICB9XG59XG5cbmV4cG9ydCB0eXBlIFNlbmRSZXN1bHQgPSB7XG4gIGhhc2g6IHN0cmluZ1xuICB0cmF2ZXJzZWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG59XG5cbi8qKlxuICogRGVjb21wb3Nlcywgc2VyaWFsaXplcyBhbmQgc2VuZHMgdG8gYSBzcGVja2xlIHNlcnZlciBhIGdpdmVuIG9iamVjdC4gTm90ZSwgZm9yIG9iamVjdHMgdG8gYmUgZGV0YWNoZWQsIHRoZXkgbmVlZCB0byBoYXZlIGEgJ3NwZWNrbGVfdHlwZScgcHJvcGVydHkuXG4gKiBAcGFyYW0gb2JqZWN0IG9iamVjdCB0byBkZWNvbXBvc2UsIHNlcmlhbGlzZSBhbmQgc2VuZCB0byBzcGVja2xlXG4gKiBAcGFyYW0gcGFyYW1ldGVyczogc2VydmVyIHVybCwgcHJvamVjdCBpZCBhbmQgdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBoYXNoIG9mIHRoZSByb290IG9iamVjdCBhbmQgdGhlIHZhbHVlIG9mIHRoZSByb290IG9iamVjdFxuICovXG5jb25zdCBzZW5kID0gYXN5bmMgKFxuICBvYmplY3Q6IEJhc2UsXG4gIHtcbiAgICBzZXJ2ZXJVcmwgPSAnaHR0cHM6Ly9hcHAuc3BlY2tsZS5zeXN0ZW1zJyxcbiAgICBwcm9qZWN0SWQsXG4gICAgdG9rZW4sXG4gICAgbG9nZ2VyID0gY29uc29sZVxuICB9OiBTZW5kUGFyYW1zXG4pID0+IHtcbiAgY29uc3QgdDAgPSBwZXJmb3JtYW5jZS5ub3coKVxuICBsb2dnZXI/LmxvZygnU3RhcnRpbmcgdG8gc2VuZCcpXG4gIGNvbnN0IHRyYW5zcG9ydCA9IG5ldyBTZXJ2ZXJUcmFuc3BvcnQoc2VydmVyVXJsLCBwcm9qZWN0SWQsIHRva2VuKVxuICBjb25zdCBzZXJpYWxpemVyID0gbmV3IFNlcmlhbGl6ZXIodHJhbnNwb3J0KVxuXG4gIGxldCByZXN1bHQ6IFNlbmRSZXN1bHQgfCB1bmRlZmluZWRcbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBhd2FpdCBzZXJpYWxpemVyLndyaXRlKG9iamVjdClcbiAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgIGxvZ2dlci5lcnJvcihlKVxuICB9IGZpbmFsbHkge1xuICAgIHRyYW5zcG9ydC5kaXNwb3NlKClcbiAgICBzZXJpYWxpemVyLmRpc3Bvc2UoKVxuICB9XG4gIGNvbnN0IHQxID0gcGVyZm9ybWFuY2Uubm93KClcbiAgbG9nZ2VyLmxvZyhgRmluaXNoZWQgc2VuZGluZyBpbiAkeyh0MSAtIHQwKSAvIDEwMDB9cy5gKVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCB7IEJhc2UsIHNlbmQgfVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7Ozs7QUFJRztBQUNHLFNBQVUsSUFBSSxDQUFDLEdBQVcsRUFBQTtBQUM5QixJQUFBLFNBQVMsV0FBVyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUE7QUFDdkMsUUFBQSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3RDLFFBQUEsT0FBTyxFQUFFLENBQUE7S0FDVjtJQUNELFNBQVMsT0FBTyxDQUFDLEdBQVcsRUFBQTtRQUMxQixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUE7QUFDWixRQUFBLElBQUksQ0FBQyxDQUFBO0FBQ0wsUUFBQSxJQUFJLENBQUMsQ0FBQTtRQUNMLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3ZCLFlBQUEsQ0FBQyxHQUFHLENBQUMsR0FBRyxN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LElBQUEsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDL0IsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksV0FBVyxDQUFDLENBQUE7QUFDN0MsSUFBQSxLQUFLLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRTtRQUNyRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMxRCxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDdkIsWUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDcEUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUNOLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDTixDQUFDLEdBQUcsRUFBRSxDQUFBO1FBQ04sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUNOLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4QixJQUFJO0FBQ0YsZ0JBQUEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxJQUFJLFdBQVcsQ0FBQTtZQUNsRixDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ0wsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNMLFlBQUEsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDdEIsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNMLENBQUMsR0FBRyxJQUFJLENBQUE7QUFDVCxTQUFBO1FBQ0QsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDekIsWUFBQSxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLElBQUksV0FBVyxDQUFBO1lBQzlFLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDTCxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ0wsWUFBQSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUN0QixDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ0wsQ0FBQyxHQUFHLElBQUksQ0FBQTtBQUNULFNBQUE7UUFDRCxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QixJQUFJO0FBQ0YsZ0JBQUEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVO0FBQzFFLG9CQUFBLFdBQVcsQ0FBQTtZQUNiLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDTCxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ0wsWUFBQSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUN0QixDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ0wsQ0FBQyxHQUFHLElBQUksQ0FBQTtBQUNULFNBQUE7UUFDRCxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN6QixZQUFBLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsSUFBSSxXQUFXLENBQUE7WUFDOUUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNMLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDTCxZQUFBLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3RCLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDTCxDQUFDLEdBQUcsSUFBSSxDQUFBO0FBQ1QsU0FBQTtRQUNELEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFBO1FBQzNCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFBO1FBQzNCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFBO1FBQzNCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFBO1FBQzNCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFBO0FBQzVCLEtBQUE7SUFDRCxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsRUFB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
