export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    const { id } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Member email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: id } },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
    }

    const member = await prisma.projectMember.create({
      data: { userId: user.id, projectId: id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId: id } },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
