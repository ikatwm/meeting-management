'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CandidateForm } from '@/components/forms/CandidateForm';
import type { CandidateStatus } from '@/types';

export default function NewCandidatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    appliedPositionId: number;
    status: CandidateStatus;
    interviewNotes?: string;
  }) => {
    setIsLoading(true);

    try {
      const candidate = await apiClient.createCandidate(data);
      toast.success('Candidate created successfully!');
      router.push(`/candidates/${candidate.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message?.includes('already exists')
          ? 'A candidate with this email already exists'
          : 'Failed to create candidate';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Candidate</CardTitle>
          </CardHeader>
          <CardContent>
            <CandidateForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              submitLabel="Create Candidate"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
