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
import { Input } from '@/components/ui/Input';
import { LoadingPage } from '@/components/ui/Loading';
import type { Candidate } from '@/types';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getCandidates({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined,
        });

        setCandidates(response?.data || []);
        setPagination({
          page: response?.pagination?.page || 1,
          limit: response?.pagination?.pageSize || 20,
          total: response?.pagination?.total || 0,
          totalPages: response?.pagination?.totalPages || 0,
        });
      } catch (error) {
        toast.error('Failed to load candidates');
        console.error(error);
        setCandidates([]); // Ensure candidates is always an array
      } finally {
        setIsLoading(false);
      }
    };

    void loadCandidates();
  }, [pagination.page, searchTerm]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
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

  if (isLoading && candidates.length === 0) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <Link href="/candidates/new">
            <Button>+ New Candidate</Button>
          </Link>
        </div>

        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search candidates by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {candidates.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No candidates found' : 'No candidates yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Candidates will appear here when they apply'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <Card key={candidate.id} hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{candidate.name}</CardTitle>
                    {getStatusBadge(candidate.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">{candidate.email}</p>
                    <p className="text-gray-900 font-medium">
                      {candidate.appliedPosition?.name || 'N/A'}
                    </p>
                    <p className="text-gray-500">
                      Applied: {format(new Date(candidate.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Link href={`/candidates/${candidate.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        View Profile
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
