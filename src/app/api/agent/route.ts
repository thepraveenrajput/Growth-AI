import { NextResponse } from 'next/server';
import { executeAgent } from '@/lib/agent/executor';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: 'Prompt is required and must be a string' }, { status: 400 });
    }

    const response = await executeAgent(prompt);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in agent API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
