import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // In a production app, use an RPC call or materialized view. 
    // This is simplified for the MVP.
    const { data, error } = await supabase.from('feedback').select('category');
    
    if (error) throw error;

    const total = data.length;
    const distribution = data.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({ total, distribution });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}