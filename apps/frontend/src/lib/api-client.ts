import axios, { AxiosError, AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';
import type {
  ApiError,
  AuthResponse,
  Candidate,
  CandidateHistory,
  CreateCandidateInput,
  CreateMeetingInput,
  LoginCredentials,
  Meeting,
  PaginatedResponse,
  Position,
  UpdateCandidateInput,
  UpdateMeetingInput,
  User,
  AppliedPosition,
  MeetingsApiResponse,
  CandidatesApiResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          statusCode: error.response?.status,
          errors: error.response?.data?.errors,
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', credentials);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/auth/me');
    return data;
  }

  // Meetings
  async getMeetings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    candidateId?: number;
  }): Promise<PaginatedResponse<Meeting>> {
    // Backend uses 'pageSize' instead of 'limit'
    const apiParams = params
      ? {
          page: params.page,
          pageSize: params.limit,
          status: params.status,
          candidateId: params.candidateId,
        }
      : {};

    const { data } = await this.client.get<MeetingsApiResponse>('/meetings', { params: apiParams });

    // Transform backend response to match frontend expectations
    return {
      data: data.meetings,
      pagination: data.pagination,
    };
  }

  async getMeetingById(id: number): Promise<Meeting> {
    const { data } = await this.client.get<Meeting>(`/meetings/${id}`);
    return data;
  }

  async createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    const { data } = await this.client.post<Meeting>('/meetings', input);
    return data;
  }

  async updateMeeting(id: number, input: UpdateMeetingInput): Promise<Meeting> {
    const { data } = await this.client.put<Meeting>(`/meetings/${id}`, input);
    return data;
  }

  async deleteMeeting(id: number): Promise<void> {
    await this.client.delete(`/meetings/${id}`);
  }

  // Candidates
  async getCandidates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Candidate>> {
    // Backend uses 'pageSize' instead of 'limit'
    const apiParams = params
      ? {
          page: params.page,
          pageSize: params.limit,
          status: params.status,
          search: params.search,
        }
      : {};

    const { data } = await this.client.get<CandidatesApiResponse>('/candidates', {
      params: apiParams,
    });

    // Transform backend response to match frontend expectations
    return {
      data: data.candidates,
      pagination: data.pagination,
    };
  }

  async getCandidateById(id: number): Promise<Candidate> {
    const { data } = await this.client.get<Candidate>(`/candidates/${id}`);
    return data;
  }

  async createCandidate(input: CreateCandidateInput): Promise<Candidate> {
    const { data } = await this.client.post<Candidate>('/candidates', input);
    return data;
  }

  async updateCandidate(id: number, input: UpdateCandidateInput): Promise<Candidate> {
    const { data } = await this.client.put<Candidate>(`/candidates/${id}`, input);
    return data;
  }

  async deleteCandidate(id: number): Promise<void> {
    await this.client.delete(`/candidates/${id}`);
  }

  async getCandidateHistory(candidateId: number): Promise<CandidateHistory[]> {
    const { data } = await this.client.get<CandidateHistory[]>(
      `/candidates/${candidateId}/history`
    );
    return data;
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    const { data } = await this.client.get<Position[]>('/positions');
    return data;
  }

  // Applied Positions
  async getAppliedPositions(): Promise<AppliedPosition[]> {
    const { data } = await this.client.get<AppliedPosition[]>('/positions/applied');
    return data;
  }

  // Users
  async getUsers(params?: { positionId?: number }): Promise<User[]> {
    const { data } = await this.client.get<User[]>('/users', { params });
    return data;
  }
}

export const apiClient = new ApiClient();
