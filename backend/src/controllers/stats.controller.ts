import type { Request, Response } from 'express';
import { getDashboardStats } from '../services/stats.service.js';
import { parse } from '../utils/validate.js';
import { statsQuery } from '../validators/patient.validators.js';

export async function dashboard(req: Request, res: Response) {
  const { range } = parse(statsQuery, req.query);
  res.set('Cache-Control', 'private, max-age=30');
  res.json({ data: await getDashboardStats(range) });
}
