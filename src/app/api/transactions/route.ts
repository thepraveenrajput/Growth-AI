import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const customerSegment = searchParams.get('customerSegment') || undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const where: any = {
      merchantId: 'demo-merchant',
    };

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (customerSegment) where.customerSegment = customerSegment;

    if (startDateParam || endDateParam) {
      where.timestamp = {};
      if (startDateParam) where.timestamp.gte = new Date(startDateParam);
      if (endDateParam) where.timestamp.lte = new Date(endDateParam);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
