'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { toast } from 'sonner';
import { STATUS_META } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { useAddPatient, useDoctorOptions } from '@/features/doctors/api';
import { toDateInput, todayInput } from '@/lib/format';
import { applyServerErrors } from '@/lib/form-errors';
import { GENDERS, PATIENT_STATUSES, type Patient } from '@/lib/types';
import { patientSchema, type PatientValues } from '@/lib/validators';
import { usePatientFacets, useUpdatePatient } from './api';

const FIELDS = ['name', 'age', 'gender', 'phone', 'email', 'condition', 'status', 'admissionDate', 'notes', 'doctor'] as const;

type Props =
  | { mode: 'create'; doctorId: string; doctorName: string; open: boolean; onClose: () => void; patient?: undefined }
  | { mode: 'edit'; patient: Patient | null; open: boolean; onClose: () => void; doctorId?: undefined; doctorName?: undefined };

export function PatientFormDialog(props: Props) {
  const { open, onClose } = props;
  const title = props.mode === 'create' ? 'Add patient' : 'Edit patient';
  const description = props.mode === 'create' ? `Under the care of ${props.doctorName}` : props.patient?.name;
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size="lg">
      {props.mode === 'create' ? (
        <CreateForm doctorId={props.doctorId} onDone={onClose} />
      ) : (
        props.patient && <EditForm key={props.patient._id} patient={props.patient} onDone={onClose} />
      )}
    </Dialog>
  );
}

function CreateForm({ doctorId, onDone }: { doctorId: string; onDone: () => void }) {
  const add = useAddPatient(doctorId);
  return (
    <PatientForm
      submitLabel="Add patient"
      pending={add.isPending}
      onCancel={onDone}
      onSubmit={(values, setError) =>
        add.mutate(values, {
          onSuccess: () => {
            toast.success('Patient added');
            onDone();
          },
          onError: (err) => applyServerErrors(err, setError, FIELDS),
        })
      }
    />
  );
}

function EditForm({ patient, onDone }: { patient: Patient; onDone: () => void }) {
  const update = useUpdatePatient();
  return (
    <PatientForm
      patient={patient}
      showDoctor
      submitLabel="Save changes"
      pending={update.isPending}
      onCancel={onDone}
      onSubmit={(values, setError) =>
        update.mutate(
          { id: patient._id, values },
          {
            onSuccess: () => {
              toast.success('Patient updated');
              onDone();
            },
            onError: (err) => applyServerErrors(err, setError, FIELDS),
          },
        )
      }
    />
  );
}

interface PatientFormProps {
  patient?: Patient;
  showDoctor?: boolean;
  submitLabel: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: PatientValues, setError: ReturnType<typeof useForm<PatientValues>>['setError']) => void;
}

function PatientForm({ patient, showDoctor, submitLabel, pending, onCancel, onSubmit }: PatientFormProps) {
  const { data: facets } = usePatientFacets();
  const { data: doctors } = useDoctorOptions(Boolean(showDoctor));
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<z.input<typeof patientSchema>, unknown, PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name ?? '',
      age: patient?.age ?? '',
      gender: patient?.gender ?? ('' as PatientValues['gender']),
      phone: patient?.phone ?? '',
      email: patient?.email ?? '',
      condition: patient?.condition ?? '',
      status: patient?.status ?? 'stable',
      admissionDate: patient ? toDateInput(patient.admissionDate) : todayInput(),
      notes: patient?.notes ?? '',
      doctor: patient?.doctor?._id ?? '',
    },
  });

  const submit = handleSubmit((values) => {
    const { doctor, ...rest } = values;
    onSubmit(showDoctor && doctor ? { ...rest, doctor } : rest, setError as never);
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-6">
      <Field label="Full name" htmlFor="p-name" error={errors.name?.message} required className="sm:col-span-6">
        <Input {...fieldA11y('p-name', errors.name?.message)} placeholder="Patient name" autoFocus {...register('name')} />
      </Field>
      <Field label="Age" htmlFor="p-age" error={errors.age?.message} required className="sm:col-span-2">
        <Input {...fieldA11y('p-age', errors.age?.message)} type="number" inputMode="numeric" min={0} max={130} {...register('age')} />
      </Field>
      <Field label="Gender" htmlFor="p-gender" error={errors.gender?.message} required className="sm:col-span-2">
        <Select {...fieldA11y('p-gender', errors.gender?.message)} {...register('gender')}>
          <option value="" disabled>
            Select…
          </option>
          {GENDERS.map((g) => (
            <option key={g} value={g} className="capitalize">
              {g[0].toUpperCase() + g.slice(1)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Admission date" htmlFor="p-date" error={errors.admissionDate?.message} required className="sm:col-span-2">
        <Input {...fieldA11y('p-date', errors.admissionDate?.message)} type="date" max={todayInput()} {...register('admissionDate')} />
      </Field>
      <Field label="Phone" htmlFor="p-phone" error={errors.phone?.message} required className="sm:col-span-3">
        <Input {...fieldA11y('p-phone', errors.phone?.message)} type="tel" autoComplete="off" placeholder="+880 1700-000000" {...register('phone')} />
      </Field>
      <Field label="Email" htmlFor="p-email" error={errors.email?.message} hint="Optional" className="sm:col-span-3">
        <Input {...fieldA11y('p-email', errors.email?.message)} type="email" autoComplete="off" placeholder="name@mail.com" {...register('email')} />
      </Field>
      <Field label="Condition" htmlFor="p-condition" error={errors.condition?.message} required className="sm:col-span-3">
        <Input {...fieldA11y('p-condition', errors.condition?.message)} list="condition-options" placeholder="e.g. Hypertension" {...register('condition')} />
        <datalist id="condition-options">{facets?.conditions.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Status" htmlFor="p-status" error={errors.status?.message} required className="sm:col-span-3">
        <Select {...fieldA11y('p-status', errors.status?.message)} {...register('status')}>
          {PATIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </Field>
      {showDoctor && (
        <Field label="Assigned doctor" htmlFor="p-doctor" error={errors.doctor?.message} className="sm:col-span-6">
          <Select {...fieldA11y('p-doctor', errors.doctor?.message)} {...register('doctor')}>
            {!doctors && patient?.doctor && <option value={patient.doctor._id}>{patient.doctor.name}</option>}
            {doctors?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} — {d.specialization}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Notes" htmlFor="p-notes" error={errors.notes?.message} hint="Optional" className="sm:col-span-6">
        <Textarea {...fieldA11y('p-notes', errors.notes?.message)} rows={3} placeholder="Allergies, follow-up instructions…" {...register('notes')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-6">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={patient && !isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
