const adminService = require('../services/admin/adminService');

class AdminController {
  /**
   * 1. Dashboard Metrics
   */
  async getDashboard(req, res) {
    try {
      const data = await adminService.getDashboardMetrics();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getDashboard error:', err);
      return res.status(500).json({ success: false, message: 'Failed to aggregate admin dashboard telemetry' });
    }
  }

  /**
   * 2. User Management
   */
  async getUsers(req, res) {
    try {
      const { role, status, q } = req.query;
      const data = await adminService.getUsers({ role, status, query: q });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getUsers error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load user directory' });
    }
  }

  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ success: false, message: 'Role parameter is required' });
      }

      const data = await adminService.updateUserRole(id, role, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.updateUserRole error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const data = await adminService.updateUserStatus(id, is_active, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.updateUserStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
  }

  /**
   * 3. Hospital Node Management
   */
  async getHospitals(req, res) {
    try {
      const { status, city, q } = req.query;
      const data = await adminService.getHospitals({ status, city, query: q });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getHospitals error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch hospital registry' });
    }
  }

  async getHospitalById(req, res) {
    try {
      const { id } = req.params;
      const data = await adminService.getHospitalById(id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getHospitalById error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load hospital facility details' });
    }
  }

  async verifyHospital(req, res) {
    try {
      const { id } = req.params;
      const { verification_status = 'verified', verification_notes = '' } = req.body;
      const data = await adminService.verifyHospital(id, verification_status, verification_notes, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.verifyHospital error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update hospital verification status' });
    }
  }

  async toggleHospitalStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const data = await adminService.toggleHospitalStatus(id, is_active, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.toggleHospitalStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update hospital status' });
    }
  }

  /**
   * 4. Doctor Credential Verification
   */
  async getDoctors(req, res) {
    try {
      const { status, hospitalId, q } = req.query;
      const data = await adminService.getDoctors({ status, hospitalId, query: q });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getDoctors error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch doctor credentials' });
    }
  }

  async verifyDoctor(req, res) {
    try {
      const { id } = req.params;
      const { verification_status = 'verified' } = req.body;
      const data = await adminService.verifyDoctor(id, verification_status, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.verifyDoctor error:', err);
      return res.status(500).json({ success: false, message: 'Failed to verify doctor credentials' });
    }
  }

  async toggleDoctorStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const data = await adminService.toggleDoctorStatus(id, is_active, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.toggleDoctorStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to toggle doctor duty status' });
    }
  }

  /**
   * 5. Government Schemes
   */
  async getSchemes(req, res) {
    try {
      const data = await adminService.getSchemes();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getSchemes error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch government schemes' });
    }
  }

  async createScheme(req, res) {
    try {
      const data = await adminService.createScheme(req.body, req.user?.id, req.ip);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      console.error('adminController.createScheme error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create scheme' });
    }
  }

  async updateScheme(req, res) {
    try {
      const { id } = req.params;
      const data = await adminService.updateScheme(id, req.body, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.updateScheme error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update scheme' });
    }
  }

  async toggleSchemeStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const data = await adminService.toggleSchemeStatus(id, is_active, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.toggleSchemeStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to toggle scheme status' });
    }
  }

  async deleteScheme(req, res) {
    try {
      const { id } = req.params;
      const data = await adminService.deleteScheme(id, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.deleteScheme error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete scheme' });
    }
  }

  /**
   * 6. Insurance Providers
   */
  async getInsurance(req, res) {
    try {
      const data = await adminService.getInsuranceProviders();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getInsurance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch insurance providers' });
    }
  }

  async createInsurance(req, res) {
    try {
      const data = await adminService.createInsuranceProvider(req.body, req.user?.id, req.ip);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      console.error('adminController.createInsurance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create insurance provider' });
    }
  }

  async updateInsurance(req, res) {
    try {
      const { id } = req.params;
      const data = await adminService.updateInsuranceProvider(id, req.body, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.updateInsurance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update insurance provider' });
    }
  }

  async toggleInsurance(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const data = await adminService.toggleInsuranceStatus(id, is_active, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.toggleInsurance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to toggle insurance status' });
    }
  }

  async deleteInsurance(req, res) {
    try {
      const { id } = req.params;
      const data = await adminService.deleteInsuranceProvider(id, req.user?.id, req.ip);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.deleteInsurance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete insurance provider' });
    }
  }

  /**
   * 7. Analytics
   */
  async getAnalytics(req, res) {
    try {
      const { timeRange = '30d' } = req.query;
      const data = await adminService.getPlatformAnalytics(timeRange);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getAnalytics error:', err);
      return res.status(500).json({ success: false, message: 'Failed to compile platform analytics' });
    }
  }

  /**
   * 8. Audit Logs
   */
  async getAuditLogs(req, res) {
    try {
      const { action, entity, q, limit } = req.query;
      const data = await adminService.getAuditLogs({ action, entity, query: q, limit: parseInt(limit) || 50 });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('adminController.getAuditLogs error:', err);
      return res.status(500).json({ success: false, message: 'Failed to query audit logs' });
    }
  }

  async logAuditEvent(req, res) {
    try {
      const { action, entity_type, entity_id, metadata } = req.body;
      await adminService.logAuditEvent(action, entity_type, entity_id, metadata, req.user?.id, req.ip);
      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('adminController.logAuditEvent error:', err);
      return res.status(500).json({ success: false, message: 'Failed to write audit event' });
    }
  }
}

module.exports = new AdminController();
