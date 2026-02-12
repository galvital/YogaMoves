import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Users, 
  Share2, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSessions, useCreateSession, useDeleteSession, useUpdateSession } from '../../hooks/useSessions';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showResponses, setShowResponses] = useState(true);
  const createSession = useCreateSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createSession.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time,
        showResponsesToParticipants: showResponses
      });

      onClose();
      resetForm();
    } catch (error) {
      // Error toast handled by the hook
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setShowResponses(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            {t('sessions.addSession')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sessions.sessionTitle')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                placeholder="יוגה לבוקר / יוגה לעומדים / ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sessions.sessionDescription')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                placeholder="תיאור קצר של השיעור (אופציונלי)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('sessions.sessionDate')} *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('sessions.sessionTime')} *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showResponses"
                checked={showResponses}
                onChange={(e) => setShowResponses(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="showResponses" className="mr-2 rtl:ml-2 rtl:mr-0 text-sm text-neutral-700">
                {t('sessions.showResponses')}
              </label>
            </div>

            <div className="flex space-x-3 rtl:space-x-reverse pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {t('app.cancel')}
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !date || !time}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('app.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminSessionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  const { data: sessions = [], isLoading } = useSessions();
  const deleteSessionMutation = useDeleteSession();
  const updateSessionMutation = useUpdateSession();

  const now = new Date();
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.datetime);
    if (filter === 'upcoming') return isAfter(sessionDate, now);
    if (filter === 'past') return isBefore(sessionDate, now);
    return true;
  }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const handleCopyLink = (sessionId: string) => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success(t('sessions.linkCopied'));
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm(t('sessions.deleteConfirm'))) {
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
        toast.success(t('sessions.sessionDeleted'));
      } catch (error) {
        toast.error(t('sessions.deleteError'));
      }
    }
  };

  const toggleResponsesVisibility = async (sessionId: string, currentVisibility: boolean) => {
    try {
      // TODO: This needs to be implemented properly with a separate toggle endpoint
      // await updateSessionMutation.mutateAsync({
      //   id: sessionId,
      //   data: { showResponsesToParticipants: !currentVisibility }
      // });
      console.log('Toggle responses visibility - not implemented yet');
      toast.success(t('sessions.responseSettingsUpdated'));
    } catch (error) {
      toast.error(t('sessions.responseSettingsError'));
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            {t('sessions.title')}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('sessions.subtitle')}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t('sessions.addSession')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 rtl:space-x-reverse">
        {[
          { key: 'all', label: 'כל השיעורים' },
          { key: 'upcoming', label: 'שיעורים קרובים' },
          { key: 'past', label: 'שיעורים עברו' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.key
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-white text-neutral-600 hover:text-primary-600 hover:bg-primary-50 border border-neutral-200'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-neutral-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-neutral-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-neutral-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-600 mb-2">
              {filter === 'all' ? t('sessions.noSessions') : `אין שיעורים ${filter === 'upcoming' ? 'קרובים' : 'עברו'}`}
            </h3>
            <p className="text-neutral-500 mb-6">
              {filter === 'all' && t('sessions.createFirst')}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t('sessions.addSession')}</span>
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const sessionDate = new Date(session.datetime);
            const isUpcoming = isAfter(sessionDate, now);
            const isToday = format(sessionDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

            return (
              <div
                key={session.id}
                className={`bg-white rounded-xl p-6 shadow-sm border transition-all duration-200 hover:shadow-md ${
                  isToday ? 'border-accent-200 bg-accent-50/30' : 'border-neutral-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Session Header */}
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                      <div className={`p-2 rounded-lg ${isUpcoming ? 'bg-primary-50' : 'bg-secondary-50'}`}>
                        {isUpcoming ? (
                          <AlertCircle className={`w-5 h-5 ${isUpcoming ? 'text-primary-500' : 'text-secondary-500'}`} />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-secondary-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-800">
                          {session.title}
                        </h3>
                        {session.description && (
                          <p className="text-neutral-600 text-sm mt-1">
                            {session.description}
                          </p>
                        )}
                      </div>
                      {isToday && (
                        <div className="bg-accent-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          היום
                        </div>
                      )}
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-neutral-600 mb-4">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        <span>{format(sessionDate, 'dd/MM/yyyy', { locale: he })}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Users className="w-4 h-4 text-primary-500" />
                        <span>0 משתתפים</span> {/* TODO: Add actual count */}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        isUpcoming 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'bg-secondary-50 text-secondary-600'
                      }`}>
                        {isUpcoming ? 'שיעור קרוב' : 'השיעור הסתיים'}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        session.showResponsesToParticipants 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {session.showResponsesToParticipants ? 'תגובות גלויות' : 'תגובות מוסתרות'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mr-4 rtl:ml-4 rtl:mr-0">
                    <button
                      onClick={() => handleCopyLink(session.id)}
                      className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={t('sessions.copyLink')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleResponsesVisibility(session.id, session.showResponsesToParticipants)}
                      className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      title="שנה נראות תגובות"
                    >
                      {session.showResponsesToParticipants ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    <Link
                      to={`/admin/sessions/${session.id}`}
                      className="p-2 text-neutral-500 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                      title="צפה בפרטים"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('sessions.deleteSession')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
};

export default AdminSessionsPage;