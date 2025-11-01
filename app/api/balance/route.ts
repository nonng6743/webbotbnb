import { NextRequest, NextResponse } from 'next/server';
import { getAccountInfo } from '@/lib/binance';

export async function GET(request: NextRequest) {
  try {
    const accountInfo = await getAccountInfo();
    
    // กรองเฉพาะบัญชีที่มี balance > 0
    const balances = accountInfo.balances.filter(
      (b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );

    return NextResponse.json({
      success: true,
      data: {
        balances,
        totalAssetValue: accountInfo.totalAssetValue,
      },
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

