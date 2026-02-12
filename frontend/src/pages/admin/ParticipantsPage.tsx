import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Plus, 
  Phone, 
  Calendar, 
  Edit, 
  Trash2,
  Search,
  UserPlus
} from 'lucide-react';
import { useParticipants, useCreateParticipant, useUpdateParticipant, useDeleteParticipant } from '../../hooks/useParticipants';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant?: any;
}

const ParticipantModal: React.FC<ParticipantModalProps> = ({ isOpen, onClose, participant }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(participant?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(participant?.phoneNumber || '');
  
  const createParticipantMutation = useCreateParticipant();
  const updateParticipantMutation = useUpdateParticipant();
  
  const isEditing = !!participant;

  React.useEffect(() => {
    if (participant) {
      setName(participant.name);
      setPhoneNumber(participant.phoneNumber || '');
    } else {
      setName('');
      setPhoneNumber('');
    }
  }, [participant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const participantData = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      };

      if (isEditing) {
        await updateParticipantMutation.mutateAsync({
          id: participant.id,
          data: participantData
        });
        toast.success(t('participants.participantUpdated'));
      } else {
        await createParticipantMutation.mutateAsync(participantData);
        toast.success(t('participants.participantAdded'));
      }
      
      onClose();
    } catch (error) {
      toast.error(isEditing ? t('participants.updateError') : t('participants.createError'));
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            {isEditing ? t('participants.editParticipant') : t('participants.addParticipant')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('participants.participantName')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                placeholder="שם המשתתף"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('participants.phoneNumber')} (אופציונלי)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
                placeholder="05X-XXX-XXXX"
                dir="ltr"
              />
              <p className="text-xs text-neutral-500 mt-1">
                פורמט: 05X-XXX-XXXX
              </p>
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
                disabled={!name.trim() || createParticipantMutation.isLoading || updateParticipantMutation.isLoading}
                className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createParticipantMutation.isLoading || updateParticipantMutation.isLoading) 
                  ? 'שומר...' 
                  : t('app.save')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ParticipantsPage: React.FC = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: participants = [], isLoading } = useParticipants();
  const deleteParticipantMutation = useDeleteParticipant();

  // Filter participants based on search term
  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (participant.phoneNumber && participant.phoneNumber.includes(searchTerm))
  );

  const handleEditParticipant = (participant: any) => {
    setEditingParticipant(participant);
    setShowModal(true);
  };

  const handleDeleteParticipant = async (participantId: string, participantName: string) => {
    if (window.confirm(`${t('participants.deleteConfirm')} "${participantName}"?`)) {
      try {
        await deleteParticipantMutation.mutateAsync(participantId);
        toast.success(t('participants.participantDeleted'));
      } catch (error) {
        toast.error('שגיאה במחיקת המשתתף');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingParticipant(null);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            {t('participants.title')}
          </h1>
          <p className="text-neutral-600 mt-1">
            ניהול המשתתפים בשיעורי היוגה
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-medium">{t('participants.addParticipant')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש משתתף לפי שם או טלפון..."
            className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-0"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">סה"כ משתתפים</p>
              <p className="text-2xl font-bold text-neutral-800">
                {participants.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-secondary-50 rounded-lg">
              <Phone className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">עם מספר טלפון</p>
              <p className="text-2xl font-bold text-neutral-800">
                {participants.filter(p => p.phoneNumber).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-accent-50 rounded-lg">
              <Calendar className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">פעילים החודש</p>
              <p className="text-2xl font-bold text-neutral-800">
                0 {/* TODO: Calculate active participants */}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-neutral-200 rounded"></div>
                  <div className="w-8 h-8 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-6">
            {searchTerm ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">לא נמצאו משתתפים</p>
                <p className="text-sm text-neutral-500">נסה חיפוש אחר או נקה את שדה החיפוש</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                  {t('participants.noParticipants')}
                </h3>
                <p className="text-neutral-500 mb-6">
                  {t('participants.createFirst')}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('participants.addParticipant')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-3">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg hover:border-primary-200 hover:bg-primary-50/20 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 mb-1">
                        {participant.name}
                      </h3>
                      <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-neutral-500">
                        {participant.phoneNumber && (
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Phone className="w-4 h-4" />
                            <span dir="ltr">{participant.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Calendar className="w-4 h-4" />
                          <span>
                            נוצר {format(new Date(participant.createdAt), 'dd/MM/yyyy', { locale: he })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => handleEditParticipant(participant)}
                      className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={t('participants.editParticipant')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteParticipant(participant.id, participant.name)}
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('participants.deleteParticipant')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {searchTerm && (
              <div className="mt-4 text-center">
                <p className="text-sm text-neutral-500">
                  מציג {filteredParticipants.length} מתוך {participants.length} משתתפים
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Participant Modal */}
      <ParticipantModal 
        isOpen={showModal} 
        onClose={handleCloseModal}
        participant={editingParticipant}
      />
    </div>
  );
};

export default ParticipantsPage;