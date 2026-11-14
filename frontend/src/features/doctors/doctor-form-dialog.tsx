'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { applyServerErrors } from '@/lib/form-errors';
import type { Doctor } from '@/lib/types';
import { doctorSchema, type DoctorValues } from '@/lib/validators';
import { useDoctorFacets, useSaveDoctor } from './api';

const FIELDS = ['name', 'specialization', 'hospital', 'phone', 'email'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  doctor?: Doctor;
}

export function DoctorFormDialog({ open, onClose, doctor }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={doctor ? 'Edit doctor' : 'Add doctor'} description={doctor ? doctor.name : 'Register a new doctor in the system.'}>
      {/* keyed so the form resets when switching between doctors */}
      <DoctorForm key={doctor?._id ?? 'new'} doctor={doctor} onDone={onClose} />
    </Dialog>
  );
}

function DoctorForm({ doctor, onDone }: { doctor?: Doctor; onDone: () => void }) {
  const save = useSaveDoctor(doctor?._id);
  const { data: facets } = useDoctorFacets();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<DoctorValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: doctor?.name ?? '',
      specialization: doctor?.specialization ?? '',
      hospital: doctor?.hospital ?? '',
      phone: doctor?.phone ?? '',
      email: doctor?.email ?? '',
    },
  });

  const onSubmit = handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: () => {
        toast.success(doctor ? 'Doctor updated' : 'Doctor added');
        onDone();
      },
      onError: (err) => applyServerErrors(err, setError, FIELDS),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" htmlFor="d-name" error={errors.name?.message} required className="sm:col-span-2">
        <Input {...fieldA11y('d-name', errors.name?.message)} placeholder="Dr. Jane Doe" autoFocus {...register('name')} />
      </Field>
      <Field label="Specialization" htmlFor="d-spec" error={errors.specialization?.message} required>
        <Input {...fieldA11y('d-spec', errors.specialization?.message)} list="spec-options" placeholder="Cardiology" {...register('specialization')} />
        <datalist id="spec-options">{facets?.specializations.map((s) => <option key={s} value={s} />)}</datalist>
      </Field>
      <Field label="Hospital" htmlFor="d-hospital" error={errors.hospital?.message} required>
        <Input {...fieldA11y('d-hospital', errors.hospital?.message)} list="hospital-options" placeholder="City General Hospital" {...register('hospital')} />
        <datalist id="hospital-options">{facets?.hospitals.map((h) => <option key={h} value={h} />)}</datalist>
      </Field>
      <Field label="Phone" htmlFor="d-phone" error={errors.phone?.message} required>
        <Input {...fieldA11y('d-phone', errors.phone?.message)} type="tel" autoComplete="tel" placeholder="+880 1700-000000" {...register('phone')} />
      </Field>
      <Field label="Email" htmlFor="d-email" error={errors.email?.message} required>
        <Input {...fieldA11y('d-email', errors.email?.message)} type="email" autoComplete="email" placeholder="jane.doe@hospital.com" {...register('email')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <Button variant="secondary" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} disabled={doctor && !isDirty}>
          {doctor ? 'Save changes' : 'Add doctor'}
        </Button>
      </div>
    </form>
  );
}
