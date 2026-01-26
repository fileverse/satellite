import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { Transform, type Readable } from 'node:stream';

export type DecryptionOptions = {
    key: string;
    iv: string;
    authTag: string;
};

type Bytes = Uint8Array | Buffer;

const AUTH_TAG_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

function asBuffer(input: string | Bytes) {
    if (typeof input === 'string') return Buffer.from(input, 'base64');
    return Buffer.isBuffer(input) ? input : Buffer.from(input);
}

function toBase64(input: Bytes) {
    return (Buffer.isBuffer(input) ? input : Buffer.from(input)).toString('base64');
}

function assertByteLength(name: string, buf: Buffer, expected: number) {
    if (buf.length !== expected) throw new Error(`${name} must be ${expected} bytes`);
}

export function generatePenumbraKey() {
    return randomBytes(KEY_LENGTH_BYTES).toString('base64');
}

export function generatePenumbraIv() {
    return randomBytes(IV_LENGTH_BYTES).toString('base64');
}

export function encryptBytesPenumbraCompatible(
    plaintext: Bytes,
) {
    const key = asBuffer(randomBytes(KEY_LENGTH_BYTES));
    const iv = asBuffer(randomBytes(IV_LENGTH_BYTES));
    assertByteLength('key', key, KEY_LENGTH_BYTES);
    assertByteLength('iv', iv, IV_LENGTH_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES });
    const ciphertext = Buffer.concat([cipher.update(asBuffer(plaintext)), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        ciphertext: new Uint8Array(ciphertext),
        decryptionOptions: { key: toBase64(key), iv: toBase64(iv), authTag: toBase64(authTag) } satisfies DecryptionOptions,
    };
}

export function decryptBytes(ciphertext: Bytes, options: DecryptionOptions) {
    const key = asBuffer(options.key);
    const iv = asBuffer(options.iv);
    const authTag = asBuffer(options.authTag);
    assertByteLength('key', key, KEY_LENGTH_BYTES);
    assertByteLength('iv', iv, IV_LENGTH_BYTES);
    assertByteLength('authTag', authTag, AUTH_TAG_LENGTH_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES });
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(asBuffer(ciphertext)), decipher.final()]);
    return new Uint8Array(plaintext);
}

export function createEncryptionStream() {
    const key = asBuffer(randomBytes(KEY_LENGTH_BYTES));
    const iv = asBuffer(randomBytes(IV_LENGTH_BYTES));
    assertByteLength('key', key, KEY_LENGTH_BYTES);
    assertByteLength('iv', iv, IV_LENGTH_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES });
    let resolve!: (value: DecryptionOptions) => void;
    let reject!: (reason?: unknown) => void;
    const decryptionOptions = new Promise<DecryptionOptions>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    const stream = new Transform({
        transform(chunk, _enc, cb) {
            try {
                cb(null, cipher.update(chunk));
            } catch (err) {
                reject(err);
                cb(err as Error);
            }
        },
        flush(cb) {
            try {
                const final = cipher.final();
                if (final.length) this.push(final);
                const authTag = cipher.getAuthTag();
                resolve({ key: toBase64(key), iv: toBase64(iv), authTag: toBase64(authTag) });
                cb();
            } catch (err) {
                reject(err);
                cb(err as Error);
            }
        },
    });

    return { stream, decryptionOptions };
}

export function createDecryptionStream(options: DecryptionOptions) {
    const key = asBuffer(options.key);
    const iv = asBuffer(options.iv);
    const authTag = asBuffer(options.authTag);
    assertByteLength('key', key, KEY_LENGTH_BYTES);
    assertByteLength('iv', iv, IV_LENGTH_BYTES);
    assertByteLength('authTag', authTag, AUTH_TAG_LENGTH_BYTES);

    const decipher = createDecipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH_BYTES });
    decipher.setAuthTag(authTag);

    return new Transform({
        transform(chunk, _enc, cb) {
            try {
                cb(null, decipher.update(chunk));
            } catch (err) {
                cb(err as Error);
            }
        },
        flush(cb) {
            try {
                const final = decipher.final();
                if (final.length) this.push(final);
                cb();
            } catch (err) {
                cb(err as Error);
            }
        },
    });
}

export function encryptReadable(readable: Readable) {
    const { stream, decryptionOptions } = createEncryptionStream();
    return { stream: readable.pipe(stream), decryptionOptions };
}

export function decryptReadable(readable: Readable, options: DecryptionOptions) {
    return readable.pipe(createDecryptionStream(options));
}
