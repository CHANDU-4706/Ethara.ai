import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    let taskWhere = {};
    let projectWhere = {};

    if (decoded.role !== 'ADMIN') {
      taskWhere.OR = [
        { assigneeId: decoded.userId },
        { creatorId: decoded.userId },
      ];
      projectWhere.OR = [
        { ownerId: decoded.userId },
        { members: { some: { userId: decoded.userId } } },
      ];
    }

    const [totalTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks, totalProjects, recentTasks] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'PENDING' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          ...taskWhere,
          status: { not: 'COMPLETED' },
          dueDate: { lt: now },
        },
      }),
      prisma.project.count({ where: projectWhere }),
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        totalProjects,
      },
      recentTasks,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
