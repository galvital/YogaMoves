import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  HelpCircle,
  Filter,
  Search,
  Share2,
  AlertCircle
} from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../contexts/AuthContext';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ParticipantSessionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'responded' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sessions = [], isLoading } = useSessions();

  // Mock user responses (replace with actual API data)
  const mockUserResponses = sessions.map(session => ({
    sessionId: session.id,
    status: Math.random() > 0.5 ? ['joining', 'not_joining', 'maybe'][Math.floor(Math.random() * 3)] : null
  }));

  const now = new Date();
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.datetime);
    const userResponse = mockUserResponses.find(r => r.sessionId === session.id);
    
    // Apply text search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !session.title.toLowerCase().includes(searchLower) &&
        !(session.description?.toLowerCase().includes(searchLower))
      ) {
        return false;
      }
    }

    // Apply status filter
    switch (filter) {
      case 'upcoming':
        return isAfter(sessionDate, now);
      case 'past':
        return isBefore(sessionDate, now);
      case 'responded':
        return userResponse?.status !== null;
      case 'pending':
        return userResponse?.status === null && isAfter(sessionDate, now);
      default:
        return true;
    }
  }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'joining':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'not_joining':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maybe':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'joining':
        return t('responses.joining');
      case 'not_joining':
        return t('responses.notJoining');
      case 'maybe':
        return t('responses.maybe');
      default:
        return t('responses.noResponse');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'joining':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'not_joining':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'maybe':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const handleCopySessionLink = (sessionId: string, sessionTitle: string) => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success(`קישור לשיעור "${sessionTitle}" הועתק`);
  };

  // Statistics
  const totalSessions = sessions.length;
  const upcomingSessions = sessions.filter(s => isAfter(new Date(s.datetime), now)).length;
  const respondedSessions = mockUserResponses.filter(r => r.status !== null).length;
  const joinedSessions = mockUserResponses.filter(r => r.status === 'joining').length;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-800">
          {t('sessions.mySessions')}
        </h1>
        <p className="text-neutral-600 mt-1">
          צפי ותגובי לשיעורי היוגה
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">סה"כ שיעורים</p>
              <p className="text-xl font-bold text-neutral-800">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-accent-50 rounded-lg">
              <Clock className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">שיעורים קרובים</p>
              <p className="text-xl font-bold text-neutral-800">{upcomingSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-secondary-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">הגבתי</p>
              <p className="text-xl font-bold text-neutral-800">{respondedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">אצטרף</p>
              <p className="text-xl font-bold text-neutral-800">{joinedSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש שיעור..."
            className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'כל השיעורים', icon: Calendar },
            { key: 'upcoming', label: 'שיעורים קרובים', icon: Clock },
            { key: 'pending', label: 'ממתינים לתגובה', icon: AlertCircle },
            { key: 'responded', label: 'הגבתי', icon: CheckCircle },
            { key: 'past', label: 'שיעורים עברו', icon: XCircle }
          ].map((filterOption) => {
            const Icon = filterOption.icon;
            return (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-neutral-50 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 border border-neutral-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{filterOption.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                  </div>
                  <div className="w-24 h-8 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-600 mb-2">
              {searchTerm || filter !== 'all' 
                ? 'לא נמצאו שיעורים' 
                : 'אין שיעורים עדיין'
              }
            </h3>
            <p className="text-neutral-500">
              {searchTerm || filter !== 'all'
                ? 'נסי חיפוש אחר או שני את הפילטר'
                : 'שיעורים חדשים יופיעו כאן כשיתווספו'
              }
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const sessionDate = new Date(session.datetime);
            const isUpcoming = isAfter(sessionDate, now);
            const userResponse = mockUserResponses.find(r => r.sessionId === session.id);
            const daysUntil = isUpcoming ? Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
            const canEdit = isUpcoming; // Can edit response until session starts

            return (
              <div
                key={session.id}
                className={`bg-white rounded-xl p-6 shadow-sm border transition-all duration-200 hover:shadow-md ${
                  !userResponse?.status && isUpcoming 
                    ? 'border-accent-200 bg-accent-50/20' 
                    : 'border-neutral-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Session Header */}
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                      <div className={`p-2 rounded-lg ${isUpcoming ? 'bg-primary-50' : 'bg-neutral-50'}`}>
                        <Calendar className={`w-5 h-5 ${isUpcoming ? 'text-primary-500' : 'text-neutral-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                          <h3 className="text-lg font-semibold text-neutral-800">
                            {session.title}
                          </h3>
                          {daysUntil !== null && daysUntil <= 1 && (
                            <span className="bg-accent-100 text-accent-700 text-xs px-2 py-0.5 rounded-full">
                              {daysUntil === 0 ? 'היום' : 'מחר'}
                            </span>
                          )}
                          {!userResponse?.status && isUpcoming && (
                            <span className="animate-pulse bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                              נדרשת תגובה
                            </span>
                          )}
                        </div>
                        {session.description && (
                          <p className="text-neutral-600 text-sm mb-2">
                            {session.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-neutral-600 mb-4">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        <span>{format(sessionDate, 'EEEE, dd MMMM', { locale: he })}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isUpcoming ? 'bg-primary-50 text-primary-600' : 'bg-neutral-50 text-neutral-600'
                        }`}>
                          {isUpcoming ? 'שיעור קרוב' : 'השיעור הסתיים'}
                        </span>
                      </div>
                    </div>

                    {/* Response Status */}
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {getStatusIcon(userResponse?.status || null)}
                      <span className={`text-sm px-3 py-1 rounded-lg border ${getStatusColor(userResponse?.status || null)}`}>
                        {getStatusText(userResponse?.status || null)}
                      </span>
                      {!canEdit && userResponse?.status && (
                        <span className="text-xs text-neutral-500">
                          {t('sessions.locked')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mr-4 rtl:ml-4 rtl:mr-0">
                    <button
                      onClick={() => handleCopySessionLink(session.id, session.title)}
                      className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="העתק קישור"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <Link
                      to={`/session/${session.id}`}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !userResponse?.status && isUpcoming
                          ? 'bg-primary-500 hover:bg-primary-600 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {!userResponse?.status && isUpcoming ? 'הגב לשיעור' : 'צפה בפרטים'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {searchTerm && filteredSessions.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-500">
              מציג {filteredSessions.length} מתוך {sessions.length} שיעורים
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantSessionsPage;