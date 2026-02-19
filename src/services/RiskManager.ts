import { CONFIG } from '../config/settings.js';

export interface AccountState {
    balance: number;
    equity: number;
    openPositions: number;
}

export class RiskManager {
    private static instance: RiskManager;
    private currentStatus: AccountState = { balance: 0, equity: 0, openPositions: 0 };

    private constructor() {}

    public static getInstance(): RiskManager {
        if (!RiskManager.instance) {
            RiskManager.instance = new RiskManager();
        }
        return RiskManager.instance;
    }

    /**
     * Updates the local cache of account data from MT5
     */
    public updateAccountState(state: AccountState) {
        this.currentStatus = state;
        this.checkKillSwitch();
    }

    /**
     * The primary gatekeeper for new trades
     */
    public isTradeAllowed(requestedLots: number): { allowed: boolean; reason?: string } {
        // 1. Check Max Positions
        if (this.currentStatus.openPositions >= CONFIG.RISK.MAX_OPEN_POSITIONS) {
            return { allowed: false, reason: 'MAX_OPEN_POSITIONS_REACHED' };
        }

        // 2. Check Lot Size
        if (requestedLots > CONFIG.RISK.MAX_LOT_SIZE) {
            return { allowed: false, reason: 'EXCEEDS_MAX_LOT_SIZE' };
        }

        // 3. Check Equity Drawdown
        const drawdown = this.currentStatus.equity - this.currentStatus.balance;
        if (drawdown <= CONFIG.RISK.MAX_LOSS_LIMIT) {
            return { allowed: false, reason: 'EQUITY_LOSS_LIMIT_REACHED' };
        }

        return { allowed: true };
    }

    /**
     * Emergency check: If equity drops too low, we need to signal a CloseAll
     */
    private checkKillSwitch() {
        const currentLoss = this.currentStatus.equity - this.currentStatus.balance;
        if (currentLoss <= CONFIG.RISK.MAX_LOSS_LIMIT) {
            console.error(`🚨 CRITICAL: Loss limit reached! Current Loss: ${currentLoss}`);
            // Logic to trigger emergency closure will go here
        }
    }
}