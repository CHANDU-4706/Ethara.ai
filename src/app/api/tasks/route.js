import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    let where = {};

    if (decoded.role !== 'ADMIN') {
      where.OR = [
        { assigneeId: decoded.userId },
        { creatorId: decoded.userId },
      ];
    }

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, status, priority, dueDate, projectId, assigneeId } = await request.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and project are required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: decoded.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
