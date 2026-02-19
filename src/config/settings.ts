import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    PORT: process.env.PORT || 3000,
    MT5_URL: process.env.MT5_BRIDGE_URL,
    RISK: {
        MAX_LOT_SIZE: parseFloat(process.env.MAX_LOT_SIZE || '0.5'),
        SMALL_PROFIT_USD: parseFloat(process.env.SMALL_PROFIT_USD || '10.0'),
        MAX_LOSS_LIMIT: parseFloat(process.env.MAX_LOSS_LIMIT || '-100.0'),
    },
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
};