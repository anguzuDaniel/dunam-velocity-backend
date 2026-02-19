import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

const PROTO_PATH = join(__dirname, '../proto/trading.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const tradingProto = grpc.loadPackageDefinition(packageDefinition) as any;

export class MT5Client {
    private client: any;

    constructor() {
        this.client = new tradingProto.TradingService(
            process.env.MT5_BRIDGE_URL || 'localhost:50051',
            grpc.credentials.createInsecure()
        );
    }

    // High-velocity order execution
    async placeOrder(symbol: string, type: 'BUY' | 'SELL', volume: number) {
        return new Promise((resolve, reject) => {
            this.client.PlaceOrder({ symbol, type, volume }, (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
    }
}