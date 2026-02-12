import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { participantsApi, handleApiError } from '../utils/api';
import { Participant, CreateParticipantRequest } from '../types';

const PARTICIPANTS_QUERY_KEY = 'participants';

// Get all participants
export const useParticipants = () => {
  return useQuery<Participant[]>(
    PARTICIPANTS_QUERY_KEY,
    async () => {
      const response = await participantsApi.getParticipants();
      return response.data;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
};

// Create participant
export const useCreateParticipant = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async (data: CreateParticipantRequest) => {
      const response = await participantsApi.createParticipant(data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(PARTICIPANTS_QUERY_KEY);
        toast.success(t('participants.participantAdded'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

// Update participant
export const useUpdateParticipant = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async ({ id, data }: { id: string; data: CreateParticipantRequest }) => {
      const response = await participantsApi.updateParticipant(id, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(PARTICIPANTS_QUERY_KEY);
        toast.success(t('participants.participantUpdated'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

// Delete participant
export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async (id: string) => {
      const response = await participantsApi.deleteParticipant(id);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(PARTICIPANTS_QUERY_KEY);
        // Also invalidate sessions as they may have response data
        queryClient.invalidateQueries('admin-sessions');
        toast.success(t('participants.participantDeleted'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};