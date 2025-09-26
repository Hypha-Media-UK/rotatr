import { Router } from 'express';
// import authRouter from './auth';
import departmentsRouter from './departments';
import portersRouter from './porters';
// import shiftsRouter from './shifts';
import assignmentsRouter from './assignments';
// import { generalRateLimit, securityHeaders, securityLogger } from '@/middleware/security';
// import { authenticateToken, optionalAuth } from '@/middleware/auth';
// import staffingAlertsRouter from './staffingAlerts';
// import testShiftCalculationsRouter from './testShiftCalculations';
// import shiftCalculationsRouter from './shiftCalculations';

const router = Router();

// Apply security middleware to all routes
// router.use(securityHeaders);
// router.use(securityLogger);
// router.use(generalRateLimit);

// Public routes (no authentication required)
// router.use('/auth', authRouter);

// Protected routes (authentication required)
router.use('/departments', departmentsRouter);
router.use('/porters', portersRouter);
// router.use('/shifts', authenticateToken, shiftsRouter);
router.use('/assignments', assignmentsRouter);
// router.use('/staffing-alerts', authenticateToken, staffingAlertsRouter);
// router.use('/test-shift-calculations', optionalAuth, testShiftCalculationsRouter);
// router.use('/shift-calculations', authenticateToken, shiftCalculationsRouter);

export default router;
