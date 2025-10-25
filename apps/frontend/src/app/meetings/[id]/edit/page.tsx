'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { LoadingPage } from '@/components/ui/Loading';
import type { Meeting, MeetingType, MeetingStatus } from '@/types';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(1, 'Location is required'),
  meetingType: z.enum(['onsite', 'zoom', 'google_meet']),
  status: z.enum(['confirmed', 'pending']),
  notes: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      const data = await apiClient.getMeetingById(meetingId);
      setMeeting(data);

      reset({
        title: data.title,
        startTime: format(new Date(data.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(data.endTime), "yyyy-MM-dd'T'HH:mm"),
        location: data.location,
        meetingType: data.meetingType,
        status: data.status,
        notes: data.notes || '',
      });
    } catch (error) {
      toast.error('Failed to load meeting');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSaving(true);

    try {
      await apiClient.updateMeeting(meetingId, {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        meetingType: data.meetingType as MeetingType,
        status: data.status as MeetingStatus,
        notes: data.notes || undefined,
      });

      toast.success('Meeting updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to update meeting');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await apiClient.deleteMeeting(meetingId);
      toast.success('Meeting deleted successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to delete meeting');
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Meeting</CardTitle>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete Meeting
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Meeting Title" error={errors.title?.message} {...register('title')} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
                  <p className="text-gray-900">
                    {meeting?.candidate?.name} – {meeting?.candidate?.appliedPosition?.name}
                  </p>
                </div>

                <Input
                  label="Start Time"
                  type="datetime-local"
                  error={errors.startTime?.message}
                  {...register('startTime')}
                />

                <Input
                  label="End Time"
                  type="datetime-local"
                  error={errors.endTime?.message}
                  {...register('endTime')}
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
                  {...register('notes')}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                  Update Meeting
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
