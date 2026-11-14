'use client';

import { ArrowLeft, Building2, CalendarDays, Mail, Pencil, Phone, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/use-auth';
import { PatientFormDialog } from '@/features/patients/patient-form-dialog';
import { PatientCard, PatientDemographics, PatientIdentity, RowActions } from '@/features/patients/patient-row';
import { useUrlState } from '@/hooks/use-url-state';
import { ApiError, errorMessage } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import type { Patient } from '@/lib/types';
import { useDeleteDoctor, useDoctor, useDoctorPatients, useRemoveDoctorPatient } from './api';
import { DoctorFormDialog } from './doctor-form-dialog';

const PATIENT_LIST_DEFAULTS = { page: 1, limit: 10, search: '' };

function InfoItem({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

export function DoctorDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { isAdmin } = useCurrentUser();
  const { data: doctor, isLoading, error } = useDoctor(id);
  const { state: params, setState } = useUrlState(PATIENT_LIST_DEFAULTS);
  const patients = useDoctorPatients(id, params);
  const removePatient = useRemoveDoctorPatient(id);
  const deleteDoctor = useDeleteDoctor();

  const [editingDoctor, setEditingDoctor] = useState(false);
  const [confirmDoctorDelete, setConfirmDoctorDelete] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  const onSearch = useCallback((search: string) => setState({ search }), [setState]);
  const onPageChange = useCallback((page: number) => setState({ page }), [setState]);
  const onLimitChange = useCallback((limit: number) => setState({ limit }), [setState]);

  const columns = useMemo<Column<Patient>[]>(
    () => [
      { key: 'name', header: 'Patient', cell: (p) => <PatientIdentity patient={p} /> },
      { key: 'demo', header: 'Age / Gender', cell: (p) => <PatientDemographics patient={p} /> },
      { key: 'condition', header: 'Condition', cell: (p) => <span className="text-fg-2">{p.condition}</span> },
      { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
      { key: 'date', header: 'Admitted', cell: (p) => <span className="text-fg-2 tabular-nums">{formatDate(p.admissionDate)}</span> },
      ...(isAdmin
        ? [{ key: 'actions', header: <span className="sr-only">Actions</span>, className: 'w-16', cell: (p: Patient) => <RowActions name={p.name} onDelete={() => setDeletingPatient(p)} /> }]
        : []),
    ],
    [isAdmin],
  );

  if (error) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <Card>
        <EmptyState
          icon={Users}
          title={notFound ? 'Doctor not found' : 'Could not load doctor'}
          description={notFound ? 'This doctor may have been removed.' : errorMessage(error)}
          action={<Link href="/doctors" className="text-sm font-medium text-primary">Back to doctors</Link>}
        />
      </Card>
    );
  }

  return (
    <>
      <Link href="/doctors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden />
        All doctors
      </Link>

      <Card className="mb-6 p-5 sm:p-6">
        {isLoading || !doctor ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={doctor.name} size="lg" />
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{doctor.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{doctor.specialization}</Badge>
                    <span className="text-sm text-muted">
                      {formatNumber(doctor.patientCount)} {doctor.patientCount === 1 ? 'patient' : 'patients'}
                    </span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditingDoctor(true)}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button variant="secondary" className="text-danger" onClick={() => setConfirmDoctorDelete(true)} aria-label="Delete doctor">
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>
            <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
              <InfoItem icon={Building2} label="Hospital">{doctor.hospital}</InfoItem>
              <InfoItem icon={Phone} label="Phone">
                <a href={`tel:${doctor.phone.replace(/\s/g, '')}`} className="hover:text-primary">{doctor.phone}</a>
              </InfoItem>
              <InfoItem icon={Mail} label="Email">
                <a href={`mailto:${doctor.email}`} className="hover:text-primary">{doctor.email}</a>
              </InfoItem>
              <InfoItem icon={CalendarDays} label="Joined">{formatDate(doctor.createdAt)}</InfoItem>
            </dl>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Patients"
          description={patients.data ? `${formatNumber(patients.data.meta.total)} under this doctor’s care` : 'Loading…'}
          action={
            isAdmin &&
            doctor && (
              <Button size="sm" onClick={() => setAddingPatient(true)}>
                <Plus />
                Add patient
              </Button>
            )
          }
        />
        <div className="border-b border-line p-4 sm:px-5">
          <SearchInput value={params.search} onSearch={onSearch} placeholder="Search this doctor’s patients…" className="sm:max-w-sm" />
        </div>
        <DataTable
          caption={`Patients of ${doctor?.name ?? 'doctor'}`}
          columns={columns}
          rows={patients.data?.data}
          rowKey={(p) => p._id}
          isLoading={patients.isLoading}
          isFetching={patients.isFetching && patients.isPlaceholderData}
          mobileCard={(p) => <PatientCard patient={p} actions={isAdmin && <RowActions name={p.name} onDelete={() => setDeletingPatient(p)} />} />}
          empty={
            <EmptyState
              icon={UserPlus}
              title={params.search ? 'No patients match' : 'No patients yet'}
              description={params.search ? 'Try a different search term.' : 'Patients added for this doctor will appear here.'}
              action={isAdmin && !params.search && <Button onClick={() => setAddingPatient(true)}><Plus />Add first patient</Button>}
            />
          }
        />
        {patients.data && patients.data.meta.total > 0 && (
          <Pagination meta={patients.data.meta} onPageChange={onPageChange} onLimitChange={onLimitChange} noun="patients" />
        )}
      </Card>

      {doctor && (
        <>
          <DoctorFormDialog open={editingDoctor} onClose={() => setEditingDoctor(false)} doctor={doctor} />
          <PatientFormDialog mode="create" open={addingPatient} onClose={() => setAddingPatient(false)} doctorId={doctor._id} doctorName={doctor.name} />
        </>
      )}
      <ConfirmDialog
        open={!!deletingPatient}
        title="Remove patient?"
        description={`${deletingPatient?.name ?? 'This patient'} will be permanently deleted from ${doctor?.name ?? 'this doctor'}’s patient list.`}
        loading={removePatient.isPending}
        onConfirm={() =>
          deletingPatient &&
          removePatient.mutate(deletingPatient._id, {
            onSuccess: () => {
              toast.success(`${deletingPatient.name} was removed`);
              setDeletingPatient(null);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
        onClose={() => setDeletingPatient(null)}
      />
      <ConfirmDialog
        open={confirmDoctorDelete}
        title="Delete doctor?"
        description={
          doctor?.patientCount
            ? `${doctor.name} still has ${doctor.patientCount} patients. Reassign or remove them before deleting this doctor.`
            : `${doctor?.name ?? 'This doctor'} will be permanently deleted.`
        }
        loading={deleteDoctor.isPending}
        onConfirm={() =>
          deleteDoctor.mutate(id, {
            onSuccess: () => {
              toast.success('Doctor deleted');
              router.replace('/doctors');
            },
            onError: (err) => {
              toast.error(errorMessage(err));
              setConfirmDoctorDelete(false);
            },
          })
        }
        onClose={() => setConfirmDoctorDelete(false)}
      />
    </>
  );
}
