'use client';

import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, titleCase } from '@/lib/format';
import type { Patient } from '@/lib/types';

export function PatientIdentity({ patient }: { patient: Patient }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={patient.name} />
      <div className="min-w-0">
        <p className="font-medium text-fg">{patient.name}</p>
        <p className="truncate text-[13px] text-muted tabular-nums">{patient.phone}</p>
      </div>
    </div>
  );
}

export function PatientDemographics({ patient }: { patient: Patient }) {
  return (
    <span className="text-fg-2">
      {patient.age} yrs · {titleCase(patient.gender)}
    </span>
  );
}

export function DoctorLink({ patient }: { patient: Patient }) {
  if (!patient.doctor) return <span className="text-muted">Unassigned</span>;
  return (
    <Link href={`/doctors/${patient.doctor._id}`} className="block min-w-0 hover:text-primary">
      <span className="block truncate font-medium">{patient.doctor.name}</span>
      <span className="block truncate text-[13px] text-muted">{patient.doctor.specialization}</span>
    </Link>
  );
}

export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit?: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-0.5">
      {onEdit && (
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${name}`} title="Edit">
          <Pencil />
        </Button>
      )}
      <Button variant="danger-ghost" size="icon-sm" onClick={onDelete} aria-label={`Delete ${name}`} title="Delete">
        <Trash2 />
      </Button>
    </div>
  );
}

/** Mobile card used by both the Patients page and a doctor's patient list. */
export function PatientCard({ patient, showDoctor, actions }: { patient: Patient; showDoctor?: boolean; actions?: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <Avatar name={patient.name} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{patient.name}</p>
            <p className="text-[13px] text-muted">
              {patient.age} yrs · {titleCase(patient.gender)} · {formatDate(patient.admissionDate)}
            </p>
          </div>
          {actions}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={patient.status} />
          <span className="text-[13px] text-fg-2">{patient.condition}</span>
        </div>
        {showDoctor && patient.doctor && (
          <Link href={`/doctors/${patient.doctor._id}`} className="block truncate text-[13px] text-primary">
            {patient.doctor.name}
          </Link>
        )}
      </div>
    </div>
  );
}
