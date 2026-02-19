import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROTO_PATH = join(__dirname, '../proto/trading.proto');

export class MT5Service {
    private client: any;

    constructor() {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
        });
        const dunamProto = grpc.loadPackageDefinition(packageDefinition) as any;
        
        // Connect to the Windows Bridge defined in your .env
        this.client = new dunamProto.dunam.TradingService(
            CONFIG.MT5_URL,
            grpc.credentials.createInsecure()
        );
    }

    /**
     * Sends a Buy or Sell request to MT5
     */
    public async sendOrder(symbol: string, type: 'BUY' | 'SELL', volume: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = { symbol, type, volume };

            this.client.PlaceOrder(request, (error: any, response: any) => {
                if (error) {
                    console.error(`❌ gRPC Order Error: ${error.message}`);
                    return reject(error);
                }
                console.log(`✅ Order Response: ${response.message} (Ticket: ${response.ticket_id})`);
                resolve(response);
            });
        });
    }

    /**
     * Emergency Close All for the Kill Switch
     */
    public async closeAllPositions(): Promise<void> {
        console.warn("⚠️ Triggering Emergency Close All Positions...");
        // This assumes your .proto has a CloseAll rpc
        this.client.CloseAll({}, (error: any, response: any) => {
            if (error) console.error("❌ Failed to close all positions:", error);
            else console.log("✅ All positions closed successfully.");
        });
    }
}