import { NextRequest, NextResponse } from 'next/server';
import { getTicker24hr, getUSDTToTHBRate } from '@/lib/binance';

export async function GET(request: NextRequest) {
  try {
    // ดึงข้อมูลราคาทั้งหมด
    const allTickers = await getTicker24hr();
    
    // กรองเฉพาะเหรียญที่ลงท้ายด้วย USDT และมี volume
    let filteredTickers = allTickers.filter((ticker: any) => {
      return (
        ticker.symbol.endsWith('USDT') &&
        parseFloat(ticker.quoteVolume) > 0
      );
    });

    // เรียงลำดับตาม quoteVolume จากมากไปน้อย
    filteredTickers.sort((a: any, b: any) => {
      return parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
    });

    // จำกัดแค่ 50 เหรียญแรก
    filteredTickers = filteredTickers.slice(0, 50);

    // ดึงอัตราแลกเปลี่ยน USDT/THB
    const usdtToThbRate = await getUSDTToTHBRate();

    // แปลงราคาจาก USDT เป็น THB
    filteredTickers = filteredTickers.map((ticker: any) => ({
      ...ticker,
      lastPriceTHB: (parseFloat(ticker.lastPrice) * usdtToThbRate).toString(),
      highPriceTHB: (parseFloat(ticker.highPrice) * usdtToThbRate).toString(),
      lowPriceTHB: (parseFloat(ticker.lowPrice) * usdtToThbRate).toString(),
      usdtToThbRate,
    }));

    return NextResponse.json({
      success: true,
      data: filteredTickers,
      usdtToThbRate,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

