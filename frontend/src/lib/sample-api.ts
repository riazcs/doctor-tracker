import type { DashboardStats, Doctor, Patient, StatsRange, User } from './types';

const viewer: User = { id: 'sample-viewer', name: 'Sample Viewer', email: 'preview@example.invalid', role: 'viewer', sample: true };
const day = 86_400_000;

function records() {
  const now = Date.now();
  const date = (days: number) => new Date(now - days * day).toISOString();
  const doctors: Doctor[] = ['Alex Morgan', 'Sam Taylor', 'Jordan Lee', 'Casey Rivera'].map((name, i) => ({
    _id: `sample-doctor-${i + 1}`, name, specialization: ['Cardiology', 'Neurology', 'Pediatrics', 'General Medicine'][i],
    hospital: i % 2 ? 'Sample Community Clinic' : 'Sample Medical Center',
    email: `doctor${i + 1}@example.invalid`, phone: 'Not provided', patientCount: 6,
    createdAt: date(200 + i * 10), updatedAt: date(2),
  }));
  const patients: Patient[] = Array.from({ length: 24 }, (_, i) => ({
    _id: `sample-patient-${i + 1}`, name: `Sample Patient ${String(i + 1).padStart(2, '0')}`,
    age: 8 + (i * 7) % 75, gender: i % 2 ? 'female' : 'male', phone: 'Not provided',
    condition: ['Hypertension', 'Migraine', 'Routine checkup', 'Diabetes'][i % 4],
    status: (['stable', 'under_observation', 'recovered', 'critical'] as const)[i % 4],
    admissionDate: date(i < 8 ? i * 4 : 35 + (i - 8) * 19), createdAt: date(i < 8 ? i * 4 : 35 + (i - 8) * 19),
    doctor: doctors[i % 4], notes: 'Fictional record for the read-only sample preview.',
  }));
  return { doctors, patients, now };
}

export function sampleResponse(request: Request): Response {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const params = url.searchParams;
  const json = (body: unknown, status = 200) => Response.json(body, {
    status, headers: { 'cache-control': 'no-store', 'x-data-mode': 'sample' },
  });
  const error = (status: number, code: string, message: string) => json({ error: { code, message } }, status);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return error(403, 'SAMPLE_READ_ONLY', 'Sample preview is read-only. Connect a backend to sign in or save changes.');
  }
  if (path === 'auth/me') return json({ data: viewer });
  if (path === 'health') return json({ status: 'sample', db: 'not-connected' });
  const { doctors, patients, now } = records();
  const countBy = (values: string[]) => [...new Set(values)].map(name => ({ name, count: values.filter(v => v === name).length }));

  if (path === 'stats') {
    const requested = params.get('range') ?? '30d';
    const range: StatsRange = (['7d', '30d', '90d', '12m'] as const).find(r => r === requested) ?? '30d';
    const days = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }[range];
    const windowPatients = patients.filter(p => Date.parse(p.admissionDate) >= now - days * day);
    const unit = range === '12m' ? 'month' : range === '90d' ? 'week' : 'day';
    const key = (value: string) => {
      const date = new Date(value);
      if (unit === 'month') date.setUTCDate(1);
      if (unit === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
      return date.toISOString().slice(0, 10);
    };
    const keys = [...new Set(Array.from({ length: days }, (_, i) => key(new Date(now - (days - i - 1) * day).toISOString())))];
    const stats: DashboardStats = {
      range, unit,
      totals: { doctors: doctors.length, patients: patients.length, avgPatientsPerDoctor: 6,
        newPatients: windowPatients.length, newPatientsChange: null,
        criticalPatients: windowPatients.filter(p => p.status === 'critical').length, newDoctors: doctors.filter(d => Date.parse(d.createdAt) >= now - days * day).length },
      trend: keys.map(date => ({ date, patients: windowPatients.filter(p => key(p.admissionDate) === date).length,
        critical: windowPatients.filter(p => key(p.admissionDate) === date && p.status === 'critical').length })),
      byCondition: countBy(windowPatients.map(p => p.condition)),
      byStatus: countBy(windowPatients.map(p => p.status)) as DashboardStats['byStatus'],
      byGender: countBy(windowPatients.map(p => p.gender)) as DashboardStats['byGender'],
      byAge: countBy(windowPatients.map(p => p.age < 18 ? '0–17' : p.age < 35 ? '18–34' : p.age < 50 ? '35–49' : p.age < 65 ? '50–64' : '65+')),
      bySpecialization: doctors.map(d => ({ name: d.specialization, doctors: 1, patients: d.patientCount })),
      topDoctors: doctors.map(d => ({ id: d._id, name: d.name, specialization: d.specialization, hospital: d.hospital, patients: d.patientCount })),
    };
    return json({ data: stats });
  }
  if (path === 'doctors/facets') return json({ data: { specializations: doctors.map(d => d.specialization), hospitals: [...new Set(doctors.map(d => d.hospital))] } });
  if (path === 'doctors/options') return json({ data: doctors });
  if (path === 'patients/facets') return json({ data: { conditions: [...new Set(patients.map(p => p.condition))] } });

  function paginate<T extends Doctor | Patient>(rows: T[]) {
    const search = (params.get('search') ?? '').trim().toLowerCase();
    let filtered = rows.filter(row => !search || [row.name, row.phone, row.email,
      'condition' in row ? row.condition : row.specialization, 'hospital' in row ? row.hospital : ''].some(v => v?.toLowerCase().includes(search)));
    for (const field of ['specialization', 'hospital', 'condition', 'status', 'gender', 'doctor']) {
      const value = params.get(field);
      if (value) filtered = filtered.filter(row => field === 'doctor' ? ('doctor' in row && row.doctor?._id === value) : (row as unknown as Record<string, unknown>)[field] === value);
    }
    filtered = filtered.filter(row => {
      const date = 'admissionDate' in row ? row.admissionDate : row.createdAt;
      return (!params.get('from') || date >= params.get('from')!) && (!params.get('to') || date.slice(0, 10) <= params.get('to')!);
    });
    const sort = params.get('sort');
    filtered.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'age' && 'age' in a && 'age' in b) return b.age - a.age;
      if (sort === 'patients' && 'patientCount' in a && 'patientCount' in b) return b.patientCount - a.patientCount;
      const aDate = 'admissionDate' in a ? a.admissionDate : a.createdAt;
      const bDate = 'admissionDate' in b ? b.admissionDate : b.createdAt;
      return sort === 'oldest' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
    });
    const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
    const limit = Math.min(50, Math.max(1, Math.floor(Number(params.get('limit')) || 10)));
    return json({ data: filtered.slice((page - 1) * limit, page * limit), meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } });
  }
  if (path === 'doctors') return paginate(doctors);
  if (path === 'patients') return paginate(patients);
  const segments = path.split('/');
  if (segments[0] === 'doctors' && segments.length === 3 && segments[2] === 'patients') {
    if (!doctors.some(d => d._id === segments[1])) return error(404, 'NOT_FOUND', 'Sample doctor not found.');
    return paginate(patients.filter(p => p.doctor?._id === segments[1]));
  }
  const record = segments.length === 2 && (segments[0] === 'doctors' ? doctors.find(d => d._id === segments[1]) : segments[0] === 'patients' ? patients.find(p => p._id === segments[1]) : undefined);
  return record ? json({ data: record }) : error(404, 'NOT_FOUND', 'Sample record not found.');
}
