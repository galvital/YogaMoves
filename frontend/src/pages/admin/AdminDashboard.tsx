import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Plus, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useSessions } from '../../hooks/useSessions';
import { useParticipants } from '../../hooks/useParticipants';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: participants = [], isLoading: participantsLoading } = useParticipants();

  // Calculate stats
  const now = new Date();
  const upcomingSessions = sessions.filter(session => new Date(session.datetime) > now);
  const pastSessions = sessions.filter(session => new Date(session.datetime) <= now);
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.datetime);
    return (
      sessionDate.getDate() === now.getDate() &&
      sessionDate.getMonth() === now.getMonth() &&
      sessionDate.getFullYear() === now.getFullYear()
    );
  });

  const quickActions = [
    {
      title: t('sessions.addSession'),
      icon: Plus,
      href: '/admin/sessions',
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'צור שיעור יוגה חדש'
    },
    {
      title: t('participants.addParticipant'),
      icon: Users,
      href: '/admin/participants',
      color: 'bg-secondary-500 hover:bg-secondary-600',
      description: 'הוסף משתתף חדש'
    },
    {
      title: t('reports.title'),
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-accent-500 hover:bg-accent-600',
      description: 'צפה בדוחות וסטטיסטיקות'
    }
  ];

  const stats = [
    {
      title: t('sessions.upcomingSessions'),
      value: upcomingSessions.length,
      icon: Clock,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'שיעורים היום',
      value: todaySessions.length,
      icon: Calendar,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50'
    },
    {
      title: t('participants.title'),
      value: participants.length,
      icon: Users,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50'
    },
    {
      title: 'סך הכל שיעורים',
      value: sessions.length,
      icon: CheckCircle,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50'
    }
  ];

  const getTimeOfDay = () => {
    const hour = now.getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 18) return 'צהריים טובים';
    return 'ערב טוב';
  };

  return (
    <div className="container py-6 space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-primary-700 mb-2">
          {getTimeOfDay()} 🧘‍♀️
        </h1>
        <p className="text-neutral-600 text-lg">
          {t('admin.dashboard')} - ברוכה הבאה למרכז הניהול שלך
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-2xl font-bold text-neutral-800">
                  {sessionsLoading || participantsLoading ? '...' : stat.value}
                </span>
              </div>
              <p className="text-sm text-neutral-600 font-medium">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
          פעולות מהירות
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-8 h-8" />
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-white/80 text-sm">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
            שיעורים היום
          </h2>
          <div className="space-y-3">
            {todaySessions.map((session) => (
              <Link
                key={session.id}
                to={`/admin/sessions/${session.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary-200 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800 mb-1">
                      {session.title}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      🕐 {session.time}
                    </p>
                    {session.description && (
                      <p className="text-sm text-neutral-500 mt-1">
                        {session.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {new Date(session.datetime) > now ? (
                      <div className="text-primary-600 text-xs bg-primary-50 px-2 py-1 rounded-full">
                        קרוב
                      </div>
                    ) : (
                      <div className="text-secondary-600 text-xs bg-secondary-50 px-2 py-1 rounded-full">
                        הסתיים
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800 flex items-center">
            <Clock className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
            שיעורים אחרונים
          </h2>
          <Link
            to="/admin/sessions"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            צפה בכל השיעורים ←
          </Link>
        </div>
        
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <Link
              key={session.id}
              to={`/admin/sessions/${session.id}`}
              className="block bg-white rounded-lg p-4 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary-200 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                    <h3 className="font-semibold text-neutral-800">
                      {session.title}
                    </h3>
                    {new Date(session.datetime) > now ? (
                      <AlertCircle className="w-4 h-4 text-primary-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-secondary-500" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    📅 {new Date(session.datetime).toLocaleDateString('he-IL')} ב-{session.time}
                  </p>
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-xs text-neutral-500">
                    {new Date(session.datetime) > now ? 'קרוב' : 'הסתיים'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          
          {sessions.length === 0 && !sessionsLoading && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">{t('sessions.noSessions')}</p>
              <Link
                to="/admin/sessions"
                className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('sessions.addSession')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;