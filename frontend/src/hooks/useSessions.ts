import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminSessionsApi, participantSessionsApi, handleApiError } from '../utils/api';
import { Session, SessionDetails, SessionWithResponse, CreateSessionRequest, ResponseStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Admin session hooks
export const useAdminSessions = () => {
  const { isAdmin } = useAuth();
  
  return useQuery<Session[]>(
    'admin-sessions',
    async () => {
      const response = await adminSessionsApi.getSessions();
      return response.data;
    },
    {
      enabled: isAdmin,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
};

export const useAdminSession = (sessionId: string) => {
  const { isAdmin } = useAuth();
  
  return useQuery<SessionDetails>(
    ['admin-session', sessionId],
    async () => {
      const response = await adminSessionsApi.getSession(sessionId);
      return response.data;
    },
    {
      enabled: isAdmin && !!sessionId,
      staleTime: 1000 * 60 * 1, // 1 minute
    }
  );
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async (data: CreateSessionRequest) => {
      const response = await adminSessionsApi.createSession(data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-sessions');
        toast.success(t('sessions.sessionAdded'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async ({ id, data }: { id: string; data: CreateSessionRequest }) => {
      const response = await adminSessionsApi.updateSession(id, data);
      return response.data;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('admin-sessions');
        queryClient.invalidateQueries(['admin-session', variables.id]);
        toast.success(t('sessions.sessionUpdated'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async (id: string) => {
      const response = await adminSessionsApi.deleteSession(id);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-sessions');
        toast.success(t('sessions.sessionDeleted'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

export const useUpdateParticipantResponse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async ({ sessionId, participantId, status }: { sessionId: string; participantId: string; status: ResponseStatus }) => {
      const response = await adminSessionsApi.updateResponse(sessionId, participantId, status);
      return response.data;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('admin-sessions');
        queryClient.invalidateQueries(['admin-session', variables.sessionId]);
        toast.success(t('admin.responseOverridden'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

// Participant session hooks
export const useParticipantSessions = () => {
  const { isParticipant } = useAuth();
  
  return useQuery<SessionWithResponse[]>(
    'participant-sessions',
    async () => {
      const response = await participantSessionsApi.getSessions();
      return response.data;
    },
    {
      enabled: isParticipant,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
};

export const useParticipantSession = (sessionId: string) => {
  return useQuery<SessionWithResponse>(
    ['participant-session', sessionId],
    async () => {
      const response = await participantSessionsApi.getSession(sessionId);
      return response.data;
    },
    {
      enabled: !!sessionId,
      staleTime: 1000 * 30, // 30 seconds - more frequent updates for live session
    }
  );
};

export const useSubmitResponse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async ({ sessionId, status }: { sessionId: string; status: ResponseStatus }) => {
      const response = await participantSessionsApi.submitResponse(sessionId, status);
      return response.data;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries('participant-sessions');
        queryClient.invalidateQueries(['participant-session', variables.sessionId]);
        toast.success(t('responses.responseSubmitted'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};

export const useDeleteResponse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(
    async (sessionId: string) => {
      const response = await participantSessionsApi.deleteResponse(sessionId);
      return response.data;
    },
    {
      onSuccess: (_, sessionId) => {
        queryClient.invalidateQueries('participant-sessions');
        queryClient.invalidateQueries(['participant-session', sessionId]);
        toast.success(t('responses.responseDeleted'));
      },
      onError: (error: any) => {
        const apiError = handleApiError(error);
        toast.error(apiError.error);
      },
    }
  );
};