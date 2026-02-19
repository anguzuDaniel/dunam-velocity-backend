import { MT5Service } from './MT5Service.js';
import { CONFIG } from '../config/settings.js';

export class AdaptiveScaling {
    public async getDynamicTarget(symbol: string, rates: any[]) {
        if (rates.length < 24) return { mode: 'fixed', targetUsd: CONFIG.RISK.SMALL_PROFIT_USD };

        // 1. Calculate TR (True Range) for ATR
        const trValues = rates.map((r, i) => {
            if (i === 0) return r.high - r.low;
            const hl = r.high - r.low;
            const hpc = Math.abs(r.high - rates[i - 1].close);
            const lpc = Math.abs(r.low - rates[i - 1].close);
            return Math.max(hl, hpc, lpc);
        });

        // 2. Simple ATR (14)
        const currentAtr = trValues.slice(-14).reduce((a, b) => a + b, 0) / 14;
        const dailyAvgAtr = trValues.slice(-24).reduce((a, b) => a + b, 0) / 24;

        // 3. Volatility Check (ATR Multiplier logic)
        if (currentAtr >= (CONFIG.RISK.ATR_MULTIPLIER * dailyAvgAtr)) {
            return { mode: 'trailing', tslPips: CONFIG.RISK.TRAILING_STOP_PIPS };
        }

        return { mode: 'fixed', targetUsd: CONFIG.RISK.SMALL_PROFIT_USD };
    }
}