import { NextRequest, NextResponse } from 'next/server';
import { cancelOrder } from '@/lib/binance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, orderId } = body;

    if (!symbol || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing symbol or orderId' },
        { status: 400 }
      );
    }

    const result = await cancelOrder(symbol, parseInt(orderId));

    return NextResponse.json({
      success: true,
      data: result,
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

