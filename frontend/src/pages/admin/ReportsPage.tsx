import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  Trophy,
  Target,
  Activity,
  ChevronDown,
  Download
} from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { useParticipants } from '../../hooks/useParticipants';
import { format, startOfMonth, endOfMonth, parseISO, isSameMonth } from 'date-fns';
import { he } from 'date-fns/locale';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedParticipant, setSelectedParticipant] = useState('');

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: participants = [], isLoading: participantsLoading } = useParticipants();

  // Parse selected month
  const selectedDate = parseISO(`${selectedMonth}-01`);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Filter sessions for selected month
  const monthSessions = sessions.filter(session => {
    const sessionDate = parseISO(session.datetime);
    return sessionDate >= monthStart && sessionDate <= monthEnd;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = monthSessions.length;
    const totalParticipants = participants.length;
    
    // TODO: Replace with actual response data
    const mockResponses = monthSessions.flatMap(session => 
      participants.slice(0, Math.floor(Math.random() * participants.length))
        .map(participant => ({
          sessionId: session.id,
          participantId: participant.id,
          status: ['joining', 'not_joining', 'maybe'][Math.floor(Math.random() * 3)]
        }))
    );

    const totalAttendance = mockResponses.filter(r => r.status === 'joining').length;
    const attendanceRate = totalSessions > 0 ? (totalAttendance / (totalSessions * totalParticipants)) * 100 : 0;
    const avgAttendancePerSession = totalSessions > 0 ? totalAttendance / totalSessions : 0;

    // Most active participant
    const participantAttendance = participants.map(participant => {
      const attendedSessions = mockResponses.filter(
        r => r.participantId === participant.id && r.status === 'joining'
      ).length;
      return {
        participant,
        attendedSessions,
        attendanceRate: totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0
      };
    }).sort((a, b) => b.attendedSessions - a.attendedSessions);

    // Popular days and times
    const dayStats = monthSessions.reduce((acc, session) => {
      const day = format(parseISO(session.datetime), 'EEEE', { locale: he });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeStats = monthSessions.reduce((acc, session) => {
      const hour = parseInt(session.time.split(':')[0]);
      const timeSlot = hour < 12 ? 'בוקר' : hour < 18 ? 'צהריים' : 'ערב';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      totalParticipants,
      totalAttendance,
      attendanceRate,
      avgAttendancePerSession,
      mostActiveParticipant: participantAttendance[0] || null,
      participantStats: participantAttendance,
      popularDays: Object.entries(dayStats).sort((a, b) => b[1] - a[1]),
      popularTimes: Object.entries(timeStats).sort((a, b) => b[1] - a[1])
    };
  }, [monthSessions, participants]);

  const handleDownloadReport = () => {
    // TODO: Implement report download functionality
    const reportData = {
      month: format(selectedDate, 'MMMM yyyy', { locale: he }),
      stats,
      sessions: monthSessions,
      participants: participants
    };
    
    console.log('Downloading report:', reportData);
    alert('תכונת הורדת דוחות תהיה זמינה בקרוב');
  };

  if (sessionsLoading || participantsLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 space-y-3">
                <div className="h-4 bg-neutral-200 rounded"></div>
                <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            {t('reports.title')}
          </h1>
          <p className="text-neutral-600 mt-1">
            דוחות וסטטיסטיקות של שיעורי היוגה
          </p>
        </div>
        
        <button
          onClick={handleDownloadReport}
          className="flex items-center space-x-2 rtl:space-x-reverse bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">הורד דוח</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('reports.selectMonth')}
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0 appearance-none bg-white"
              >
                {/* Generate last 12 months options */}
                {[...Array(12)].map((_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = format(date, 'yyyy-MM');
                  const label = format(date, 'MMMM yyyy', { locale: he });
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">{t('reports.totalSessions')}</p>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.totalSessions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-secondary-50 rounded-lg">
              <Users className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">{t('reports.totalParticipants')}</p>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.totalParticipants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-accent-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">{t('reports.attendanceRate')}</p>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.attendanceRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-green-50 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">{t('reports.averageAttendance')}</p>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.avgAttendancePerSession.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Days */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
            {t('reports.popularDays')}
          </h3>
          <div className="space-y-3">
            {stats.popularDays.map(([day, count], index) => {
              const percentage = stats.totalSessions > 0 ? (count / stats.totalSessions) * 100 : 0;
              return (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary-500' :
                      index === 1 ? 'bg-secondary-500' :
                      index === 2 ? 'bg-accent-500' : 'bg-neutral-300'
                    }`}></div>
                    <span className="font-medium text-neutral-700">{day}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-sm text-neutral-500">{count} שיעורים</span>
                    <div className="w-20 h-2 bg-neutral-100 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-primary-500' :
                          index === 1 ? 'bg-secondary-500' :
                          index === 2 ? 'bg-accent-500' : 'bg-neutral-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.popularDays.length === 0 && (
              <p className="text-neutral-500 text-center py-4">
                {t('reports.noDataAvailable')}
              </p>
            )}
          </div>
        </div>

        {/* Popular Times */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
            {t('reports.popularTimes')}
          </h3>
          <div className="space-y-3">
            {stats.popularTimes.map(([time, count], index) => {
              const percentage = stats.totalSessions > 0 ? (count / stats.totalSessions) * 100 : 0;
              return (
                <div key={time} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary-500' :
                      index === 1 ? 'bg-secondary-500' :
                      index === 2 ? 'bg-accent-500' : 'bg-neutral-300'
                    }`}></div>
                    <span className="font-medium text-neutral-700">{time}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-sm text-neutral-500">{count} שיעורים</span>
                    <div className="w-20 h-2 bg-neutral-100 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-primary-500' :
                          index === 1 ? 'bg-secondary-500' :
                          index === 2 ? 'bg-accent-500' : 'bg-neutral-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.popularTimes.length === 0 && (
              <p className="text-neutral-500 text-center py-4">
                {t('reports.noDataAvailable')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Most Active Participant */}
      {stats.mostActiveParticipant && (
        <div className="bg-gradient-to-r from-accent-50 to-secondary-50 rounded-xl p-6 border border-accent-200">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="p-4 bg-gradient-to-br from-accent-400 to-secondary-400 rounded-full">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-1">
                {t('reports.mostActiveParticipant')}
              </h3>
              <p className="text-xl font-bold text-accent-700">
                {stats.mostActiveParticipant.participant.name}
              </p>
              <p className="text-sm text-neutral-600">
                השתתף ב-{stats.mostActiveParticipant.attendedSessions} שיעורים 
                ({stats.mostActiveParticipant.attendanceRate.toFixed(1)}% נוכחות)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participant Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
          {t('reports.participantStats')}
        </h3>
        
        {stats.participantStats.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            {t('reports.noDataAvailable')}
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.participantStats.map((stat, index) => (
              <div key={stat.participant.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">
                      {stat.participant.name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {stat.attendedSessions} מתוך {stats.totalSessions} שיעורים
                    </p>
                  </div>
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-lg font-bold text-neutral-800">
                    {stat.attendanceRate.toFixed(1)}%
                  </p>
                  <div className="w-16 h-2 bg-neutral-100 rounded-full mt-1">
                    <div 
                      className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      style={{ width: `${stat.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
          {t('reports.sessionDetails')} - {format(selectedDate, 'MMMM yyyy', { locale: he })}
        </h3>
        
        {monthSessions.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            אין שיעורים בחודש שנבחר
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {monthSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-800">
                    {session.title}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {format(parseISO(session.datetime), 'dd/MM/yyyy', { locale: he })} בשעה {session.time}
                  </p>
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-sm text-neutral-600">
                    0 משתתפים {/* TODO: Add actual attendance count */}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;