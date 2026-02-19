import * as grpc from '@grpc/grpc-js';
import { MT5Service } from './services/MT5Service.js';
import { RiskManager } from './services/RiskManager.js';
import { ScalperEngine } from './engine/ScalperEngine.js';
import { dunamProto } from './core/ProtoLoader.js'; // Helper to load your .proto

const mt5 = new MT5Service();
const risk = RiskManager.getInstance(mt5);
const engine = new ScalperEngine(mt5);

const server = new grpc.Server();

server.addService(dunamProto.dunam.TradingService.service, {
    // 1. Handle live market data streaming from MT5 Bridge
    StreamTicks: (call: any) => {
        console.log(`📡 Dunam Velocity: Listening to ticks for ${call.request.symbol}`);
        
        call.on('data', async (tick: any) => {
            // Update Risk Manager with current equity/balance for monitoring
            risk.updateAccountState({
                balance: tick.balance,
                equity: tick.equity,
                openPositions: tick.openPositions
            });

            // Pass tick to Engine for SMA + RSI analysis
            await engine.onTick(tick.symbol, tick.bid, tick.ask);
        });

        call.on('end', () => console.log("Stream ended by MT5 Bridge."));
        call.on('error', (err: any) => console.error("gRPC Stream Error:", err));
    },

    // 2. Manual Trade override from your Mobile Dashboard
    PlaceOrder: async (call: any, callback: any) => {
        const { symbol, type, volume } = call.request;
        const check = risk.isTradeAllowed(volume);

        if (check.allowed) {
            const result = await mt5.sendOrder(symbol, type, volume);
            callback(null, result);
        } else {
            callback(null, { success: false, message: `Risk Blocked: ${check.reason}` });
        }
    }
});

// Start the High-Velocity Server
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) return console.error(err);
    console.log(`🚀 Dunam Velocity Backend synced and running on port: ${port}`);
});