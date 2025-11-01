import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOpenOrders } from '@/lib/binance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all' or 'open'
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const limit = parseInt(searchParams.get('limit') || '10');

    let orders;

    if (type === 'open') {
      orders = await getOpenOrders(symbol);
    } else {
      orders = await getAllOrders(symbol, limit);
    }

    return NextResponse.json({
      success: true,
      data: orders,
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

