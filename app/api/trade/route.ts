import { NextRequest, NextResponse } from 'next/server';
import {
  placeMarketBuyOrder,
  placeMarketSellOrder,
  placeLimitBuyOrder,
  placeLimitSellOrder,
} from '@/lib/binance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbol, quantity, price, orderType } = body;

    if (!symbol || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let result;

    if (orderType === 'MARKET') {
      if (action === 'BUY') {
        result = await placeMarketBuyOrder(symbol, parseFloat(quantity));
      } else if (action === 'SELL') {
        result = await placeMarketSellOrder(symbol, parseFloat(quantity));
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
      }
    } else if (orderType === 'LIMIT') {
      if (!price) {
        return NextResponse.json(
          { success: false, error: 'Price required for LIMIT orders' },
          { status: 400 }
        );
      }

      if (action === 'BUY') {
        result = await placeLimitBuyOrder(
          symbol,
          parseFloat(quantity),
          parseFloat(price)
        );
      } else if (action === 'SELL') {
        result = await placeLimitSellOrder(
          symbol,
          parseFloat(quantity),
          parseFloat(price)
        );
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid order type' },
        { status: 400 }
      );
    }

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

