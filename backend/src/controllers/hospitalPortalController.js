const hospitalPortalService = require('../services/hospitals/hospitalPortalService');

function getReqHospitalId(req) {
  const id = req.query.hospitalId || 
             req.body?.hospital_id || 
             req.body?.hospitalId || 
             req.body?.id || 
             req.headers['x-hospital-id'] || 
             req.user?.hospital_id;
  if (!id) {
    const error = new Error('Hospital ID parameter is required.');
    error.statusCode = 400;
    throw error;
  }
  return id;
}

class HospitalPortalController {
  async getDashboard(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getDashboard(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getProfile(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.updateProfile(hospitalId, req.body);
      res.status(200).json({ success: true, message: 'Hospital profile updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async saveOnboarding(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.saveOnboarding(hospitalId, req.body);
      res.status(200).json({ success: true, message: 'Hospital onboarding saved successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async getBeds(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getBeds(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async saveBedCategory(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const { bedTypeId, totalBeds, occupiedBeds, reservedBeds, pricePerDay, price_per_day, price } = req.body;
      const rate = pricePerDay !== undefined ? pricePerDay : (price_per_day !== undefined ? price_per_day : (price !== undefined ? price : 1500));
      const data = await hospitalPortalService.saveBedCategory(hospitalId, bedTypeId, totalBeds, occupiedBeds, reservedBeds, rate);
      res.status(201).json({ success: true, message: 'Bed category configured successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async updateBed(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.updateBed(id, req.body);
      res.status(200).json({ success: true, message: 'Bed inventory updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteBedCategory(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.deleteBedCategory(id);
      res.status(200).json({ success: true, message: 'Bed category removed successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async getDoctors(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getDoctors(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createDoctor(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.createDoctor({ ...req.body, hospital_id: hospitalId });
      res.status(201).json({ success: true, message: 'Doctor specialist registered successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.updateDoctor(id, req.body);
      res.status(200).json({ success: true, message: 'Doctor profile updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async toggleDoctorDuty(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.toggleDoctorDuty(id);
      res.status(200).json({ success: true, message: 'Doctor duty status toggled successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.deleteDoctor(id);
      res.status(200).json({ success: true, message: 'Doctor removed from roster successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async getDepartments(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getDepartments(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.createDepartment({ ...req.body, hospital_id: hospitalId });
      res.status(201).json({ success: true, message: 'Department created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.updateDepartment(id, req.body);
      res.status(200).json({ success: true, message: 'Department updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.deleteDepartment(id);
      res.status(200).json({ success: true, message: 'Department deleted successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async getTreatments(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getTreatments(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createTreatment(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.createTreatment({ ...req.body, hospital_id: hospitalId });
      res.status(201).json({ success: true, message: 'Treatment procedure added to hospital catalog', data });
    } catch (err) {
      next(err);
    }
  }

  async updateTreatment(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.updateTreatment(id, req.body);
      res.status(200).json({ success: true, message: 'Treatment procedure updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async toggleTreatmentAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.toggleTreatmentAvailability(id);
      res.status(200).json({ success: true, message: 'Treatment availability toggled successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteTreatment(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.deleteTreatment(id);
      res.status(200).json({ success: true, message: 'Treatment procedure removed from hospital catalog', data });
    } catch (err) {
      next(err);
    }
  }

  async getPackages(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getPackages(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createPackage(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.createPackage({ ...req.body, hospital_id: hospitalId });
      res.status(201).json({ success: true, message: 'Treatment package published successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async updatePackage(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.updatePackage(id, req.body);
      res.status(200).json({ success: true, message: 'Treatment package updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async togglePackageActive(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.togglePackageActive(id);
      res.status(200).json({ success: true, message: 'Treatment package status toggled successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deletePackage(req, res, next) {
    try {
      const { id } = req.params;
      const data = await hospitalPortalService.deletePackage(id);
      res.status(200).json({ success: true, message: 'Treatment package deleted successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async getBookings(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const status = req.query.status;
      const data = await hospitalPortalService.getBookings(hospitalId, status);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await hospitalPortalService.updateBookingStatus(id, status);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async admitPatient(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const result = await hospitalPortalService.admitPatient({
        ...req.body,
        hospital_id: hospitalId
      });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getAdmissions(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getAdmissions(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async dischargePatient(req, res, next) {
    try {
      const { id } = req.params;
      const result = await hospitalPortalService.dischargePatient(id);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getAppointments(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const { status, doctorId, departmentId, search, date } = req.query;
      const data = await hospitalPortalService.getAppointments(hospitalId, { status, doctorId, departmentId, search, date });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async confirmAppointmentQr(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const { appointment_id, patient_uid, notes } = req.body;
      const result = await hospitalPortalService.confirmAppointmentQr({
        hospitalId,
        appointmentId: appointment_id,
        patientUid: patient_uid,
        notes
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async completeAppointmentQr(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const { appointment_id, patient_uid, notes } = req.body;
      const result = await hospitalPortalService.completeAppointmentQr({
        hospitalId,
        appointmentId: appointment_id,
        patientUid: patient_uid,
        notes
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const result = await hospitalPortalService.updateAppointmentStatus(id, status, notes);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const timeRange = req.query.timeRange || '7d';
      const data = await hospitalPortalService.getAnalytics(hospitalId, timeRange);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getTransparency(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const data = await hospitalPortalService.getTransparency(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async recalculateTransparency(req, res, next) {
    try {
      const hospitalId = getReqHospitalId(req);
      const result = await hospitalPortalService.recalculateTransparency(hospitalId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HospitalPortalController();
