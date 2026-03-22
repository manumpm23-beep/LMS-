import { Router } from 'express';
import { getDashboardData } from './dashboard.controller';
import { protect } from '../../middleware/auth.middleware';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', protect, getDashboardData);
