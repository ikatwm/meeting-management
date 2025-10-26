'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Candidate, MeetingType, MeetingStatus } from '@/types';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  candidateId: z.string().min(1, 'Candidate is required'),
  startTime: z
    .string()
    .min(1, 'Start time is required')
    .transform((val) => {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
      // datetime-local is in local timezone, so we need to convert to UTC properly
      if (val && !val.includes('Z')) {
        const date = new Date(val);
        return date.toISOString();
      }
      return val;
    })
    .pipe(z.iso.datetime('Invalid start time format')),
  endTime: z
    .string()
    .min(1, 'End time is required')
    .transform((val) => {
      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
      // datetime-local is in local timezone, so we need to convert to UTC properly
      if (val && !val.includes('Z')) {
        const date = new Date(val);
        return date.toISOString();
      }
      return val;
    })
    .pipe(z.iso.datetime('Invalid end time format')),
  location: z.string().min(1, 'Location is required'),
  meetingType: z.enum(['onsite', 'zoom', 'google_meet']),
  status: z.enum(['confirmed', 'pending']),
  notes: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

export default function NewMeetingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meetingType: 'onsite',
      status: 'pending',
    },
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const data = await apiClient.getCandidates({ limit: 100 });
      setCandidates(data.data);
    } catch (error) {
      toast.error('Failed to load candidates');
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsLoading(true);

    try {
      await apiClient.createMeeting({
        title: data.title,
        candidateId: Number(data.candidateId),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        meetingType: data.meetingType as MeetingType,
        status: data.status as MeetingStatus,
        notes: data.notes || undefined,
      });

      toast.success('Meeting scheduled successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to create meeting');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Schedule a New Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Meeting Title"
                  placeholder="e.g., Technical Interview - Software Engineer"
                  error={errors.title?.message}
                  {...register('title')}
                />

                <Select
                  label="Candidate"
                  placeholder="Select a candidate"
                  options={(candidates || []).map((c) => ({
                    value: c.id,
                    label: `${c.name} – ${c.appliedPosition?.name || 'N/A'}`,
                  }))}
                  error={errors.candidateId?.message}
                  {...register('candidateId')}
                />

                <Input
                  label="Date"
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  error={errors.startTime?.message}
                  {...register('startTime', {
                    onChange: (e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        const currentTime = watch('startTime')?.split('T')[1] || '09:00';
                        e.target.value = `${dateValue}T${currentTime}`;
                      }
                    },
                  })}
                />

                <Input
                  label="Start Time"
                  type="time"
                  error={errors.startTime?.message}
                  {...register('startTime', {
                    onChange: (e) => {
                      const timeValue = e.target.value;
                      const dateValue =
                        watch('startTime')?.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                      if (timeValue) {
                        e.target.value = `${dateValue}T${timeValue}`;
                      }
                    },
                  })}
                />

                <Input
                  label="End Time"
                  type="time"
                  error={errors.endTime?.message}
                  {...register('endTime', {
                    onChange: (e) => {
                      const timeValue = e.target.value;
                      const dateValue =
                        watch('startTime')?.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                      if (timeValue) {
                        e.target.value = `${dateValue}T${timeValue}`;
                      }
                    },
                  })}
                />

                <Select
                  label="Meeting Type"
                  options={[
                    { value: 'onsite', label: 'Onsite' },
                    { value: 'zoom', label: 'Zoom' },
                    { value: 'google_meet', label: 'Google Meet' },
                  ]}
                  error={errors.meetingType?.message}
                  {...register('meetingType')}
                />

                <Input
                  label="Location"
                  placeholder="e.g., Conference Room A or Zoom link"
                  error={errors.location?.message}
                  {...register('location')}
                />

                <Select
                  label="Status"
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                  ]}
                  error={errors.status?.message}
                  {...register('status')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Additional notes or agenda items..."
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-danger-600">{errors.notes.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                  Book Meeting
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
