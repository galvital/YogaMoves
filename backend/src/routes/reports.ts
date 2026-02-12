import express from 'express';
import { db, schema } from '../db';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all report routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get monthly attendance report
router.get('/monthly/:year/:month', async (req: AuthenticatedRequest, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all sessions in the month
    const sessions = await db.query.sessions.findMany({
      where: and(
        eq(schema.sessions.isActive, true),
        gte(schema.sessions.date, startDateStr),
        lte(schema.sessions.date, endDateStr)
      ),
      orderBy: [desc(schema.sessions.date)]
    });

    if (sessions.length === 0) {
      return res.json({
        year: yearNum,
        month: monthNum,
        totalSessions: 0,
        participantStats: [],
        sessionDetails: [],
        insights: {
          totalParticipants: 0,
          averageAttendance: 0,
          mostActiveParticipant: null,
          attendanceRate: 0,
          popularDays: [],
          popularTimes: []
        }
      });
    }

    const sessionIds = sessions.map(s => s.id);

    // Get all participants
    const participants = await db.query.users.findMany({
      where: eq(schema.users.role, 'participant')
    });

    // Get all responses for sessions in this month
    const responses = await db
      .select({
        sessionId: schema.responses.sessionId,
        participantId: schema.responses.participantId,
        participantName: schema.users.name,
        status: schema.responses.status,
        sessionDate: schema.sessions.date,
        sessionTime: schema.sessions.time,
        sessionTitle: schema.sessions.title
      })
      .from(schema.responses)
      .leftJoin(schema.users, eq(schema.responses.participantId, schema.users.id))
      .leftJoin(schema.sessions, eq(schema.responses.sessionId, schema.sessions.id))
      .where(
        and(
          sql`${schema.responses.sessionId} IN (${sessionIds.map(() => '?').join(',')})`,
          eq(schema.responses.status, 'joining')
        )
      );

    // Calculate participant statistics
    const participantStats = participants.map(participant => {
      const participantResponses = responses.filter(r => r.participantId === participant.id);
      const attendedCount = participantResponses.length;
      const attendanceRate = sessions.length > 0 ? (attendedCount / sessions.length) * 100 : 0;

      return {
        id: participant.id,
        name: participant.name,
        phoneNumber: participant.phoneNumber,
        attendedSessions: attendedCount,
        totalSessions: sessions.length,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      };
    });

    // Sort by attendance count
    participantStats.sort((a, b) => b.attendedSessions - a.attendedSessions);

    // Calculate session details
    const sessionDetails = sessions.map(session => {
      const sessionResponses = responses.filter(r => r.sessionId === session.id);
      const attendeeCount = sessionResponses.length;

      return {
        id: session.id,
        title: session.title,
        date: session.date,
        time: session.time,
        attendees: attendeeCount,
        attendeeNames: sessionResponses.map(r => r.participantName).filter(Boolean),
        attendanceRate: participants.length > 0 ? Math.round((attendeeCount / participants.length) * 100) : 0
      };
    });

    // Calculate insights
    const totalAttendance = responses.length;
    const totalPossibleAttendance = sessions.length * participants.length;
    const overallAttendanceRate = totalPossibleAttendance > 0 
      ? Math.round((totalAttendance / totalPossibleAttendance) * 100) 
      : 0;

    const averageAttendance = sessions.length > 0 
      ? Math.round(totalAttendance / sessions.length) 
      : 0;

    const mostActiveParticipant = participantStats.length > 0 && participantStats[0].attendedSessions > 0
      ? participantStats[0]
      : null;

    // Popular days analysis
    const dayCount: Record<string, number> = {};
    sessions.forEach(session => {
      const dayOfWeek = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    });

    const popularDays = Object.entries(dayCount)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Popular times analysis
    const timeCount: Record<string, number> = {};
    sessions.forEach(session => {
      timeCount[session.time] = (timeCount[session.time] || 0) + 1;
    });

    const popularTimes = Object.entries(timeCount)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      year: yearNum,
      month: monthNum,
      totalSessions: sessions.length,
      participantStats,
      sessionDetails,
      insights: {
        totalParticipants: participants.length,
        totalAttendance,
        averageAttendance,
        mostActiveParticipant,
        attendanceRate: overallAttendanceRate,
        popularDays,
        popularTimes
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Get available months with data
router.get('/available-months', async (req: AuthenticatedRequest, res) => {
  try {
    const monthsData = await db
      .select({
        year: sql<number>`CAST(strftime('%Y', ${schema.sessions.date}) AS INTEGER)`,
        month: sql<number>`CAST(strftime('%m', ${schema.sessions.date}) AS INTEGER)`,
        sessionCount: sql<number>`COUNT(*)`
      })
      .from(schema.sessions)
      .where(eq(schema.sessions.isActive, true))
      .groupBy(
        sql`strftime('%Y', ${schema.sessions.date})`,
        sql`strftime('%m', ${schema.sessions.date})`
      )
      .orderBy(
        sql`strftime('%Y', ${schema.sessions.date}) DESC`,
        sql`strftime('%m', ${schema.sessions.date}) DESC`
      );

    res.json(monthsData);
  } catch (error) {
    console.error('Available months error:', error);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
});

// Get overall statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    // Get total counts
    const totalSessions = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.sessions)
      .where(eq(schema.sessions.isActive, true))
      .then(result => Number(result[0].count));

    const totalParticipants = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.users)
      .where(eq(schema.users.role, 'participant'))
      .then(result => Number(result[0].count));

    const totalResponses = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.responses)
      .then(result => Number(result[0].count));

    const totalAttendance = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.responses)
      .where(eq(schema.responses.status, 'joining'))
      .then(result => Number(result[0].count));

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSessions = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.isActive, true),
        gte(schema.sessions.date, thirtyDaysAgo.toISOString().split('T')[0])
      ))
      .then(result => Number(result[0].count));

    // Calculate rates
    const overallAttendanceRate = totalSessions > 0 && totalParticipants > 0
      ? Math.round((totalAttendance / (totalSessions * totalParticipants)) * 100)
      : 0;

    const responseRate = totalSessions > 0 && totalParticipants > 0
      ? Math.round((totalResponses / (totalSessions * totalParticipants)) * 100)
      : 0;

    res.json({
      totalSessions,
      totalParticipants,
      totalResponses,
      totalAttendance,
      recentSessions,
      overallAttendanceRate,
      responseRate,
      averageAttendancePerSession: totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0
    });
  } catch (error) {
    console.error('Overall stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;