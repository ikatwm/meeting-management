'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { AppliedPosition, CandidateStatus, Candidate } from '@/types';

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.email('Invalid email format').max(255),
  appliedPositionId: z.string().min(1, 'Position is required'),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'rejected', 'hired']),
  interviewNotes: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

type CandidateFormProps = {
  candidate?: Candidate;
  onSubmit: (data: {
    name: string;
    email: string;
    appliedPositionId: number;
    status: CandidateStatus;
    interviewNotes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
};

export function CandidateForm({
  candidate,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Candidate',
}: CandidateFormProps) {
  const [positions, setPositions] = useState<AppliedPosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: candidate?.name || '',
      email: candidate?.email || '',
      appliedPositionId: candidate?.appliedPositionId?.toString() || '',
      status: candidate?.status || 'applied',
      interviewNotes: candidate?.interviewNotes || '',
    },
  });

  useEffect(() => {
    const loadPositions = async () => {
      try {
        setIsLoadingPositions(true);
        const data = await apiClient.getAppliedPositions();
        setPositions(data);
      } catch (error) {
        console.error('Failed to load positions:', error);
        setPositions([]);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    void loadPositions();
  }, []);

  const handleFormSubmit = async (data: CandidateFormData) => {
    await onSubmit({
      name: data.name,
      email: data.email,
      appliedPositionId: Number(data.appliedPositionId),
      status: data.status as CandidateStatus,
      interviewNotes: data.interviewNotes || undefined,
    });
  };

  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hired', label: 'Hired' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          placeholder="e.g., John Doe"
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g., john@example.com"
          error={errors.email?.message}
          disabled={isLoading || !!candidate}
          {...register('email')}
        />

        <Select
          label="Applied Position"
          placeholder={isLoadingPositions ? 'Loading positions...' : 'Select a position'}
          options={positions.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
          error={errors.appliedPositionId?.message}
          disabled={isLoading || isLoadingPositions}
          {...register('appliedPositionId')}
        />

        <Select
          label="Status"
          options={statusOptions}
          error={errors.status?.message}
          disabled={isLoading}
          {...register('status')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Interview Notes</label>
        <textarea
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          rows={4}
          placeholder="Add any notes about the candidate..."
          disabled={isLoading}
          {...register('interviewNotes')}
        />
        {errors.interviewNotes && (
          <p className="mt-1 text-sm text-danger-600">{errors.interviewNotes.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
