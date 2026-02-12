import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Share2, 
  Edit, 
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  HelpCircle,
  Settings
} from 'lucide-react';
import { useSession, useSessionResponses, useUpdateSessionResponse } from '../../hooks/useSessions';
import { useParticipants } from '../../hooks/useParticipants';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import toast from 'react-hot-toast';

const AdminSessionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'joining' | 'not_joining' | 'maybe'>('joining');

  const { data: session, isLoading: sessionLoading } = useSession(sessionId!);
  const { data: responses = [], isLoading: responsesLoading } = useSessionResponses(sessionId!);
  const { data: participants = [] } = useParticipants();
  const updateResponseMutation = useUpdateSessionResponse();

  if (!sessionId) {
    return <div>Session ID not found</div>;
  }

  if (sessionLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div className="h-6 bg-neutral-200 rounded"></div>
            <div className="h-4 bg-neutral-100 rounded w-2/3"></div>
            <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container py-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-neutral-600 mb-2">
            {t('session.sessionNotFound')}
          </h2>
          <Link to="/admin/sessions" className="text-primary-600 hover:text-primary-700">
            חזור לדף השיעורים
          </Link>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(session.datetime);
  const isUpcoming = sessionDate > new Date();
  const shareUrl = `${window.location.origin}/session/${session.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success(t('sessions.linkCopied'));
  };

  const handleAddParticipantResponse = async () => {
    if (!selectedParticipantId) return;

    try {
      await updateResponseMutation.mutateAsync({
        sessionId: sessionId!,
        participantId: selectedParticipantId,
        status: selectedStatus,
      });
      
      toast.success(t('admin.responseOverridden'));
      setShowAddParticipant(false);
      setSelectedParticipantId('');
      setSelectedStatus('joining');
    } catch (error) {
      toast.error('שגיאה בעדכון תגובת המשתתף');
    }
  };

  const handleUpdateResponse = async (participantId: string, newStatus: 'joining' | 'not_joining' | 'maybe') => {
    try {
      await updateResponseMutation.mutateAsync({
        sessionId: sessionId!,
        participantId,
        status: newStatus,
      });
      
      toast.success(t('admin.responseOverridden'));
    } catch (error) {
      toast.error('שגיאה בעדכון התגובה');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'joining':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'not_joining':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maybe':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'joining':
        return t('responses.joining');
      case 'not_joining':
        return t('responses.notJoining');
      case 'maybe':
        return t('responses.maybe');
      default:
        return 'לא ידוע';
    }
  };

  const getStatusColor = (status: string) => {
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

  // Separate actual responses from non-responded participants
  const actualResponses = responses.filter((r: any) => r.status !== null && r.status !== undefined);
  const nonResponded = responses.filter((r: any) => r.status === null || r.status === undefined);

  // Statistics (only count actual responses)
  const joiningCount = actualResponses.filter((r: any) => r.status === 'joining').length;
  const notJoiningCount = actualResponses.filter((r: any) => r.status === 'not_joining').length;
  const maybeCount = actualResponses.filter((r: any) => r.status === 'maybe').length;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <Link
          to="/admin/sessions"
          className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-800">
            {session.title}
          </h1>
          <p className="text-neutral-600 mt-1">
            פרטי השיעור וניהול תגובות
          </p>
        </div>
      </div>

      {/* Session Info Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              פרטי השיעור
            </h2>
            {session.description && (
              <p className="text-neutral-600 mb-4">
                {session.description}
              </p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isUpcoming ? 'bg-primary-50 text-primary-600' : 'bg-secondary-50 text-secondary-600'
          }`}>
            {isUpcoming ? 'שיעור קרוב' : 'השיעור הסתיים'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">תאריך</p>
              <p className="font-semibold text-neutral-800">
                {format(sessionDate, 'EEEE, dd MMMM yyyy', { locale: he })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-accent-50 rounded-lg">
              <Clock className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">שעה</p>
              <p className="font-semibold text-neutral-800">{session.time}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-secondary-50 rounded-lg">
              <Users className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">משתתפים</p>
              <p className="font-semibold text-neutral-800">{joiningCount} מצטרפים</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse border-t border-neutral-100 pt-4">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>העתק קישור</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 rtl:space-x-reverse bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>צפה כמשתתף</span>
          </a>

          <div className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg ${
            session.showResponsesToParticipants ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
          }`}>
            {session.showResponsesToParticipants ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {session.showResponsesToParticipants ? 'תגובות גלויות' : 'תגובות מוסתרות'}
            </span>
          </div>
        </div>
      </div>

      {/* Response Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 mb-1">סה"כ תגובות</p>
              <p className="text-2xl font-bold text-neutral-800">{actualResponses.length}</p>
            </div>
            <Users className="w-8 h-8 text-neutral-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">מצטרפים</p>
              <p className="text-2xl font-bold text-green-600">{joiningCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 mb-1">לא מצטרפים</p>
              <p className="text-2xl font-bold text-red-600">{notJoiningCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 mb-1">אולי</p>
              <p className="text-2xl font-bold text-yellow-600">{maybeCount}</p>
            </div>
            <HelpCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Responses Management */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800">
            ניהול תגובות
          </h2>
          <button
            onClick={() => setShowAddParticipant(!showAddParticipant)}
            className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>הוסף/ערוך תגובה</span>
          </button>
        </div>

        {/* Add Participant Response */}
        {showAddParticipant && (
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-neutral-800 mb-4">הוסף או ערוך תגובת משתתף</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  משתתף
                </label>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                >
                  <option value="">בחר משתתף</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  סטטוס
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                >
                  <option value="joining">מצטרף</option>
                  <option value="not_joining">לא מצטרף</option>
                  <option value="maybe">אולי מצטרף</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddParticipantResponse}
                  disabled={!selectedParticipantId || updateResponseMutation.isLoading}
                  className="w-full bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateResponseMutation.isLoading ? 'שומר...' : 'שמור תגובה'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Responses List */}
        <div className="space-y-3">
          {responsesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                      <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-neutral-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">אין תגובות עדיין</p>
              <p className="text-sm text-neutral-500">שתף את קישור השיעור כדי לקבל תגובות</p>
            </div>
          ) : (
            actualResponses.map((response: any) => {
              const participant = participants.find(p => p.id === (response.participantId || response.id));
              const displayName = response.name || response.participantName || participant?.name || 'משתתף לא ידוע';
              return (
                <div key={response.id || response.participantId} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-200 transition-colors">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="flex-shrink-0">
                      {getStatusIcon(response.status)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">
                        {displayName}
                      </p>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(response.status)}`}>
                          {getStatusText(response.status)}
                        </span>
                        {response.adminOverride && (
                          <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                            נקבע על ידי מנהל
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <select
                      value={response.status}
                      onChange={(e) => handleUpdateResponse(response.participantId || response.id, e.target.value as any)}
                      className="text-sm border border-neutral-200 rounded px-2 py-1 focus:border-primary-500 focus:ring-0"
                    >
                      <option value="joining">מצטרף</option>
                      <option value="not_joining">לא מצטרף</option>
                      <option value="maybe">אולי</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Non-responded participants */}
        {nonResponded.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">לא הגיבו ({nonResponded.length})</h3>
            <div className="space-y-2">
              {nonResponded.map((p: any) => {
                const displayName = p.name || participants.find(pt => pt.id === p.id)?.name || 'משתתף לא ידוע';
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">{displayName}</span>
                    </div>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateResponse(p.participantId || p.id, e.target.value as any);
                          e.target.value = '';
                        }
                      }}
                      className="text-xs border border-neutral-200 rounded px-2 py-1 focus:border-primary-500 focus:ring-0"
                    >
                      <option value="">סמן נוכחות...</option>
                      <option value="joining">מצטרף</option>
                      <option value="not_joining">לא מצטרף</option>
                      <option value="maybe">אולי</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSessionDetailPage;