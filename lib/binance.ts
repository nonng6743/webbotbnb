import crypto from 'crypto';
import axios from 'axios';

const API_KEY = process.env.BNB_API_KEY || '';
const SECRET_KEY = process.env.BNB_SECRET_KEY || '';
const BASE_URL = process.env.BNB_API_BASE_URL || 'https://api.binance.com';

/**
 * สร้าง signature สำหรับ Binance API
 */
function createSignature(queryString: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

/**
 * สร้าง headers สำหรับ authenticated requests
 */
function createHeaders(): Record<string, string> {
  return {
    'X-MBX-APIKEY': API_KEY,
  };
}

/**
 * ดึงข้อมูลราคาแบบ real-time
 */
export async function getTickerPrice(symbol: string = 'BTCUSDT') {
  try {
    const response = await axios.get(`${BASE_URL}/api/v3/ticker/price`, {
      params: { symbol },
    });
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error fetching ticker: ${errorMessage}`);
  }
}

/**
 * ดึงข้อมูลราคาและสถิติ 24 ชั่วโมง สำหรับหลายเหรียญพร้อมกัน
 */
export async function getTicker24hr(symbol?: string) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v3/ticker/24hr`, {
      params: symbol ? { symbol } : undefined,
    });
    return Array.isArray(response.data) ? response.data : [response.data];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error fetching ticker 24hr: ${errorMessage}`);
  }
}

/**
 * ดึงอัตราแลกเปลี่ยน USDT/THB จาก Binance Thailand API
 */
export async function getUSDTToTHBRate(): Promise<number> {
  try {
    // ใช้ API จาก Binance Thailand
    const response = await axios.get(
      'https://www.binance.th/bapi/asset/v1/public/asset-service/product/currency',
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'lang': 'th',
        },
      }
    );

    if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
      // หา THB_USD pair
      const thbData = response.data.data.find(
        (item: any) => item.pair === 'THB_USD'
      );
      
      if (thbData && thbData.rate) {
        // rate คือ THB per USD (เช่น 32.33 THB = 1 USD)
        // ดังนั้น 1 USDT = 1 USD = 32.33 THB
        return parseFloat(thbData.rate.toString());
      }
    }

    throw new Error('THB rate not found in response');
  } catch (error) {
    // ถ้า API ไม่ทำงาน ให้ใช้ค่า default 32.33 (ค่าล่าสุดจาก API)
    console.warn('Failed to fetch THB rate from Binance Thailand API, using default rate 32.33');
    return 32.33;
  }
}

/**
 * ดึงข้อมูลบัญชี (Account Balance)
 */
export async function getAccountInfo() {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.get(`${BASE_URL}/api/v3/account`, {
      params: {
        timestamp,
        signature,
      },
      headers: createHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error fetching account info: ${errorMessage}`);
  }
}

/**
 * ดู order history
 */
export async function getAllOrders(symbol: string = 'BTCUSDT', limit: number = 10) {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&limit=${limit}&timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.get(`${BASE_URL}/api/v3/allOrders`, {
      params: {
        symbol,
        limit,
        timestamp,
        signature,
      },
      headers: createHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error fetching orders: ${errorMessage}`);
  }
}

/**
 * สั่งซื้อ (Market Buy)
 */
export async function placeMarketBuyOrder(symbol: string, quantity: number) {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&side=BUY&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.post(
      `${BASE_URL}/api/v3/order`,
      null,
      {
        params: {
          symbol,
          side: 'BUY',
          type: 'MARKET',
          quantity,
          timestamp,
          signature,
        },
        headers: createHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error placing buy order: ${errorMessage}`);
  }
}

/**
 * สั่งขาย (Market Sell)
 */
export async function placeMarketSellOrder(symbol: string, quantity: number) {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&side=SELL&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.post(
      `${BASE_URL}/api/v3/order`,
      null,
      {
        params: {
          symbol,
          side: 'SELL',
          type: 'MARKET',
          quantity,
          timestamp,
          signature,
        },
        headers: createHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error placing sell order: ${errorMessage}`);
  }
}

/**
 * สั่งซื้อแบบ Limit Order
 */
export async function placeLimitBuyOrder(
  symbol: string,
  quantity: number,
  price: number
) {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&side=BUY&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}&timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.post(
      `${BASE_URL}/api/v3/order`,
      null,
      {
        params: {
          symbol,
          side: 'BUY',
          type: 'LIMIT',
          timeInForce: 'GTC',
          quantity,
          price,
          timestamp,
          signature,
        },
        headers: createHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error placing limit buy order: ${errorMessage}`);
  }
}

/**
 * สั่งขายแบบ Limit Order
 */
export async function placeLimitSellOrder(
  symbol: string,
  quantity: number,
  price: number
) {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&side=SELL&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}&timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.post(
      `${BASE_URL}/api/v3/order`,
      null,
      {
        params: {
          symbol,
          side: 'SELL',
          type: 'LIMIT',
          timeInForce: 'GTC',
          quantity,
          price,
          timestamp,
          signature,
        },
        headers: createHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error placing limit sell order: ${errorMessage}`);
  }
}

/**
 * ยกเลิก Order
 */
export async function cancelOrder(symbol: string, orderId: number) {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
    const signature = createSignature(queryString);

    const response = await axios.delete(`${BASE_URL}/api/v3/order`, {
      params: {
        symbol,
        orderId,
        timestamp,
        signature,
      },
      headers: createHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error canceling order: ${errorMessage}`);
  }
}

/**
 * ดู Open Orders
 */
export async function getOpenOrders(symbol?: string) {
  try {
    const timestamp = Date.now();
    const params: any = { timestamp };
    if (symbol) {
      params.symbol = symbol;
    }
    
    const queryString = new URLSearchParams(params).toString();
    const signature = createSignature(queryString);

    const response = await axios.get(`${BASE_URL}/api/v3/openOrders`, {
      params: {
        ...params,
        signature,
      },
      headers: createHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error fetching open orders: ${errorMessage}`);
  }
}

