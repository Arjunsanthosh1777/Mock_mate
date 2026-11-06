import type {
  AIHealthStatus,
  DashboardData,
  DifficultyLevel,
  ExperienceLevel,
  FullSessionDetail,
  InterviewType,
  JobRole,
  SessionComparisonResult,
  SessionListItem,
  UserPreferences,
} from '../types/interview.ts';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with status ${res.status}`;
    const code =
      typeof payload?.code === 'string' ? payload.code : 'HTTP_ERROR';
    throw new ApiError(msg, res.status, code);
  }

  return payload as T;
}

export const api = {
  getHealth(): Promise<{ ok: boolean; database: string; ai: AIHealthStatus }> {
    return request('/api/health');
  },

  getPreferences(): Promise<UserPreferences> {
    return request('/api/preferences');
  },

  updatePreferences(
    data: Partial<Omit<UserPreferences, 'id' | 'updatedAt'>>
  ): Promise<UserPreferences> {
    return request('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getDashboard(): Promise<DashboardData> {
    return request('/api/dashboard');
  },

  listSessions(): Promise<{ sessions: SessionListItem[] }> {
    return request('/api/sessions');
  },

  createSession(input: {
    jobRole: JobRole;
    customRole?: string;
    experienceLevel: ExperienceLevel;
    interviewType: InterviewType;
    difficulty: DifficultyLevel;
    questionCount: number;
    focusContext?: string;
  }): Promise<FullSessionDetail> {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getSession(sessionId: string): Promise<FullSessionDetail> {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}`);
  },

  generateNextQuestion(sessionId: string): Promise<FullSessionDetail> {
    return request(
      `/api/sessions/${encodeURIComponent(sessionId)}/questions/next`,
      {
        method: 'POST',
      }
    );
  },

  skipQuestion(
    sessionId: string,
    questionId: string
  ): Promise<FullSessionDetail> {
    return request(
      `/api/sessions/${encodeURIComponent(sessionId)}/questions/${encodeURIComponent(
        questionId
      )}/skip`,
      {
        method: 'POST',
      }
    );
  },

  submitAnswer(
    sessionId: string,
    questionId: string,
    answerText: string
  ): Promise<FullSessionDetail> {
    return request(
      `/api/sessions/${encodeURIComponent(sessionId)}/questions/${encodeURIComponent(
        questionId
      )}/answer`,
      {
        method: 'POST',
        body: JSON.stringify({ answerText }),
      }
    );
  },

  completeSession(sessionId: string): Promise<FullSessionDetail> {
    return request(
      `/api/sessions/${encodeURIComponent(sessionId)}/complete`,
      {
        method: 'POST',
      }
    );
  },

  compareSessions(sessionIds: string[]): Promise<SessionComparisonResult> {
    const query = encodeURIComponent(sessionIds.join(','));
    return request(`/api/sessions/compare?ids=${query}`);
  },

  deleteSession(sessionId: string): Promise<{ deleted: boolean; id: string }> {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },
};
