import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoctorDetailView } from '@/features/doctors/doctor-detail-view';

export const metadata: Metadata = { title: 'Doctor' };

export default async function DoctorPage({ params }: PageProps<'/doctors/[id]'>) {
  const { id } = await params;
  return (
    <Suspense>
      <DoctorDetailView id={id} />
    </Suspense>
  );
}
