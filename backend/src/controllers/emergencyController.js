const emergencyService = require('../services/emergency/emergencyService');

/**
 * Controller for emergency discovery and dispatch endpoints.
 */
class EmergencyController {
  /**
   * GET /api/v1/emergency/nearby
   * Fetch ranked hospitals with emergency beds and ambulance availability.
   */
  async getNearbyHospitals(req, res, next) {
    try {
      const { latitude, longitude, radiusM, address } = req.query;
      const hospitals = await emergencyService.getNearbyHospitals({
        latitude: latitude || 26.2183,
        longitude: longitude || 78.1828,
        radiusM: radiusM ? parseInt(radiusM, 10) : 35000
      });

      return res.status(200).json({
        success: true,
        data: {
          hospitals,
          total: hospitals.length,
          searchOrigin: {
            latitude: parseFloat(latitude || 26.2183),
            longitude: parseFloat(longitude || 78.1828),
            address: address || 'Gwalior, Madhya Pradesh'
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/emergency/session
   * Starts a new emergency orchestration session.
   */
  async startSession(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const { latitude, longitude, emergencyType, searchRadiusM, address } = req.body;
      const sessionData = await emergencyService.startEmergencySession({
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        emergencyType: emergencyType || 'Critical Medical Emergency',
        searchRadiusM: searchRadiusM ? parseInt(searchRadiusM, 10) : 10000,
        address: address || null
      });

      return res.status(201).json({
        success: true,
        message: 'Emergency orchestration session initialized successfully.',
        data: sessionData
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/emergency/dispatch
   * Dispatches an ambulance to patient location for selected hospital.
   */
  async dispatchAmbulance(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const { sessionId, hospitalId, ambulanceId, pickupLatitude, pickupLongitude, pickupAddress } = req.body;
      const dispatchPacket = await emergencyService.dispatchAmbulance({
        userId,
        sessionId,
        hospitalId,
        ambulanceId,
        pickupLatitude,
        pickupLongitude,
        pickupAddress: pickupAddress || null
      });

      return res.status(200).json({
        success: true,
        message: 'Ambulance successfully dispatched to your location.',
        data: dispatchPacket
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/emergency/active
   * Retrieves active in-flight emergency session for patient rehydration.
   */
  async getActiveSession(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to inspect active emergency sessions.'
        });
      }

      const activeSession = await emergencyService.getActiveSession(userId);
      return res.status(200).json({
        success: true,
        data: activeSession
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/emergency/session/:id/status
   * Updates state of emergency session (e.g. cancelled, arrived).
   */
  async updateStatus(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to update emergency session status.'
        });
      }

      const sessionId = req.params.id;
      const { status, reason } = req.body;

      const updated = await emergencyService.updateSessionStatus({
        userId,
        sessionId,
        status,
        reason
      });

      return res.status(200).json({
        success: true,
        message: `Emergency session status updated to ${status}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmergencyController();
