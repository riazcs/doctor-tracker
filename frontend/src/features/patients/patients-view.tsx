'use client';

import { Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { STATUS_META, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { DateRangeFilter, FilterBar } from '@/components/ui/filter-bar';
import { Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useDoctorOptions } from '@/features/doctors/api';
import { useUrlState } from '@/hooks/use-url-state';
import { errorMessage } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import { GENDERS, PATIENT_STATUSES, type Patient } from '@/lib/types';
import { PATIENT_FILTER_DEFAULTS, PATIENT_SORT_OPTIONS, useDeletePatient, usePatientFacets, usePatients } from './api';
import { PatientFormDialog } from './patient-form-dialog';
import { DoctorLink, PatientCard, PatientDemographics, PatientIdentity, RowActions } from './patient-row';

export function PatientsView() {
  const { isAdmin } = useCurrentUser();
  const { state: filters, setState, reset, activeCount } = useUrlState(PATIENT_FILTER_DEFAULTS);
  const { data, isLoading, isFetching, isPlaceholderData } = usePatients(filters);
  const { data: facets } = usePatientFacets();
  const { data: doctors } = useDoctorOptions();
  const remove = useDeletePatient();

  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const onSearch = useCallback((search: string) => setState({ search }), [setState]);
  const onPageChange = useCallback((page: number) => setState({ page }), [setState]);
  const onLimitChange = useCallback((limit: number) => setState({ limit }), [setState]);

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    remove.mutate(target._id, {
      onSuccess: () => toast.success(`${target.name} was removed`),
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  const columns = useMemo<Column<Patient>[]>(
    () => [
      { key: 'name', header: 'Patient', cell: (p) => <PatientIdentity patient={p} /> },
      { key: 'demo', header: 'Age / Gender', priority: 'low', cell: (p) => <PatientDemographics patient={p} /> },
      { key: 'condition', header: 'Condition', cell: (p) => <span className="text-fg-2">{p.condition}</span> },
      { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
      { key: 'doctor', header: 'Doctor', className: 'max-w-52', cell: (p) => <DoctorLink patient={p} /> },
      { key: 'date', header: 'Admitted', cell: (p) => <span className="text-fg-2 tabular-nums">{formatDate(p.admissionDate)}</span> },
      ...(isAdmin
        ? [{ key: 'actions', header: <span className="sr-only">Actions</span>, className: 'w-24', cell: (p: Patient) => <RowActions name={p.name} onEdit={() => setEditing(p)} onDelete={() => setDeleting(p)} /> }]
        : []),
    ],
    [isAdmin],
  );

  const mobileCard = useCallback(
    (p: Patient) => (
      <PatientCard patient={p} showDoctor actions={isAdmin && <RowActions name={p.name} onEdit={() => setEditing(p)} onDelete={() => setDeleting(p)} />} />
    ),
    [isAdmin],
  );

  return (
    <>
      <PageHeader title="Patients" description={data ? `${formatNumber(data.meta.total)} patients match your filters` : 'All patients across every doctor'} />

      <Card className="overflow-hidden">
        <FilterBar
          activeCount={activeCount}
          onClear={reset}
          search={<SearchInput value={filters.search} onSearch={onSearch} placeholder="Search name, phone, email, condition…" />}
          sort={
            <Select aria-label="Sort patients" value={filters.sort} onChange={(e) => setState({ sort: e.target.value })}>
              {PATIENT_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          }
        >
          <Select aria-label="Condition" value={filters.condition} onChange={(e) => setState({ condition: e.target.value })}>
            <option value="">All conditions</option>
            {facets?.conditions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select aria-label="Status" value={filters.status} onChange={(e) => setState({ status: e.target.value })}>
            <option value="">Any status</option>
            {PATIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Select aria-label="Gender" value={filters.gender} onChange={(e) => setState({ gender: e.target.value })}>
            <option value="">Any gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g[0].toUpperCase() + g.slice(1)}
              </option>
            ))}
          </Select>
          <Select aria-label="Doctor" value={filters.doctor} onChange={(e) => setState({ doctor: e.target.value })}>
            <option value="">All doctors</option>
            {doctors?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>
          <DateRangeFilter label="Admitted" from={filters.from} to={filters.to} onChange={setState} />
        </FilterBar>

        <DataTable
          caption="Patients"
          columns={columns}
          rows={data?.data}
          rowKey={(p) => p._id}
          isLoading={isLoading}
          isFetching={isFetching && isPlaceholderData}
          mobileCard={mobileCard}
          empty={
            <EmptyState
              icon={Users}
              title={filters.search || activeCount ? 'No patients match' : 'No patients yet'}
              description={filters.search || activeCount ? 'Try a different search term or clear the filters.' : 'Patients are added from a doctor’s profile page.'}
              action={(filters.search || activeCount > 0) && <Button variant="secondary" onClick={reset}>Clear all</Button>}
            />
          }
        />
        {data && data.meta.total > 0 && <Pagination meta={data.meta} onPageChange={onPageChange} onLimitChange={onLimitChange} noun="patients" />}
      </Card>

      <PatientFormDialog mode="edit" open={!!editing} patient={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete patient?"
        description={`${deleting?.name ?? 'This patient'} and their record will be permanently removed. This cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
