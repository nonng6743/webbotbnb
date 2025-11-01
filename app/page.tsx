'use client';

import { useState, useEffect } from 'react';

interface Balance {
  asset: string;
  free: string;
  locked: string;
}

interface Order {
  orderId: number;
  symbol: string;
  side: string;
  type: string;
  status: string;
  price: string;
  quantity: string;
  time: number;
}

interface Ticker {
  symbol: string;
  lastPrice: string;
  lastPriceTHB?: string;
  priceChangePercent: string;
  highPrice: string;
  highPriceTHB?: string;
  lowPrice: string;
  lowPriceTHB?: string;
  volume: string;
  quoteVolume: string;
  usdtToThbRate?: number;
}

const BINANCE_TH_SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'BTC', icon: '₿', base: 'BTC' },
  { symbol: 'ETHUSDT', name: 'ETH', icon: 'Ξ', base: 'ETH' },
  { symbol: 'SOLUSDT', name: 'SOL', icon: '◎', base: 'SOL' },
  { symbol: 'XRPUSDT', name: 'XRP', icon: '✕', base: 'XRP' },
  { symbol: 'VELOUSDT', name: 'VELO', icon: '🚀', base: 'VELO' },
  { symbol: 'BNBUSDT', name: 'BNB', icon: '🔶', base: 'BNB' },
  { symbol: 'ASTERUSDT', name: 'ASTER', icon: '⭐', base: 'ASTER' },
  { symbol: 'ATHUSDT', name: 'ATH', icon: '🏆', base: 'ATH' },
  { symbol: 'PLUMEUSDT', name: 'PLUME', icon: '💨', base: 'PLUME' },
  { symbol: 'ZENTUSDT', name: 'ZENT', icon: '🌀', base: 'ZENT' },
  { symbol: 'WLDUSDT', name: 'WLD', icon: '🌍', base: 'WLD' },
  { symbol: 'DOGEUSDT', name: 'DOGE', icon: '🐕', base: 'DOGE' },
];

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('THB');
  const [activeFilter, setActiveFilter] = useState('THB');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');

  // Auto-refresh tickers every 2 seconds
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await fetch('/api/tickers');
        const data = await response.json();
        if (data.success) {
          setTickers(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching tickers:', error);
      }
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch balances and orders on mount and when symbol changes
  useEffect(() => {
    fetchBalances();
    fetchOrders();
  }, [selectedSymbol]);

  const fetchBalances = async () => {
    try {
      const response = await fetch('/api/balance');
      const data = await response.json();
      if (data.success) {
        setBalances(data.data.balances || []);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?symbol=${selectedSymbol}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity) {
      alert('กรุณากรอกจำนวน');
      return;
    }

    if (orderType === 'LIMIT' && !limitPrice) {
      alert('กรุณากรอกราคาสำหรับ LIMIT order');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          symbol: selectedSymbol,
          quantity,
          price: limitPrice,
          orderType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`สั่งซื้อ/ขายสำเร็จ! Order ID: ${data.data.orderId}`);
        setQuantity('');
        setLimitPrice('');
        fetchBalances();
        fetchOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('ยืนยันการยกเลิก order?')) return;

    try {
      const response = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol, orderId }),
      });

      const data = await response.json();
      if (data.success) {
        alert('ยกเลิก order สำเร็จ');
        fetchOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error: ${errorMessage}`);
    }
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const getTickerBySymbol = (symbol: string) => {
    return tickers.find((t) => t.symbol === symbol);
  };

  const getCoinInfo = (symbol: string) => {
    // ลองหาจาก BINANCE_TH_SYMBOLS ก่อน
    const found = BINANCE_TH_SYMBOLS.find((coin) => coin.symbol === symbol);
    if (found) return found;
    
    // ถ้าไม่มี ให้สร้างจาก symbol
    const baseSymbol = symbol.replace('USDT', '');
    const icons: Record<string, string> = {
      BTC: '₿',
      ETH: 'Ξ',
      SOL: '◎',
      XRP: '✕',
      BNB: '🔶',
      WLD: '🌍',
      DOGE: '🐕',
      USDT: '💵',
    };
    
    return {
      symbol,
      name: baseSymbol,
      icon: icons[baseSymbol] || '💰',
      base: baseSymbol,
    };
  };

  const formatPrice = (price: string | undefined, usdPrice: string) => {
    if (!price) return 'N/A';
    const numPrice = parseFloat(price);
    if (numPrice < 1) {
      return numPrice.toFixed(4);
    } else if (numPrice < 1000) {
      return numPrice.toFixed(2);
    } else {
      return numPrice.toLocaleString('th-TH', { maximumFractionDigits: 0 });
    }
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  const filteredTickers = tickers.filter((ticker) => {
    const coinInfo = getCoinInfo(ticker.symbol);
    if (!coinInfo) return false;
    if (searchQuery) {
      return (
        coinInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const currentTicker = getTickerBySymbol(selectedSymbol);
  const currentCoin = getCoinInfo(selectedSymbol);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-full mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">ภาพรวมของตลาด</h1>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('Favorites')}
              className={`pb-2 px-4 ${
                activeTab === 'Favorites'
                  ? 'border-b-2 border-yellow-400 text-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              รายการโปรด
            </button>
            <button
              onClick={() => setActiveTab('THB')}
              className={`pb-2 px-4 ${
                activeTab === 'THB'
                  ? 'border-b-2 border-yellow-400 text-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              THB
            </button>
            <button
              onClick={() => setActiveTab('Spot')}
              className={`pb-2 px-4 ${
                activeTab === 'Spot'
                  ? 'border-b-2 border-yellow-400 text-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ตลาด Spot
            </button>
          </div>

          {/* Currency Filter */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <button
              className="px-4 py-1 rounded bg-gray-700 text-white"
            >
              THB
            </button>
            <div className="flex-1"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-4 py-1 pr-8 text-white focus:outline-none focus:border-yellow-400"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Market Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">คริปโต</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">ราคา</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">
                    เปลี่ยน 24 ชั่วโมง
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">
                    สูงสุดใน 24 ชม./ต่ำสุดใน 24 ชม.
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">
                    ปริมาณ 24 ชม.
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">มูลค่าตลาด</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold">แอคชั่น</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : (
                  filteredTickers.map((ticker) => {
                    const coinInfo = getCoinInfo(ticker.symbol);
                    if (!coinInfo) return null;

                    const priceChange = parseFloat(ticker.priceChangePercent);
                    const isFavorite = favorites.includes(ticker.symbol);
                    const priceTHB = ticker.lastPriceTHB || ticker.lastPrice;
                    const priceUSD = parseFloat(ticker.lastPrice);

                    return (
                      <tr
                        key={ticker.symbol}
                        onClick={() => setSelectedSymbol(ticker.symbol)}
                        className="border-b border-gray-700 hover:bg-gray-750 cursor-pointer transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(ticker.symbol);
                              }}
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              {isFavorite ? '★' : '☆'}
                            </button>
                            <div>
                              <div className="font-semibold">{coinInfo.name}/THB</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="font-semibold">
                            ฿{formatPrice(priceTHB, ticker.lastPrice)}
                          </div>
                          <div className="text-sm text-gray-400">
                            ${priceUSD.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span
                            className={`font-semibold ${
                              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {priceChange >= 0 ? '+' : ''}
                            {priceChange.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="text-sm">
                            <div>
                              ฿
                              {formatPrice(
                                ticker.highPriceTHB || ticker.highPrice,
                                ticker.highPrice
                              )}
                            </div>
                            <div className="text-gray-400">
                              ฿
                              {formatPrice(
                                ticker.lowPriceTHB || ticker.lowPrice,
                                ticker.lowPrice
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="text-sm">฿{formatVolume(ticker.quoteVolume)}</div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="text-sm text-gray-400">-</div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSymbol(ticker.symbol);
                            }}
                            className="text-gray-400 hover:text-yellow-400 transition"
                          >
                            📊
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders History */}
        {orders.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Order History - {selectedSymbol}</h2>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-400">Order ID</th>
                    <th className="text-left py-2 px-4 text-gray-400">Side</th>
                    <th className="text-left py-2 px-4 text-gray-400">Type</th>
                    <th className="text-left py-2 px-4 text-gray-400">Price</th>
                    <th className="text-left py-2 px-4 text-gray-400">Quantity</th>
                    <th className="text-left py-2 px-4 text-gray-400">Status</th>
                    <th className="text-left py-2 px-4 text-gray-400">Time</th>
                    <th className="text-left py-2 px-4 text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId} className="border-b border-gray-700">
                      <td className="py-2 px-4">{order.orderId}</td>
                      <td
                        className={`py-2 px-4 font-semibold ${
                          order.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {order.side}
                      </td>
                      <td className="py-2 px-4">{order.type}</td>
                      <td className="py-2 px-4">{parseFloat(order.price).toFixed(2)}</td>
                      <td className="py-2 px-4">{parseFloat(order.quantity).toFixed(8)}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            order.status === 'FILLED'
                              ? 'bg-green-600'
                              : order.status === 'NEW'
                              ? 'bg-blue-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-400">
                        {new Date(order.time).toLocaleString('th-TH')}
                      </td>
                      <td className="py-2 px-4">
                        {order.status === 'NEW' && (
                          <button
                            onClick={() => handleCancelOrder(order.orderId)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
