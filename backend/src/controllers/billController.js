const billService = require('../services/bills/billService');

/**
 * Controller for Patient Bills, Package Comparisons, and Hospital Reviews.
 */
const billController = {
  /**
   * GET /api/v1/bills
   * Retrieve all bills for the authenticated patient.
   */
  getPatientBills: async (req, res, next) => {
    try {
      const bills = await billService.getPatientBills(req.userId);
      return res.status(200).json({
        success: true,
        data: bills
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bills/:id
   * Retrieve single bill by ID.
   */
  getBillById: async (req, res, next) => {
    try {
      const bill = await billService.getBillById(req.userId, req.params.id);
      return res.status(200).json({
        success: true,
        data: bill
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/bills
   * Upload / create a new bill.
   */
  uploadBill: async (req, res, next) => {
    try {
      const { hospitalId, treatmentName, packageId, finalAmount, billNumber } = req.body;
      const bill = await billService.uploadBill({
        userId: req.userId,
        hospitalId,
        treatmentName,
        packageId,
        finalAmount,
        billNumber
      });

      return res.status(201).json({
        success: true,
        data: bill
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bills/packages
   * Retrieve available treatment packages.
   */
  getAvailablePackages: async (req, res, next) => {
    try {
      const { hospitalId, treatmentName } = req.query;
      const packages = await billService.getAvailablePackages(hospitalId, treatmentName);
      return res.status(200).json({
        success: true,
        data: packages
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bills/:id/comparison
   * Retrieve multi-dimensional 3-way comparisons for a bill.
   */
  getBillComparison: async (req, res, next) => {
    try {
      const comparison = await billService.getBillComparison(req.userId, req.params.id);
      return res.status(200).json({
        success: true,
        data: comparison
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/bills/:id/audit
   * Audits a bill with Gemini AI.
   */
  auditBill: async (req, res, next) => {
    try {
      const audit = await billService.auditBillWithAI(req.userId, req.params.id);
      return res.status(200).json({
        success: true,
        data: audit
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/bills/rating
   * POST /api/v1/bills/:id/rating
   * Submit patient rating and review.
   */
  submitRating: async (req, res, next) => {
    try {
      const billId = req.params.id || req.body.billId;
      const { hospitalId, rating, feedback } = req.body;

      const review = await billService.submitHospitalRating({
        userId: req.userId,
        hospitalId,
        billId,
        rating,
        feedback
      });

      return res.status(201).json({
        success: true,
        data: review,
        message: 'Rating submitted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = billController;
