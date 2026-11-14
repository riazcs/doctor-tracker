'use client';

import { ChevronRight, Plus, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { DateRangeFilter, FilterBar } from '@/components/ui/filter-bar';
import { Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useUrlState } from '@/hooks/use-url-state';
import { formatDate, formatNumber } from '@/lib/format';
import type { Doctor } from '@/lib/types';
import { DOCTOR_FILTER_DEFAULTS, DOCTOR_SORT_OPTIONS, useDoctorFacets, useDoctors } from './api';
import { DoctorFormDialog } from './doctor-form-dialog';

export function DoctorsView() {
  const router = useRouter();
  const { isAdmin } = useCurrentUser();
  const { state: filters, setState, reset, activeCount } = useUrlState(DOCTOR_FILTER_DEFAULTS);
  const { data, isLoading, isFetching, isPlaceholderData } = useDoctors(filters);
  const { data: facets } = useDoctorFacets();
  const [creating, setCreating] = useState(false);

  const onSearch = useCallback((search: string) => setState({ search }), [setState]);
  const onPageChange = useCallback((page: number) => setState({ page }), [setState]);
  const onLimitChange = useCallback((limit: number) => setState({ limit }), [setState]);

  const columns = useMemo<Column<Doctor>[]>(
    () => [
      {
        key: 'name',
        header: 'Doctor',
        cell: (d) => (
          <div className="flex items-center gap-3">
            <Avatar name={d.name} />
            <div className="min-w-0">
              <Link href={`/doctors/${d._id}`} className="font-medium text-fg hover:text-primary" onClick={(e) => e.stopPropagation()}>
                {d.name}
              </Link>
              <p className="truncate text-[13px] text-muted">{d.email}</p>
            </div>
          </div>
        ),
      },
      { key: 'spec', header: 'Specialization', cell: (d) => <Badge tone="primary">{d.specialization}</Badge> },
      { key: 'hospital', header: 'Hospital', cell: (d) => <span className="text-fg-2">{d.hospital}</span> },
      { key: 'phone', header: 'Phone', priority: 'low', cell: (d) => <span className="text-fg-2 tabular-nums">{d.phone}</span> },
      {
        key: 'patients',
        header: 'Patients',
        className: 'text-right',
        cell: (d) => <span className="font-medium tabular-nums">{formatNumber(d.patientCount)}</span>,
      },
      { key: 'joined', header: 'Joined', priority: 'low', cell: (d) => <span className="text-fg-2 tabular-nums">{formatDate(d.createdAt)}</span> },
      { key: 'go', header: <span className="sr-only">Open</span>, className: 'w-10', cell: () => <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden /> },
    ],
    [],
  );

  const mobileCard = useCallback(
    (d: Doctor) => (
      <Link href={`/doctors/${d._id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2">
        <Avatar name={d.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{d.name}</p>
          <p className="truncate text-[13px] text-muted">
            {d.specialization} · {d.hospital}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{d.patientCount}</p>
          <p className="text-[11px] text-muted">patients</p>
        </div>
      </Link>
    ),
    [],
  );

  return (
    <>
      <PageHeader
        title="Doctors"
        description={data ? `${formatNumber(data.meta.total)} doctors match your filters` : 'Manage doctors and their patients'}
        actions={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              Add doctor
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <FilterBar
          activeCount={activeCount}
          onClear={reset}
          search={<SearchInput value={filters.search} onSearch={onSearch} placeholder="Search name, email, hospital, phone…" />}
          sort={
            <Select aria-label="Sort doctors" value={filters.sort} onChange={(e) => setState({ sort: e.target.value })}>
              {DOCTOR_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          }
        >
          <Select aria-label="Specialization" value={filters.specialization} onChange={(e) => setState({ specialization: e.target.value })}>
            <option value="">All specializations</option>
            {facets?.specializations.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select aria-label="Hospital" value={filters.hospital} onChange={(e) => setState({ hospital: e.target.value })}>
            <option value="">All hospitals</option>
            {facets?.hospitals.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </Select>
          <DateRangeFilter label="Joined" from={filters.from} to={filters.to} onChange={setState} />
        </FilterBar>

        <DataTable
          caption="Doctors"
          columns={columns}
          rows={data?.data}
          rowKey={(d) => d._id}
          isLoading={isLoading}
          isFetching={isFetching && isPlaceholderData}
          onRowClick={(d) => router.push(`/doctors/${d._id}`)}
          mobileCard={mobileCard}
          empty={
            filters.search || activeCount ? (
              <EmptyState
                icon={Stethoscope}
                title="No doctors match"
                description="Try a different search term or clear the filters."
                action={<Button variant="secondary" onClick={reset}>Clear all</Button>}
              />
            ) : (
              <EmptyState
                icon={Stethoscope}
                title="No doctors yet"
                description="Add your first doctor to start tracking patients."
                action={isAdmin && <Button onClick={() => setCreating(true)}><Plus />Add doctor</Button>}
              />
            )
          }
        />
        {data && data.meta.total > 0 && <Pagination meta={data.meta} onPageChange={onPageChange} onLimitChange={onLimitChange} noun="doctors" />}
      </Card>

      <DoctorFormDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

