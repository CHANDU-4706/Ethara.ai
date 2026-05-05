import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
