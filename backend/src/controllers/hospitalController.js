const hospitalService = require('../services/hospitals/hospitalService');
const bedService = require('../services/beds/bedService');

/**
 * Hospital Discovery Suite Controller
 */
const hospitalController = {
  /**
   * GET /api/v1/hospitals
   * Multi-criteria search, filter, and pagination
   */
  getHospitals: async (req, res, next) => {
    try {
      const {
        q,
        search,
        city,
        specialty,
        type,
        scheme,
        minScore,
        max_price,
        sortBy,
        order,
        limit,
        offset
      } = req.query;

      const result = await hospitalService.getHospitals({
        query: q || search,
        city,
        specialty,
        facilityType: type,
        scheme,
        minScore: minScore ? parseFloat(minScore) : 0,
        maxPrice: max_price ? parseFloat(max_price) : null,
        sortBy: sortBy || 'transparency',
        order: order || 'desc',
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/hospitals/:id
   * Fetch full clinical profile (overview, beds, doctors, packages, schemes)
   */
  getHospitalById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const hospital = await hospitalService.getHospitalById(id);

      if (!hospital) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Hospital with identifier '${id}' was not found in the OpenHealth registry.`,
            code: 'HOSPITAL_NOT_FOUND'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: hospital
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/hospitals/:id/beds
   * Fetch live bed inventory
   */
  getHospitalBeds: async (req, res, next) => {
    try {
      const { id } = req.params;
      const beds = await hospitalService.getHospitalBeds(id);

      return res.status(200).json({
        success: true,
        data: beds
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/hospitals/:id/doctors
   * Fetch verified doctor specialists
   */
  getHospitalDoctors: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { specialty } = req.query;
      const doctors = await hospitalService.getHospitalDoctors(id, specialty);

      return res.status(200).json({
        success: true,
        data: doctors
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/hospitals/:id/packages
   * Fetch transparent treatment packages
   */
  getHospitalPackages: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { department } = req.query;
      const packages = await hospitalService.getHospitalPackages(id, department);

      return res.status(200).json({
        success: true,
        data: packages
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/hospitals/:id/schemes
   * Fetch government health schemes and cashless TPAs
   */
  getHospitalSchemes: async (req, res, next) => {
    try {
      const { id } = req.params;
      const schemes = await hospitalService.getHospitalSchemes(id);

      return res.status(200).json({
        success: true,
        data: schemes
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/hospitals/:id/save
   * Bookmark or un-bookmark a hospital (Protected: Patient)
   */
  toggleSaveHospital: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const result = await hospitalService.toggleSaveHospital(userId, id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/hospitals/saved/list
   * List all bookmarked hospitals for the authenticated patient
   */
  getSavedHospitals: async (req, res, next) => {
    try {
      const userId = req.userId;
      const savedList = await hospitalService.getSavedHospitals(userId);

      return res.status(200).json({
        success: true,
        data: savedList
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/hospitals/:id/hold-bed
   * Place a 30-minute lock on an available bed (Protected: Patient)
   */
  reserveBedHold: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { bedType, notes, holdMinutes, driveTime, distanceKm, travelMinutes, locationCaptured } = req.body;

      const holdResult = await bedService.reserveBedHold({
        userId,
        hospitalId: id,
        bedType: bedType || 'ICU',
        patientNotes: notes,
        holdMinutes,
        driveTime,
        distanceKm,
        travelMinutes,
        locationCaptured
      });

      return res.status(201).json({
        success: true,
        data: holdResult
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/hospitals/hold-bed/:holdId/release
   * Release and cancel a 30-minute bed hold (Protected: Patient)
   */
  releaseBedHold: async (req, res, next) => {
    try {
      const { holdId } = req.params;
      const userId = req.userId;

      const releaseResult = await bedService.releaseBedHold({
        userId,
        holdId
      });

      return res.status(200).json({
        success: true,
        data: releaseResult
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = hospitalController;
