import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { validate, participantSchema, sessionSchema, updateResponseSchema } from '../middleware/validation';
import { formatIsraeliPhoneNumber, validateIsraeliPhoneNumber } from '../utils/auth';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Participant Management
router.post('/participants', validate(participantSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, phoneNumber } = req.body;
    
    if (!validateIsraeliPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid Israeli phone number format' });
    }

    const formattedPhone = formatIsraeliPhoneNumber(phoneNumber);
    
    // Check if participant already exists
    const existingParticipant = await db.query.users.findFirst({
      where: eq(schema.users.phoneNumber, formattedPhone)
    });

    if (existingParticipant) {
      return res.status(409).json({ error: 'Participant with this phone number already exists' });
    }

    const participantId = uuidv4();
    const newParticipant = {
      id: participantId,
      name,
      phoneNumber: formattedPhone,
      role: 'participant' as const
    };

    await db.insert(schema.users).values(newParticipant);
    
    res.status(201).json({
      id: participantId,
      name,
      phoneNumber: formattedPhone,
      role: 'participant'
    });
  } catch (error) {
    console.error('Create participant error:', error);
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

router.get('/participants', async (req: AuthenticatedRequest, res) => {
  try {
    const participants = await db.query.users.findMany({
      where: eq(schema.users.role, 'participant'),
      orderBy: [desc(schema.users.createdAt)]
    });

    res.json(participants.map(p => ({
      id: p.id,
      name: p.name,
      phoneNumber: p.phoneNumber,
      createdAt: p.createdAt
    })));
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

router.put('/participants/:id', validate(participantSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber } = req.body;
    
    if (!validateIsraeliPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid Israeli phone number format' });
    }

    const formattedPhone = formatIsraeliPhoneNumber(phoneNumber);
    
    // Check if another participant has this phone number
    const existingParticipant = await db.query.users.findFirst({
      where: and(
        eq(schema.users.phoneNumber, formattedPhone),
        sql`${schema.users.id} != ${id}`
      )
    });

    if (existingParticipant) {
      return res.status(409).json({ error: 'Another participant already has this phone number' });
    }

    const result = await db.update(schema.users)
      .set({
        name,
        phoneNumber: formattedPhone,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(schema.users.id, id),
        eq(schema.users.role, 'participant')
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({
      id: result[0].id,
      name: result[0].name,
      phoneNumber: result[0].phoneNumber
    });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

router.delete('/participants/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Delete all responses first (foreign key constraint)
    await db.delete(schema.responses)
      .where(eq(schema.responses.participantId, id));
    
    // Delete refresh tokens
    await db.delete(schema.refreshTokens)
      .where(eq(schema.refreshTokens.userId, id));
    
    // Delete OTP codes
    const participant = await db.query.users.findFirst({
      where: eq(schema.users.id, id)
    });
    
    if (participant?.phoneNumber) {
      await db.delete(schema.otpCodes)
        .where(eq(schema.otpCodes.phoneNumber, participant.phoneNumber));
    }
    
    const result = await db.delete(schema.users)
      .where(and(
        eq(schema.users.id, id),
        eq(schema.users.role, 'participant')
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

// Session Management
router.post('/sessions', validate(sessionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, date, time, showResponsesToParticipants } = req.body;
    
    // Create full datetime string
    const datetime = new Date(`${date}T${time}`).toISOString();
    
    const sessionId = uuidv4();
    const newSession = {
      id: sessionId,
      title,
      description: description || null,
      date,
      time,
      datetime,
      createdById: req.user!.userId,
      showResponsesToParticipants: showResponsesToParticipants || false
    };

    await db.insert(schema.sessions).values(newSession);
    
    res.status(201).json({
      id: sessionId,
      title,
      description,
      date,
      time,
      datetime,
      showResponsesToParticipants,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/session/${sessionId}`
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/sessions', async (req: AuthenticatedRequest, res) => {
  try {
    const sessions = await db.query.sessions.findMany({
      where: eq(schema.sessions.isActive, true),
      orderBy: [desc(schema.sessions.datetime)]
    });

    // Get response counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const responseCounts = await db
          .select({
            status: schema.responses.status,
            count: sql<number>`count(*)`
          })
          .from(schema.responses)
          .where(eq(schema.responses.sessionId, session.id))
          .groupBy(schema.responses.status);

        const counts = {
          joining: 0,
          not_joining: 0,
          maybe: 0,
        };

        responseCounts.forEach(({ status, count }) => {
          counts[status as keyof typeof counts] = Number(count);
        });

        return {
          ...session,
          responseCounts: counts,
          shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/session/${session.id}`
        };
      })
    );

    res.json(sessionsWithCounts);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/sessions/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.id, id),
        eq(schema.sessions.isActive, true)
      )
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get all responses with participant details
    const responses = await db
      .select({
        id: schema.responses.id,
        status: schema.responses.status,
        adminOverride: schema.responses.adminOverride,
        participantId: schema.responses.participantId,
        participantName: schema.users.name,
        participantPhone: schema.users.phoneNumber,
        updatedAt: schema.responses.updatedAt
      })
      .from(schema.responses)
      .leftJoin(schema.users, eq(schema.responses.participantId, schema.users.id))
      .where(eq(schema.responses.sessionId, id));

    // Get participants who haven't responded
    const allParticipants = await db.query.users.findMany({
      where: eq(schema.users.role, 'participant')
    });

    const respondedParticipantIds = responses.map(r => r.participantId);
    const nonRespondedParticipants = allParticipants
      .filter(p => !respondedParticipantIds.includes(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        phoneNumber: p.phoneNumber,
        status: null,
        adminOverride: false
      }));

    res.json({
      ...session,
      responses: responses.concat(nonRespondedParticipants),
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/session/${session.id}`
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

router.put('/sessions/:id', validate(sessionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, showResponsesToParticipants } = req.body;
    
    const datetime = new Date(`${date}T${time}`).toISOString();
    
    const result = await db.update(schema.sessions)
      .set({
        title,
        description: description || null,
        date,
        time,
        datetime,
        showResponsesToParticipants,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(schema.sessions.id, id),
        eq(schema.sessions.isActive, true)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

router.delete('/sessions/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.update(schema.sessions)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(schema.sessions.id, id),
        eq(schema.sessions.isActive, true)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Admin override response
router.put('/sessions/:sessionId/responses/:participantId', 
  validate(updateResponseSchema), 
  async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId, participantId } = req.params;
    const { status } = req.body;
    
    // Check if session exists
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.id, sessionId),
        eq(schema.sessions.isActive, true)
      )
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if participant exists
    const participant = await db.query.users.findFirst({
      where: and(
        eq(schema.users.id, participantId),
        eq(schema.users.role, 'participant')
      )
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Check if response exists
    const existingResponse = await db.query.responses.findFirst({
      where: and(
        eq(schema.responses.sessionId, sessionId),
        eq(schema.responses.participantId, participantId)
      )
    });

    if (existingResponse) {
      // Update existing response
      await db.update(schema.responses)
        .set({
          status: status as 'joining' | 'not_joining' | 'maybe',
          adminOverride: true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.responses.id, existingResponse.id));
    } else {
      // Create new response
      await db.insert(schema.responses).values({
        id: uuidv4(),
        sessionId,
        participantId,
        status: status as 'joining' | 'not_joining' | 'maybe',
        adminOverride: true
      });
    }

    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

export default router;