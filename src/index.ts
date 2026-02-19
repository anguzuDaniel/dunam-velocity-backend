import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, './proto/trading.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const dunamProto = grpc.loadPackageDefinition(packageDefinition) as any;

const server = new grpc.Server();

server.addService(dunamProto.dunam.TradingService.service, {
    PlaceOrder: (call: any, callback: any) => {
        const { symbol, type, volume } = call.request;
        console.log(`Dunam Velocity: Executing ${type} on ${symbol} [Vol: ${volume}]`);
        
        callback(null, { success: true, message: "Order placed", ticket_id: "12345" });
    },

    StreamTicks: (call: any) => {
        console.log(`Starting stream for: ${call.request.symbol}`);
        // High-frequency tick logic goes here
    }
});

const port = "50051";
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        console.error(`Server error: ${err.message}`);
        return;
    }
    console.log(`Dunam Velocity Backend running on port: ${port}`);
});