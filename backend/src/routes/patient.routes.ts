import { Router } from 'express';
import * as patients from '../controllers/patient.controller.js';
import { requireRole } from '../middleware/auth.js';

const adminOnly = requireRole('admin');

export const patientRouter = Router()
  .get('/', patients.list)
  .get('/facets', patients.facets)
  .get('/:id', patients.get)
  .patch('/:id', adminOnly, patients.update)
  .delete('/:id', adminOnly, patients.remove);
