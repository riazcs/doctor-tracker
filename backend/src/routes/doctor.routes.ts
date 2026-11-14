import { Router } from 'express';
import * as doctors from '../controllers/doctor.controller.js';
import { requireRole } from '../middleware/auth.js';

const adminOnly = requireRole('admin');

export const doctorRouter = Router()
  .get('/', doctors.list)
  .post('/', adminOnly, doctors.create)
  .get('/facets', doctors.facets)
  .get('/options', doctors.options)
  .get('/:id', doctors.get)
  .patch('/:id', adminOnly, doctors.update)
  .delete('/:id', adminOnly, doctors.remove)
  .get('/:id/patients', doctors.listPatients)
  .post('/:id/patients', adminOnly, doctors.addPatient)
  .delete('/:id/patients/:patientId', adminOnly, doctors.removePatient);
