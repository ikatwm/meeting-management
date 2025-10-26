'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import type { Candidate, CandidateHistory, Meeting } from '@/types';

export default function CandidateSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [history, setHistory] = useState<CandidateHistory[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  const loadCandidateData = async () => {
    try {
      setIsLoading(true);
      const [candidateData, meetingsData, historyData] = await Promise.all([
        apiClient.getCandidateById(candidateId),
        apiClient.getMeetings({ candidateId, limit: 100 }),
        apiClient.getCandidateHistory(candidateId),
      ]);

      setCandidate(candidateData);
      setMeetings(meetingsData.data);
      setHistory(historyData);
    } catch (error) {
      toast.error('Failed to load candidate data');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidateData();
  }, [candidateId]);

  const handleSaveFeedback = async () => {
    setIsSavingFeedback(true);
    try {
      await apiClient.updateCandidate(candidateId, {
        interviewNotes: feedbackText,
      });
      toast.success('Feedback saved successfully!');
      setIsFeedbackModalOpen(false);
      loadCandidateData();
    } catch (error) {
      toast.error('Failed to save feedback');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleCancelMeeting = async (meetingId: number) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

    try {
      await apiClient.deleteMeeting(meetingId);
      toast.success('Meeting cancelled successfully!');
      loadCandidateData();
    } catch (error) {
      toast.error('Failed to cancel meeting');
    }
  };

  const handleDeleteCandidate = async () => {
    if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteCandidate(candidateId);
      toast.success('Candidate deleted successfully!');
      router.push('/candidates');
    } catch (error) {
      toast.error('Failed to delete candidate');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      applied: 'info',
      screening: 'warning',
      interview: 'warning',
      offer: 'success',
      rejected: 'danger',
      hired: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getMeetingStatusBadge = (status: string) => {
    return status === 'confirmed' ? (
      <Badge variant="success">Confirmed</Badge>
    ) : (
      <Badge variant="warning">Pending</Badge>
    );
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{candidate.name}</CardTitle>
                <p className="mt-1 text-sm text-gray-600">{candidate.appliedPosition?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(candidate.status)}
                <Link href={`/candidates/${candidate.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={handleDeleteCandidate}>
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="mt-1 text-sm text-gray-900">{candidate.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Applied</p>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(candidate.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Meetings</CardTitle>
                <Link href="/meetings/new">
                  <Button size="sm">Schedule Meeting</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-sm text-gray-500">No meetings scheduled</p>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                        {getMeetingStatusBadge(meeting.status)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📅 {format(new Date(meeting.startTime), 'MMM dd, yyyy')}</p>
                        <p>
                          🕐 {format(new Date(meeting.startTime), 'h:mm a')} –{' '}
                          {format(new Date(meeting.endTime), 'h:mm a')}
                        </p>
                        <p>📍 {meeting.meetingType.replace('_', ' ')}</p>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link href={`/meetings/${meeting.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelMeeting(meeting.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interview Notes</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setFeedbackText(candidate.interviewNotes || '');
                    setIsFeedbackModalOpen(true);
                  }}
                >
                  Add/Edit Feedback
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {candidate.interviewNotes ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {candidate.interviewNotes}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No interview notes yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No history available</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {item.meeting?.title || 'Feedback'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(item.recordedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Add Interview Feedback"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            <textarea
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={6}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your interview feedback..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSaveFeedback}
              isLoading={isSavingFeedback}
              disabled={isSavingFeedback || !feedbackText.trim()}
            >
              Save Feedback
            </Button>
            <Button variant="secondary" onClick={() => setIsFeedbackModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
