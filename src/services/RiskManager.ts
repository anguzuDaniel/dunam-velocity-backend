import { CONFIG } from '../config/settings.js';
import { MT5Service } from './MT5Service.js';

export interface AccountState {
    balance: number;
    equity: number;
    openPositions: number;
    floatingProfit?: number;
}

export class RiskManager {
    private static instance: RiskManager;
    private balanceAtStart: number = 0;
    private currentStatus: AccountState = { balance: 0, equity: 0, openPositions: 0, floatingProfit: 0 };

    private constructor(private mt5: MT5Service) {}

    public static getInstance(mt5: MT5Service): RiskManager {
        if (!RiskManager.instance) {
            RiskManager.instance = new RiskManager(mt5);
        }
        return RiskManager.instance;
    }

    /**
     * Called when the bot starts to lock in the "Day Start" balance
     */
    public setSessionStart(balance: number) {
        this.balanceAtStart = balance;
        console.log(`Dunam Risk: Session started with $${balance}`);
    }

    /**
     * Updates account state and runs the "Kill Switch" checks (The AccountMonitor logic)
     */
    public updateAccountState(state: AccountState) {
        this.currentStatus = state;
        
        const dailyPnlPct = ((state.equity - this.balanceAtStart) / this.balanceAtStart) * 100;
        const floatingLossPct = (Math.abs(Math.min(0, state.floatingProfit || 0)) / this.balanceAtStart) * 100;

        // 1. Hard Floor (5% Drawdown)
        if (state.equity <= (this.balanceAtStart * 0.95)) {
            this.triggerEmergencyProtocol("HARD_FLOOR_HIT", dailyPnlPct);
        }

        // 2. Daily Loss Limit
        if (floatingLossPct >= CONFIG.RISK.DAILY_LOSS_LIMIT_PCT) {
            this.triggerEmergencyProtocol("LOSS_LIMIT_REACHED", floatingLossPct);
        }

        // 3. Profit Lock-In
        if (dailyPnlPct >= CONFIG.RISK.DAILY_PROFIT_TARGET_PCT) {
            this.triggerProfitLock(dailyPnlPct);
        }
    }

    /**
     * The Gatekeeper (The original RiskManager logic)
     */
    public isTradeAllowed(requestedLots: number): { allowed: boolean; reason?: string } {
        if (this.currentStatus.openPositions >= CONFIG.RISK.MAX_OPEN_POSITIONS) {
            return { allowed: false, reason: 'MAX_OPEN_POSITIONS_REACHED' };
        }
        if (requestedLots > CONFIG.RISK.MAX_LOT_SIZE) {
            return { allowed: false, reason: 'EXCEEDS_MAX_LOT_SIZE' };
        }
        return { allowed: true };
    }

    private async triggerEmergencyProtocol(reason: string, value: number) {
        console.error(`🚨 EMERGENCY: ${reason} at ${value.toFixed(2)}%`);
        await this.mt5.closeAllPositions();
        // Add Supabase deactivation here
    }

    private async triggerProfitLock(profitPct: number) {
        console.log(`💰 SUCCESS: Profit Target Hit! ${profitPct.toFixed(2)}%`);
        await this.mt5.closeAllPositions();
    }
}