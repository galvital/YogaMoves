// User types
export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: 'admin' | 'participant';
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isParticipant: boolean;
}

// Session types
export interface Session {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  datetime: string;
  createdById?: string;
  showResponsesToParticipants: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  shareUrl?: string;
  responseCounts?: {
    joining: number;
    not_joining: number;
    maybe: number;
  };
}

// Response types
export type ResponseStatus = 'joining' | 'not_joining' | 'maybe';

export interface Response {
  id: string;
  sessionId: string;
  participantId: string;
  status: ResponseStatus;
  adminOverride: boolean;
  createdAt: string;
  updatedAt: string;
}

// Session with response details
export interface SessionWithResponse extends Session {
  myResponse?: Response | null;
  otherResponses?: Array<{
    id: string;
    status: ResponseStatus;
    participantName: string;
    updatedAt: string;
  }> | null;
  canEdit: boolean;
}

// Session with full details (for admin)
export interface SessionDetails extends Session {
  responses: Array<{
    id?: string;
    participantId: string;
    name: string;
    phoneNumber?: string;
    status: ResponseStatus | null;
    adminOverride: boolean;
    updatedAt?: string;
  }>;
}

// Participant types
export interface Participant {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'participant';
  createdAt: string;
}

export interface CreateParticipantRequest {
  name: string;
  phoneNumber: string;
}

// Report types
export interface ParticipantStats {
  id: string;
  name: string;
  phoneNumber: string;
  attendedSessions: number;
  totalSessions: number;
  attendanceRate: number;
}

export interface SessionSummary {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: number;
  attendeeNames: string[];
  attendanceRate: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalSessions: number;
  participantStats: ParticipantStats[];
  sessionDetails: SessionSummary[];
  insights: {
    totalParticipants: number;
    totalAttendance: number;
    averageAttendance: number;
    mostActiveParticipant: ParticipantStats | null;
    attendanceRate: number;
    popularDays: Array<{ day: string; count: number }>;
    popularTimes: Array<{ time: string; count: number }>;
  };
}

export interface OverallStats {
  totalSessions: number;
  totalParticipants: number;
  totalResponses: number;
  totalAttendance: number;
  recentSessions: number;
  overallAttendanceRate: number;
  responseRate: number;
  averageAttendancePerSession: number;
}

export interface AvailableMonth {
  year: number;
  month: number;
  sessionCount: number;
}

// Form types
export interface CreateSessionRequest {
  title: string;
  description?: string;
  date: string;
  time: string;
  showResponsesToParticipants?: boolean;
}

export interface UpdateResponseRequest {
  status: ResponseStatus;
}

export interface SubmitResponseRequest {
  status: ResponseStatus;
}

// API Error types
export interface ApiError {
  error: string;
  details?: string[];
}

// Language context types
export interface LanguageContextType {
  language: 'en' | 'he';
  direction: 'ltr' | 'rtl';
  changeLanguage: (lang: 'en' | 'he') => void;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}