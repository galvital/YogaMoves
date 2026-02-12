import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useParticipantSession, useSubmitResponse } from '../../hooks/useSessions';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { ResponseStatus } from '../../types';
import { format, parseISO, isPast } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { CheckCircle, XCircle, HelpCircle, Calendar, Clock, LogIn } from 'lucide-react';

const SessionJoinPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isAuthenticated, isParticipant } = useAuth();
  const navigate = useNavigate();
  
  const { data: session, isLoading, error } = useParticipantSession(sessionId || '');
  const submitResponse = useSubmitResponse();
  const [selectedStatus, setSelectedStatus] = useState<ResponseStatus | null>(null);

  useEffect(() => {
    if (session?.myResponse) {
      setSelectedStatus(session.myResponse.status);
    }
  }, [session]);

  const handleSubmit = async (status: ResponseStatus) => {
    if (!sessionId) return;
    setSelectedStatus(status);
    submitResponse.mutate({ sessionId, status });
  };

  const isSessionPast = session ? isPast(parseISO(session.datetime)) : false;
  const dateLocale = language === 'he' ? he : enUS;

  if (!isAuthenticated || !isParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
          <LanguageToggle />
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('session.loginRequired')}</h1>
          <p className="text-gray-500 mb-6">{t('session.loginToRespond')}</p>
          <button
            onClick={() => navigate(`/login?redirect=/session/${sessionId}`)}
            className="w-full py-3 px-6 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('session.notFound')}</h1>
          <p className="text-gray-500">{t('session.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  const responseButtons = [
    { status: 'joining' as ResponseStatus, icon: CheckCircle, label: t('responses.joining'), color: 'bg-green-500 hover:bg-green-600', selected: 'bg-green-600 ring-4 ring-green-200' },
    { status: 'maybe' as ResponseStatus, icon: HelpCircle, label: t('responses.maybe'), color: 'bg-yellow-500 hover:bg-yellow-600', selected: 'bg-yellow-600 ring-4 ring-yellow-200' },
    { status: 'not_joining' as ResponseStatus, icon: XCircle, label: t('responses.notJoining'), color: 'bg-red-500 hover:bg-red-600', selected: 'bg-red-600 ring-4 ring-red-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
        <LanguageToggle />
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Session Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🧘‍♀️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{session.title}</h1>
          {session.description && (
            <p className="text-gray-500 text-sm">{session.description}</p>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-center gap-6 mb-8 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            <span>{format(parseISO(session.date), 'dd MMM yyyy', { locale: dateLocale })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            <span>{session.time}</span>
          </div>
        </div>

        {/* Response Buttons */}
        {isSessionPast ? (
          <div className="text-center py-4 px-6 bg-gray-50 rounded-xl">
            <p className="text-gray-500 font-medium">{t('session.sessionEnded')}</p>
            {selectedStatus && (
              <p className="text-sm text-gray-400 mt-1">
                {t('session.yourResponse')}: {t(`responses.${selectedStatus}`)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-gray-600 font-medium mb-4">{t('session.willYouJoin')}</p>
            {responseButtons.map(({ status, icon: Icon, label, color, selected }) => (
              <button
                key={status}
                onClick={() => handleSubmit(status)}
                disabled={submitResponse.isLoading}
                className={`w-full py-4 px-6 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all ${
                  selectedStatus === status ? selected : color
                } disabled:opacity-50`}
              >
                <Icon className="w-6 h-6" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Other Responses */}
        {session.showResponsesToParticipants && session.otherResponses && session.otherResponses.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3">{t('session.otherResponses')}</h3>
            <div className="space-y-2">
              {session.otherResponses.map((resp) => (
                <div key={resp.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{resp.participantName}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    resp.status === 'joining' ? 'bg-green-100 text-green-700' :
                    resp.status === 'maybe' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t(`responses.${resp.status}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionJoinPage;
