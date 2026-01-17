import { NextResponse } from 'next/server';
import { getLatestGoldPrice } from '@/lib/db';
import { scrapeAndSave } from '@/lib/scraper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting scraper...');

        // Check if we have recent data (e.g., within 30 seconds) to avoid overloading Playwright
        // However, user wants real-time, so we will try to scrape. 
        // Optimization: If a request comes in and the last record is < 10s old, return it directly.
        const latest = await getLatestGoldPrice();
        if (latest) {
            const diff = Date.now() - new Date(latest.timestamp).getTime();
            if (diff < 10000) { // 10 seconds cache
                console.log('Returning cached data (< 10s old)');
                return NextResponse.json({
                    success: true,
                    data: {
                        price: latest.price.toString(),
                        unit: latest.unit,
                        fullText: `${latest.price}${latest.unit}`
                    },
                    timestamp: latest.timestamp
                });
            }
        }

        const result = await scrapeAndSave();
        return NextResponse.json({
            success: true,
            source: 'scraper',
            data: result.data,
            timestamp: result.timestamp
        });

    } catch (error: any) {
        console.error('Scraping error:', error?.message || String(error));
        const latest = await getLatestGoldPrice();
        if (latest) {
            console.log('Scraper failed, returning last database value');
            return NextResponse.json({
                success: true,
                source: 'cache',
                data: {
                    price: latest.price.toString(),
                    unit: latest.unit,
                    fullText: `${latest.price}${latest.unit}`
                },
                timestamp: latest.timestamp
            });
        }
        return NextResponse.json({
            success: false,
            error: error?.message || 'Internal Server Error'
        }, { status: 500 });
    } finally {
    }
}
