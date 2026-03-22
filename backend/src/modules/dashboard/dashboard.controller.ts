import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const data = await dashboardService.getDashboardData(userId);
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Internal server error' });
    }
};
