const reportService = require('../services/reports/reportService');

/**
 * Controller for Medical Reports, Booking Tests, and Health Timeline.
 */
const reportController = {
  /**
   * GET /api/v1/reports
   * Retrieve full dashboard reports payload.
   */
  getReportsDashboardData: async (req, res, next) => {
    try {
      const data = await reportService.getReportsDashboardData(req.userId);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/reports/timeline
   * Retrieve chronological health events timeline.
   */
  getTimeline: async (req, res, next) => {
    try {
      const timeline = await reportService.getTimeline(req.userId);
      return res.status(200).json({
        success: true,
        data: timeline
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/reports/tests
   * Retrieve test reports from bookings.
   */
  getTestReports: async (req, res, next) => {
    try {
      const tests = await reportService.getTestReports(req.userId);
      return res.status(200).json({
        success: true,
        data: tests
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/reports/upload
   * Upload and register a new report.
   */
  uploadReport: async (req, res, next) => {
    try {
      const { hospitalId, title, category, fileUrl, fileSize } = req.body;
      const report = await reportService.uploadReport({
        userId: req.userId,
        hospitalId,
        title,
        category,
        fileUrl,
        fileSize
      });

      return res.status(201).json({
        success: true,
        data: report,
        message: 'Report uploaded and recorded to health timeline successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
