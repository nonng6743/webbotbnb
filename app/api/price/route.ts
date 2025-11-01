import { NextRequest, NextResponse } from 'next/server';
import { getTickerPrice } from '@/lib/binance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';

    const priceData = await getTickerPrice(symbol);

    return NextResponse.json({
      success: true,
      data: priceData,
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

