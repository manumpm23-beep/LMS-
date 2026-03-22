import { Router } from 'express';
import { getDashboardData } from './dashboard.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', authMiddleware, getDashboardData);
