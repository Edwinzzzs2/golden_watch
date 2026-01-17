import { NextResponse, type NextRequest } from 'next/server';
import { getGoldHistoryByDays } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const daysParam = request.nextUrl.searchParams.get('days');
    let days: number | null = null;

    if (daysParam && daysParam !== 'all') {
      const parsed = parseInt(daysParam, 10);
      if (!isNaN(parsed)) {
        days = parsed;
      }
    }

    const history = await getGoldHistoryByDays(days);

    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('History error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
