import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  HelpCircle,
  TrendingUp,
  Star,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../contexts/AuthContext';
import { format, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

const ParticipantDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: sessions = [], isLoading } = useSessions();

  // Calculate user stats
  const now = new Date();
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const upcomingSessions = sessions.filter(session => isAfter(new Date(session.datetime), now));
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.datetime);
    return (
      sessionDate.getDate() === now.getDate() &&
      sessionDate.getMonth() === now.getMonth() &&
      sessionDate.getFullYear() === now.getFullYear()
    );
  });
  const monthSessions = sessions.filter(session => {
    const sessionDate = new Date(session.datetime);
    return sessionDate >= monthStart && sessionDate <= monthEnd;
  });

  // Mock user responses data (replace with actual API data)
  const mockUserResponses = sessions.map(session => ({
    sessionId: session.id,
    status: ['joining', 'not_joining', 'maybe', null][Math.floor(Math.random() * 4)]
  }));

  const respondedSessions = mockUserResponses.filter(r => r.status !== null).length;
  const joinedSessions = mockUserResponses.filter(r => r.status === 'joining').length;
  const attendanceRate = sessions.length > 0 ? (joinedSessions / sessions.length) * 100 : 0;

  const getTimeOfDay = () => {
    const hour = now.getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 18) return 'צהריים טובים';
    return 'ערב טוב';
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'joining':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'not_joining':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maybe':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'joining':
        return 'מצטרפת';
      case 'not_joining':
        return 'לא מצטרפת';
      case 'maybe':
        return 'אולי';
      default:
        return 'טרם הגבת';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'joining':
        return 'bg-green-50 text-green-700';
      case 'not_joining':
        return 'bg-red-50 text-red-700';
      case 'maybe':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-neutral-50 text-neutral-700';
    }
  };

  return (
    <div className="container py-6 space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-primary-700 mb-2">
          {getTimeOfDay()}, {user?.name?.split(' ')[0]} 🧘‍♀️
        </h1>
        <p className="text-neutral-600 text-lg">
          ברוכה הבאה למרחב היוגה האישי שלך
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-800">
              {upcomingSessions.length}
            </span>
          </div>
          <p className="text-sm text-neutral-600 font-medium">
            שיעורים קרובים
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-secondary-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-secondary-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-800">
              {joinedSessions}
            </span>
          </div>
          <p className="text-sm text-neutral-600 font-medium">
            השתתפתי
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-accent-50 rounded-lg">
              <Target className="w-5 h-5 text-accent-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-800">
              {attendanceRate.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-neutral-600 font-medium">
            שיעור נוכחות
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-neutral-800">
              {monthSessions.length}
            </span>
          </div>
          <p className="text-sm text-neutral-600 font-medium">
            שיעורים החודש
          </p>
        </div>
      </div>

      {/* Achievement Badge */}
      {attendanceRate >= 80 && (
        <div className="bg-gradient-to-r from-accent-50 to-secondary-50 rounded-xl p-6 border border-accent-200 mb-8">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="p-4 bg-gradient-to-br from-accent-400 to-secondary-400 rounded-full">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-1">
                🏆 יוגני מתמידה!
              </h3>
              <p className="text-neutral-600">
                שיעור הנוכחות שלך הוא {attendanceRate.toFixed(0)}% - מרשים מאוד! המשיכי כך 🌟
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <Star className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0 text-accent-500" />
            השיעורים של היום
          </h2>
          <div className="space-y-3">
            {todaySessions.map((session) => {
              const userResponse = mockUserResponses.find(r => r.sessionId === session.id);
              const isUpcoming = isAfter(new Date(session.datetime), now);
              
              return (
                <Link
                  key={session.id}
                  to={`/session/${session.id}`}
                  className="block bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 border border-primary-100 hover:border-primary-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 mb-1">
                        {session.title}
                      </h3>
                      <p className="text-sm text-neutral-600 flex items-center space-x-2 rtl:space-x-reverse">
                        <Clock className="w-4 h-4" />
                        <span>היום ב-{session.time}</span>
                      </p>
                      {session.description && (
                        <p className="text-sm text-neutral-500 mt-1">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getStatusIcon(userResponse?.status || null)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(userResponse?.status || null)}`}>
                        {getStatusText(userResponse?.status || null)}
                      </span>
                      {isUpcoming && userResponse?.status === null && (
                        <div className="animate-pulse bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                          נדרשת תגובה
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800 flex items-center">
            <Calendar className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
            השיעורים הקרובים
          </h2>
          <Link
            to="/sessions"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            צפי בכל השיעורים ←
          </Link>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                      <div className="h-3 bg-neutral-100 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-neutral-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">אין שיעורים קרובים</p>
              <p className="text-sm text-neutral-500">שיעורים חדשים יופיעו כאן כשיתווספו</p>
            </div>
          ) : (
            upcomingSessions.slice(0, 5).map((session) => {
              const userResponse = mockUserResponses.find(r => r.sessionId === session.id);
              const sessionDate = new Date(session.datetime);
              const daysUntil = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <Link
                  key={session.id}
                  to={`/session/${session.id}`}
                  className="block bg-white rounded-lg p-4 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary-200 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                        <h3 className="font-semibold text-neutral-800">
                          {session.title}
                        </h3>
                        {daysUntil <= 1 && (
                          <span className="bg-accent-100 text-accent-700 text-xs px-2 py-0.5 rounded-full">
                            {daysUntil === 0 ? 'היום' : 'מחר'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">
                        📅 {format(sessionDate, 'EEEE, dd MMMM', { locale: he })} ב-{session.time}
                      </p>
                      {session.description && (
                        <p className="text-sm text-neutral-500">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getStatusIcon(userResponse?.status || null)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(userResponse?.status || null)}`}>
                        {getStatusText(userResponse?.status || null)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/sessions"
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-8 h-8" />
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">השיעורים שלי</h3>
          <p className="text-white/80 text-sm">צפי בכל השיעורים ועדכני תגובות</p>
        </Link>

        <Link
          to="/settings"
          className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8" />
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">הגדרות</h3>
          <p className="text-white/80 text-sm">עדכני פרטים אישיים ואפשרויות</p>
        </Link>
      </div>

      {/* Inspirational Quote */}
      <div className="bg-gradient-to-r from-neutral-50 to-primary-50/30 rounded-xl p-6 border border-neutral-100 text-center">
        <div className="text-4xl mb-4">🧘‍♀️</div>
        <blockquote className="text-lg text-neutral-700 font-medium mb-2">
          "היוגה היא אור, שאם הודלק פעם אחת, לא יכבה לעולם. ככל שתתרגלי יותר, כך הלהבה תבער בחוזקה רבה יותר."
        </blockquote>
        <cite className="text-sm text-neutral-500">- B.K.S. אייֶנגאר</cite>
      </div>
    </div>
  );
};

export default ParticipantDashboard;