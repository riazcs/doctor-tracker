import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';

export type StatsRange = '7d' | '30d' | '90d' | '12m';

const RANGE_CONFIG: Record<StatsRange, { days?: number; months?: number; unit: 'day' | 'week' | 'month' }> = {
  '7d': { days: 7, unit: 'day' },
  '30d': { days: 30, unit: 'day' },
  '90d': { days: 90, unit: 'week' },
  '12m': { months: 12, unit: 'month' },
};

function startOfUTCDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Returns [start, end) for the current window and the equal-length window before it. */
function windows(range: StatsRange, now = new Date()) {
  const cfg = RANGE_CONFIG[range];
  const end = new Date(startOfUTCDay(now).getTime() + 86_400_000);
  let start: Date;
  let prevStart: Date;
  if (cfg.months) {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - cfg.months + 1, 1));
    prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - cfg.months * 2 + 1, 1));
  } else {
    start = new Date(end.getTime() - cfg.days! * 86_400_000);
    prevStart = new Date(start.getTime() - cfg.days! * 86_400_000);
  }
  return { start, end, prevStart, unit: cfg.unit };
}

/** Generates every bucket key in the window so the chart has no gaps on empty days. */
function bucketKeys(start: Date, end: Date, unit: 'day' | 'week' | 'month') {
  const keys: string[] = [];
  const cursor = new Date(start);
  if (unit === 'week') {
    // align with $dateTrunc(unit: week, startOfWeek: monday)
    const dow = (cursor.getUTCDay() + 6) % 7;
    cursor.setUTCDate(cursor.getUTCDate() - dow);
  }
  while (cursor < end) {
    keys.push(cursor.toISOString().slice(0, 10));
    if (unit === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (unit === 'week') cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

const pctChange = (current: number, previous: number) =>
  previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / previous) * 1000) / 10;

/**
 * All dashboard numbers in 4 round-trips, run in parallel:
 *  1. patients $facet — trend, condition/status/gender breakdowns, current & previous window counts
 *     (single $match on the indexed admissionDate, so only the 2 windows are scanned)
 *  2. doctors $facet — totals per specialization + new doctors in window
 *  3. top doctors by the denormalised patientCount (index scan, no $lookup)
 *  4. collection-level totals via estimatedDocumentCount (metadata, O(1))
 */
export async function getDashboardStats(range: StatsRange) {
  const { start, end, prevStart, unit } = windows(range);

  const truncated = {
    $dateTrunc: { date: '$admissionDate', unit, ...(unit === 'week' ? { startOfWeek: 'monday' } : {}) },
  };

  const [patientAgg, doctorAgg, topDoctors, totals] = await Promise.all([
    Patient.aggregate<{
      current: { count: number }[];
      previous: { count: number }[];
      critical: { count: number }[];
      trend: { _id: Date; patients: number; critical: number }[];
      byCondition: { _id: string; count: number }[];
      byStatus: { _id: string; count: number }[];
      byGender: { _id: string; count: number }[];
      byAge: { _id: string | number; count: number }[];
    }>([
      { $match: { admissionDate: { $gte: prevStart, $lt: end } } },
      { $addFields: { inWindow: { $gte: ['$admissionDate', start] } } },
      {
        $facet: {
          current: [{ $match: { inWindow: true } }, { $count: 'count' }],
          previous: [{ $match: { inWindow: false } }, { $count: 'count' }],
          critical: [{ $match: { inWindow: true, status: 'critical' } }, { $count: 'count' }],
          trend: [
            { $match: { inWindow: true } },
            {
              $group: {
                _id: truncated,
                patients: { $sum: 1 },
                critical: { $sum: { $cond: [{ $eq: ['$status', 'critical'] }, 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
          byCondition: [
            { $match: { inWindow: true } },
            { $group: { _id: '$condition', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          byStatus: [{ $match: { inWindow: true } }, { $group: { _id: '$status', count: { $sum: 1 } } }],
          byGender: [{ $match: { inWindow: true } }, { $group: { _id: '$gender', count: { $sum: 1 } } }],
          byAge: [
            { $match: { inWindow: true } },
            {
              $bucket: {
                groupBy: '$age',
                boundaries: [0, 18, 35, 50, 65, 200],
                default: 'unknown',
                output: { count: { $sum: 1 } },
              },
            },
          ],
        },
      },
    ]),
    Doctor.aggregate<{
      bySpecialization: { _id: string; doctors: number; patients: number }[];
      newDoctors: { count: number }[];
    }>([
      {
        $facet: {
          bySpecialization: [
            { $group: { _id: '$specialization', doctors: { $sum: 1 }, patients: { $sum: '$patientCount' } } },
            { $sort: { patients: -1 } },
          ],
          newDoctors: [{ $match: { createdAt: { $gte: start, $lt: end } } }, { $count: 'count' }],
        },
      },
    ]),
    Doctor.find({}, 'name specialization hospital patientCount').sort({ patientCount: -1 }).limit(10).lean(),
    Promise.all([Doctor.estimatedDocumentCount(), Patient.estimatedDocumentCount()]),
  ]);

  const p = patientAgg[0]!;
  const d = doctorAgg[0]!;
  const [totalDoctors, totalPatients] = totals;
  const current = p.current[0]?.count ?? 0;
  const previous = p.previous[0]?.count ?? 0;

  const trendMap = new Map(p.trend.map((t) => [t._id.toISOString().slice(0, 10), t]));
  const trend = bucketKeys(start, end, unit).map((key) => ({
    date: key,
    patients: trendMap.get(key)?.patients ?? 0,
    critical: trendMap.get(key)?.critical ?? 0,
  }));

  const AGE_LABELS: Record<string, string> = { 0: '0–17', 18: '18–34', 35: '35–49', 50: '50–64', 65: '65+' };
  const TOP_CONDITIONS = 10;
  const otherConditions = p.byCondition.slice(TOP_CONDITIONS).reduce((s, c) => s + c.count, 0);

  return {
    range,
    unit,
    window: { start: start.toISOString(), end: end.toISOString() },
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      avgPatientsPerDoctor: totalDoctors ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0,
      newPatients: current,
      newPatientsChange: pctChange(current, previous),
      criticalPatients: p.critical[0]?.count ?? 0,
      newDoctors: d.newDoctors[0]?.count ?? 0,
    },
    trend,
    byCondition: [
      ...p.byCondition.slice(0, TOP_CONDITIONS).map((c) => ({ name: c._id, count: c.count })),
      ...(otherConditions ? [{ name: 'Other', count: otherConditions }] : []),
    ],
    byStatus: p.byStatus.map((s) => ({ name: s._id, count: s.count })),
    byGender: p.byGender.map((g) => ({ name: g._id, count: g.count })),
    byAge: p.byAge.map((a) => ({ name: AGE_LABELS[String(a._id)] ?? 'Unknown', count: a.count })),
    bySpecialization: d.bySpecialization.map((s) => ({ name: s._id, doctors: s.doctors, patients: s.patients })),
    topDoctors: topDoctors.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      specialization: doc.specialization,
      hospital: doc.hospital,
      patients: doc.patientCount,
    })),
  };
}
