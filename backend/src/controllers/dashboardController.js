const { supabaseAdmin } = require('../config/supabase');

/**
 * Dashboard Telemetry Controller
 */
const dashboardController = {
  // Aggregate real patient dashboard metrics
  getPatientDashboard: async (req, res, next) => {
    try {
      const userId = req.userId;
      const period = req.query.period || 'this_week';

      // 1. Fetch patient profile with ABHA & KYC first
      const { data: patientProfile } = await supabaseAdmin
        .from('patient_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const patientId = patientProfile?.id || userId;

      // 2. Invoke PostgreSQL Stored Procedure for primary telemetry
      const { data: dbData, error: dbErr } = await supabaseAdmin.rpc('get_patient_dashboard_data', {
        p_period: period
      });

      if (dbErr) {
        console.warn('Dashboard RPC notice, falling back to direct table aggregations:', dbErr);
      }

      // 3. Fetch specific direct card aggregations fallback
      const [
        savedHospitalsRes,
        bookingsRes,
        doctorApptsRes,
        bedHoldsRes,
        reportsRes,
        billsRes
      ] = await Promise.all([
        supabaseAdmin.from('saved_hospitals').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${patientId},patient_id.eq.${userId}`),
        supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${patientId},patient_id.eq.${userId}`).in('status', ['confirmed', 'pending']),
        supabaseAdmin.from('doctor_appointments').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${patientId},patient_id.eq.${userId}`).in('status', ['confirmed', 'pending']),
        supabaseAdmin.from('bed_reservations').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${patientId},patient_id.eq.${userId}`).in('status', ['confirmed', 'pending', 'held']),
        supabaseAdmin.from('medical_documents').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${patientId},patient_id.eq.${userId}`),
        supabaseAdmin.from('bills').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${patientId},patient_id.eq.${userId}`)
      ]);

      const totalUpcomingBookings = (bookingsRes.count || 0) + (doctorApptsRes.count || 0) + (bedHoldsRes.count || 0);

      // 4. Fetch recent searches
      let recentSearches = dbData?.recent_searches || [];
      if (!recentSearches.length && patientProfile?.id) {
        const { data: searchData } = await supabaseAdmin
          .from('search_history')
          .select('id, query, filters, created_at')
          .or(`patient_id.eq.${patientId},patient_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(4);

        if (searchData) {
          recentSearches = searchData.map(s => ({
            id: s.id,
            query: s.query,
            location: s.filters?.location || 'Indore, MP',
            created_at: s.created_at
          }));
        }
      }

      // 5. Fetch recent bookings list
      let recentBookings = dbData?.recent_bookings || [];
      if (!recentBookings.length) {
        const { data: apptData } = await supabaseAdmin
          .from('doctor_appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            consultation_type,
            status,
            consultation_fee,
            patient_notes,
            created_at,
            doctors (
              name,
              specialization,
              image_url
            ),
            hospitals (
              name,
              city
            )
          `)
          .or(`patient_id.eq.${patientId},patient_id.eq.${userId}`)
          .order('appointment_date', { ascending: false })
          .limit(4);

        if (apptData) {
          recentBookings = apptData.map(a => ({
            id: a.id,
            appointment_date: a.appointment_date,
            appointment_time: a.appointment_time,
            consultation_type: a.consultation_type,
            status: a.status,
            consultation_fee: a.consultation_fee,
            doctor_name: a.doctors?.name,
            specialization: a.doctors?.specialization,
            doctor_image: a.doctors?.image_url,
            hospital_name: a.hospitals?.name,
            hospital_city: a.hospitals?.city
          }));
        }
      }

      // 6. Build response
      const responseData = {
        metrics: {
          savedHospitals: Number(dbData?.saved_hospitals) >= 0 ? Number(dbData.saved_hospitals) : (savedHospitalsRes.count || 0),
          upcomingBookings: Number(dbData?.upcoming_bookings) >= 0 ? Number(dbData.upcoming_bookings) : totalUpcomingBookings,
          reportsAnalyzed: Number(dbData?.reports_analyzed) >= 0 ? Number(dbData.reports_analyzed) : (reportsRes.count || 0),
          billsAnalyzed: Number(dbData?.bills_analyzed) >= 0 ? Number(dbData.bills_analyzed) : (billsRes.count || 0),
          unreadNotifications: Number(dbData?.unread_notifications) || 0
        },
        kpi: dbData?.kpi || {
          searches: { count: 0, trend: 0 },
          comparisons: { count: 0, trend: 0 },
          reservations: { count: totalUpcomingBookings, trend: 0 },
          bill_savings: { amount: 0, trend: 0 }
        },
        profile: {
          fullName: req.user.profile?.full_name || req.user.email?.split('@')[0] || 'Patient',
          email: req.user.email,
          phone: req.user.profile?.phone || null,
          abhaId: patientProfile?.abha_id || null,
          kycStatus: patientProfile?.kyc_status || 'unverified',
          city: patientProfile?.city || 'Indore',
          state: patientProfile?.state || 'Madhya Pradesh',
          bloodGroup: patientProfile?.blood_group || null
        },
        chart_data: dbData?.chart_data || [
          { day: 'Mon', value: 0 },
          { day: 'Tue', value: 0 },
          { day: 'Wed', value: 0 },
          { day: 'Thu', value: 0 },
          { day: 'Fri', value: 0 },
          { day: 'Sat', value: 0 },
          { day: 'Sun', value: 0 }
        ],
        recent_searches: recentSearches,
        recent_bookings: recentBookings,
        period
      };

      return res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
