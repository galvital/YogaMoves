import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export interface JwtPayload {
  userId: string;
  role: 'admin' | 'participant';
  email?: string;
  phoneNumber?: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getGoogleAuthUrl(): string {
  const scopes = ['profile', 'email'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}

export async function getGoogleUserInfo(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
  } catch (error) {
    console.error('Google OAuth error:', error);
    return null;
  }
}

// SMS OTP utilities
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function validateIsraeliPhoneNumber(phoneNumber: string): boolean {
  // Israeli phone number validation: starts with +972 or 972 or 05x
  const cleaned = phoneNumber.replace(/\s+/g, '');
  const patterns = [
    /^\+972[5][0-9]{8}$/, // +972 5x xxx xxxx
    /^972[5][0-9]{8}$/, // 972 5x xxx xxxx
    /^05[0-9]{8}$/, // 05x xxx xxxx
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

export function formatIsraeliPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\s+/g, '');
  
  if (cleaned.startsWith('+972')) {
    return cleaned;
  } else if (cleaned.startsWith('972')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('05')) {
    return '+972' + cleaned.substring(1);
  }
  
  return phoneNumber;
}

// Mock SMS sending (logs to console)
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  console.log('📱 SMS Sent:');
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log('-------------------');
  
  // In production, replace with real SMS service (Twilio, AWS SNS, etc.)
  return true;
}

export function generateSessionId(): string {
  return uuidv4();
}

export function generateUniqueCode(): string {
  return crypto.randomBytes(16).toString('hex');
}