import { RiskManager } from '../services/RiskManager.js';
import { MT5Service } from '../services/MT5Service.js';
import { CONFIG } from '../config/settings.js';

export class ScalperEngine {
    private tickBuffer: { bid: number, ask: number, time: number }[] = [];
    private readonly MAX_BUFFER_SIZE = 100;
    private riskManager: RiskManager;

    constructor(private mt5: MT5Service) {
        this.riskManager = RiskManager.getInstance(mt5);
    }

    /**
     * This is the method index.ts is looking for.
     */
    public async onTick(symbol: string, bid: number, ask: number) {
        // 1. Update the sliding window
        this.tickBuffer.push({ bid, ask, time: Date.now() });
        if (this.tickBuffer.length > this.MAX_BUFFER_SIZE) this.tickBuffer.shift();

        // 2. Ensure we have enough data for SMA(10) and RSI(14)
        if (this.tickBuffer.length < 20) return;

        // 3. Calculation logic (Placeholder for your Python logic)
        const currentClose = bid;
        const sma10 = this.calculateSMA(10);
        const rsi14 = this.calculateRSI(14);

        // 4. Dunam Velocity Signal Logic
        // Logic: Mean Reversion (Price below SMA and oversold)
        if (currentClose < sma10 && rsi14 < 40) {
            await this.executeSignal(symbol, 'BUY');
        } else if (currentClose > sma10 && rsi14 > 60) {
            await this.executeSignal(symbol, 'SELL');
        }
    }

    private calculateSMA(period: number): number {
        const slice = this.tickBuffer.slice(-period);
        const sum = slice.reduce((acc, tick) => acc + tick.bid, 0);
        return sum / period;
    }

    private calculateRSI(period: number): number {
        let gains = 0;
        let losses = 0;

        // Ensure we don't start at index 0 (because i-1 would be -1)
        const start = Math.max(1, this.tickBuffer.length - period);

        for (let i = start; i < this.tickBuffer.length; i++) {
            const current = this.tickBuffer[i];
            const previous = this.tickBuffer[i - 1];

            // Type Guard: Only calculate if both elements exist
            if (current && previous) {
                const diff = current.bid - previous.bid;
                if (diff >= 0) gains += diff;
                else losses -= diff;
            }
        }

        if (losses === 0) return 100;
        const rs = (gains / period) / (losses / period);
        return 100 - (100 / (1 + rs));
    }

    private async executeSignal(symbol: string, type: 'BUY' | 'SELL') {
        const check = this.riskManager.isTradeAllowed(CONFIG.RISK.MAX_LOT_SIZE);
        
        if (check.allowed) {
            console.log(`🚀 Dunam Signal: ${type} ${symbol}`);
            await this.mt5.sendOrder(symbol, type, CONFIG.RISK.MAX_LOT_SIZE);
        }
    }
}