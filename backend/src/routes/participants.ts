import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { authenticateToken, requireParticipant, AuthenticatedRequest } from '../middleware/auth';
import { validate, responseSchema } from '../middleware/validation';

const router = express.Router();

// Apply authentication middleware to all participant routes
router.use(authenticateToken);
router.use(requireParticipant);

// Get participant's own sessions and responses
router.get('/sessions', async (req: AuthenticatedRequest, res) => {
  try {
    const participantId = req.user!.userId;
    
    // Get all active sessions with participant's responses
    const sessions = await db
      .select({
        sessionId: schema.sessions.id,
        title: schema.sessions.title,
        description: schema.sessions.description,
        date: schema.sessions.date,
        time: schema.sessions.time,
        datetime: schema.sessions.datetime,
        showResponsesToParticipants: schema.sessions.showResponsesToParticipants,
        responseId: schema.responses.id,
        responseStatus: schema.responses.status,
        responseUpdatedAt: schema.responses.updatedAt,
        adminOverride: schema.responses.adminOverride
      })
      .from(schema.sessions)
      .leftJoin(
        schema.responses, 
        and(
          eq(schema.responses.sessionId, schema.sessions.id),
          eq(schema.responses.participantId, participantId)
        )
      )
      .where(eq(schema.sessions.isActive, true))
      .orderBy(desc(schema.sessions.datetime));

    const sessionsData = sessions.map(session => ({
      id: session.sessionId,
      title: session.title,
      description: session.description,
      date: session.date,
      time: session.time,
      datetime: session.datetime,
      showResponsesToParticipants: session.showResponsesToParticipants,
      myResponse: session.responseId ? {
        id: session.responseId,
        status: session.responseStatus,
        adminOverride: session.adminOverride,
        updatedAt: session.responseUpdatedAt
      } : null,
      canEdit: new Date(session.datetime) > new Date() && !session.adminOverride
    }));

    res.json(sessionsData);
  } catch (error) {
    console.error('Get participant sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get single session details (accessible via share URL)
router.get('/sessions/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const participantId = req.user!.userId;
    
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.id, id),
        eq(schema.sessions.isActive, true)
      )
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get participant's response
    const myResponse = await db.query.responses.findFirst({
      where: and(
        eq(schema.responses.sessionId, id),
        eq(schema.responses.participantId, participantId)
      )
    });

    // Get other responses if session allows it
    let otherResponses = [];
    if (session.showResponsesToParticipants) {
      const allResponses = await db
        .select({
          id: schema.responses.id,
          status: schema.responses.status,
          participantName: schema.users.name,
          updatedAt: schema.responses.updatedAt
        })
        .from(schema.responses)
        .leftJoin(schema.users, eq(schema.responses.participantId, schema.users.id))
        .where(and(
          eq(schema.responses.sessionId, id),
          eq(schema.users.role, 'participant')
        ));

      otherResponses = allResponses.filter(r => r.participantName !== req.user!.phoneNumber);
    }

    res.json({
      id: session.id,
      title: session.title,
      description: session.description,
      date: session.date,
      time: session.time,
      datetime: session.datetime,
      showResponsesToParticipants: session.showResponsesToParticipants,
      myResponse: myResponse ? {
        id: myResponse.id,
        status: myResponse.status,
        adminOverride: myResponse.adminOverride,
        updatedAt: myResponse.updatedAt
      } : null,
      otherResponses: session.showResponsesToParticipants ? otherResponses : null,
      canEdit: new Date(session.datetime) > new Date() && (!myResponse || !myResponse.adminOverride)
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// Submit or update response
router.post('/sessions/:id/responses', validate(responseSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { id: sessionId } = req.params;
    const { status } = req.body;
    const participantId = req.user!.userId;
    
    // Check if session exists and is still open for responses
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.id, sessionId),
        eq(schema.sessions.isActive, true)
      )
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if session hasn't started yet
    if (new Date(session.datetime) <= new Date()) {
      return res.status(400).json({ error: 'Session has already started, responses are locked' });
    }

    // Check if response already exists
    const existingResponse = await db.query.responses.findFirst({
      where: and(
        eq(schema.responses.sessionId, sessionId),
        eq(schema.responses.participantId, participantId)
      )
    });

    if (existingResponse) {
      // Check if admin override is set
      if (existingResponse.adminOverride) {
        return res.status(403).json({ error: 'Response has been set by admin and cannot be changed' });
      }

      // Update existing response
      const result = await db.update(schema.responses)
        .set({
          status: status as 'joining' | 'not_joining' | 'maybe',
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.responses.id, existingResponse.id))
        .returning();

      res.json({
        id: result[0].id,
        status: result[0].status,
        adminOverride: result[0].adminOverride,
        updatedAt: result[0].updatedAt
      });
    } else {
      // Create new response
      const responseId = uuidv4();
      const newResponse = {
        id: responseId,
        sessionId,
        participantId,
        status: status as 'joining' | 'not_joining' | 'maybe'
      };

      await db.insert(schema.responses).values(newResponse);
      
      res.status(201).json({
        id: responseId,
        status,
        adminOverride: false,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Delete response (only if not admin override and session hasn't started)
router.delete('/sessions/:id/responses', async (req: AuthenticatedRequest, res) => {
  try {
    const { id: sessionId } = req.params;
    const participantId = req.user!.userId;
    
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

    // Check if session hasn't started yet
    if (new Date(session.datetime) <= new Date()) {
      return res.status(400).json({ error: 'Session has already started, responses are locked' });
    }

    // Find the response
    const response = await db.query.responses.findFirst({
      where: and(
        eq(schema.responses.sessionId, sessionId),
        eq(schema.responses.participantId, participantId)
      )
    });

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    if (response.adminOverride) {
      return res.status(403).json({ error: 'Cannot delete admin-set response' });
    }

    await db.delete(schema.responses).where(eq(schema.responses.id, response.id));
    
    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

export default router;