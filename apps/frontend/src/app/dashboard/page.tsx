'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/Loading';
import type { Meeting } from '@/types';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadMeetings();
  }, [pagination.page]);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getMeetings({
        page: pagination.page,
        limit: pagination.limit,
      });

      setMeetings(response?.data || []);
      setPagination({
        page: response?.pagination?.page || 1,
        limit: response?.pagination?.pageSize || 10,
        total: response?.pagination?.total || 0,
        totalPages: response?.pagination?.totalPages || 0,
      });
    } catch (error) {
      toast.error('Failed to load meetings');
      console.error(error);
      setMeetings([]); // Ensure meetings is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status: string) => {
    return status === 'confirmed' ? (
      <Badge variant="success">Confirmed</Badge>
    ) : (
      <Badge variant="warning">Pending</Badge>
    );
  };

  if (isLoading && meetings.length === 0) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Meetings</h1>
          <Link href="/meetings/new">
            <Button>Schedule New Meeting</Button>
          </Link>
        </div>

        {!meetings || meetings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings scheduled</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by scheduling a new meeting.</p>
              <div className="mt-6">
                <Link href="/meetings/new">
                  <Button>Schedule New Meeting</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{meeting.title}</CardTitle>
                      <p className="mt-1 text-sm text-gray-600">
                        {meeting.candidate?.name} – {meeting.candidate?.appliedPosition?.name}
                      </p>
                    </div>
                    {getStatusBadge(meeting.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-5 w-5 mr-2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {format(new Date(meeting.startTime), 'MMM dd, yyyy')}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-5 w-5 mr-2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {format(new Date(meeting.startTime), 'h:mm a')} –{' '}
                      {format(new Date(meeting.endTime), 'h:mm a')}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-5 w-5 mr-2 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {meeting.meetingType.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/candidates/${meeting.candidateId}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/meetings/${meeting.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="secondary"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="secondary"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
