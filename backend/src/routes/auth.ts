import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getGoogleAuthUrl,
  getGoogleUserInfo,
  generateOTP,
  validateIsraeliPhoneNumber,
  formatIsraeliPhoneNumber,
  sendSMS
} from '../utils/auth';
import { validate, otpRequestSchema, otpVerifySchema } from '../middleware/validation';

const router = express.Router();

// Google OAuth routes (Admin only)
router.get('/google/url', (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.json({ authUrl });
});

router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const userInfo = await getGoogleUserInfo(code);
    
    if (!userInfo) {
      return res.status(400).json({ error: 'Failed to get user information from Google' });
    }

    // Only allow specific admin email
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'noa.fisch@gmail.com';
    if (userInfo.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Unauthorized. Only the studio admin can log in with Google.' });
    }

    // Check if admin user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.googleId, userInfo.id!)
    });

    let user;
    if (existingUser) {
      user = existingUser;
      // Update user info
      await db.update(schema.users)
        .set({
          name: userInfo.name!,
          email: userInfo.email!,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.users.id, existingUser.id));
    } else {
      // Create new admin user
      const userId = uuidv4();
      const newUser = {
        id: userId,
        email: userInfo.email!,
        name: userInfo.name!,
        role: 'admin' as const,
        googleId: userInfo.id!,
      };
      
      await db.insert(schema.users).values(newUser);
      user = newUser;
    }

    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    await db.insert(schema.refreshTokens).values({
      id: uuidv4(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// SMS OTP routes (Participants)
router.post('/otp/request', validate(otpRequestSchema), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!validateIsraeliPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid Israeli phone number format' });
    }

    const formattedPhone = formatIsraeliPhoneNumber(phoneNumber);
    
    // Check if participant exists
    const participant = await db.query.users.findFirst({
      where: and(
        eq(schema.users.phoneNumber, formattedPhone),
        eq(schema.users.role, 'participant')
      )
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this phone number
    await db.delete(schema.otpCodes)
      .where(eq(schema.otpCodes.phoneNumber, formattedPhone));

    // Store new OTP
    await db.insert(schema.otpCodes).values({
      id: uuidv4(),
      phoneNumber: formattedPhone,
      code,
      expiresAt: expiresAt.toISOString()
    });

    // Send SMS (mocked in development - OTP is logged to console)
    await sendSMS(formattedPhone, `Your YogaMoves verification code is: ${code}`);

    const isDev = process.env.NODE_ENV !== 'production';
    res.json({ 
      message: 'OTP sent successfully',
      ...(isDev && { debugOtp: code }) // Only in development!
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/otp/verify', validate(otpVerifySchema), async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    const formattedPhone = formatIsraeliPhoneNumber(phoneNumber);
    
    // Find valid OTP
    const otpRecord = await db.query.otpCodes.findFirst({
      where: and(
        eq(schema.otpCodes.phoneNumber, formattedPhone),
        eq(schema.otpCodes.code, code),
        eq(schema.otpCodes.used, false),
        gt(schema.otpCodes.expiresAt, new Date().toISOString())
      )
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await db.update(schema.otpCodes)
      .set({ used: true })
      .where(eq(schema.otpCodes.id, otpRecord.id));

    // Get participant
    const participant = await db.query.users.findFirst({
      where: and(
        eq(schema.users.phoneNumber, formattedPhone),
        eq(schema.users.role, 'participant')
      )
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const payload = {
      userId: participant.id,
      role: participant.role,
      phoneNumber: participant.phoneNumber!,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    await db.insert(schema.refreshTokens).values({
      id: uuidv4(),
      userId: participant.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: participant.id,
        name: participant.name,
        phoneNumber: participant.phoneNumber,
        role: participant.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists in database
    const tokenRecord = await db.query.refreshTokens.findFirst({
      where: and(
        eq(schema.refreshTokens.token, refreshToken),
        gt(schema.refreshTokens.expiresAt, new Date().toISOString())
      )
    });

    if (!tokenRecord) {
      return res.status(403).json({ error: 'Refresh token not found or expired' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      phoneNumber: payload.phoneNumber
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Delete refresh token from database
      await db.delete(schema.refreshTokens)
        .where(eq(schema.refreshTokens.token, refreshToken));
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;