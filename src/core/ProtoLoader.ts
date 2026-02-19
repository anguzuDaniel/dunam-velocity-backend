import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure this path points correctly to your trading.proto file
const PROTO_PATH = join(__dirname, '../proto/trading.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

/**
 * The loaded Dunam Proto object.
 * When importing in ESM, remember to use: import { dunamProto } from './core/ProtoLoader.js';
 */
export const dunamProto = grpc.loadPackageDefinition(packageDefinition) as any;