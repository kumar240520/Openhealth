const doctorService = require('../services/doctors/doctorService');

/**
 * Doctor Discovery & Profile Controller
 */
const doctorController = {
  /**
   * GET /api/v1/doctors
   */
  getDoctors: async (req, res, next) => {
    try {
      const {
        q,
        search,
        specialty,
        city,
        hospitalId,
        availableToday,
        minRating,
        maxFee,
        minExperience,
        sortBy,
        order,
        limit,
        offset
      } = req.query;

      const result = await doctorService.getDoctors({
        query: q || search,
        specialty,
        city,
        hospitalId,
        availableToday,
        minRating: minRating ? parseFloat(minRating) : 0,
        maxFee: maxFee ? parseFloat(maxFee) : null,
        minExperience: minExperience ? parseInt(minExperience) : 0,
        sortBy: sortBy || 'rating',
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
   * GET /api/v1/doctors/specialties
   */
  getSpecialties: async (req, res, next) => {
    try {
      const specialties = await doctorService.getSpecialties();
      return res.status(200).json({
        success: true,
        data: specialties
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/doctors/saved/list
   */
  getSavedDoctors: async (req, res, next) => {
    try {
      const saved = await doctorService.getSavedDoctors(req.userId);
      return res.status(200).json({
        success: true,
        data: saved
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/doctors/:id
   */
  getDoctorById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const doctor = await doctorService.getDoctorById(id);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Doctor with identifier '${id}' was not found in the OpenHealth registry.`,
            code: 'DOCTOR_NOT_FOUND'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/doctors/:id/slots
   */
  getDoctorSlots: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { date } = req.query;

      const slots = await doctorService.getDoctorSlots(id, date);
      return res.status(200).json({
        success: true,
        data: slots
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/doctors/:id/save
   */
  toggleSaveDoctor: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await doctorService.toggleSaveDoctor(req.userId, id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = doctorController;
