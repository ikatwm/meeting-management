'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import { CandidateForm } from '@/components/forms/CandidateForm';
import type { Candidate, CandidateStatus } from '@/types';

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = Number(params.id);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getCandidateById(candidateId);
        setCandidate(data);
      } catch (error) {
        toast.error('Failed to load candidate');
        router.push('/candidates');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCandidate();
  }, [candidateId]);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    appliedPositionId: number;
    status: CandidateStatus;
    interviewNotes?: string;
  }) => {
    setIsSaving(true);

    try {
      await apiClient.updateCandidate(candidateId, data);
      toast.success('Candidate updated successfully!');
      router.push(`/candidates/${candidateId}`);
    } catch (error) {
      toast.error('Failed to update candidate');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/candidates/${candidateId}`);
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
        <Card>
          <CardHeader>
            <CardTitle>Edit Candidate</CardTitle>
          </CardHeader>
          <CardContent>
            <CandidateForm
              candidate={candidate}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSaving}
              submitLabel="Update Candidate"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
