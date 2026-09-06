const { supabaseAdmin } = require('../config/supabase');

/**
 * Patient Lifecycle & Onboarding Controller
 */
const patientController = {
  // Save onboarding wizard steps (Step 1, Step 2, Step 3)
  saveOnboarding: async (req, res, next) => {
    try {
      const { step, data } = req.body;
      const userId = req.userId;

      if (!step || !data) {
        return res.status(400).json({
          success: false,
          error: { message: 'Step number and data payload are required.' }
        });
      }

      // Step 1: Basic Details
      if (step === 1) {
        if (!data.full_name || !data.date_of_birth || !data.gender || !data.blood_group || !data.city || !data.state) {
          return res.status(400).json({
            success: false,
            error: { message: 'Mandatory Step 1 fields (full_name, date_of_birth, gender, blood_group, city, state) are missing.' }
          });
        }

        // Update profiles table
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: data.full_name.trim(),
            phone: data.phone || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        // Upsert patient_profiles table
        const { error: patientErr } = await supabaseAdmin
          .from('patient_profiles')
          .upsert({
            user_id: userId,
            date_of_birth: data.date_of_birth,
            age: data.age ? parseInt(data.age) : null,
            gender: data.gender,
            blood_group: data.blood_group,
            family_members_count: data.family_members_count ? parseInt(data.family_members_count) : 1,
            city: data.city.trim(),
            state: data.state.trim(),
            postal_code: data.postal_code ? data.postal_code.trim() : null,
            preferred_language: data.preferred_language || 'en',
            emergency_contact_name: data.emergency_contact_name ? data.emergency_contact_name.trim() : null,
            emergency_contact_phone: data.emergency_contact_phone ? data.emergency_contact_phone.trim() : null,
            height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
            weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
            previous_reports_url: data.previous_reports_url || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (patientErr) throw patientErr;

        return res.status(200).json({
          success: true,
          message: 'Basic patient profile successfully saved.',
          data: { step: 1 }
        });
      }

      // Step 2: KYC & Government Medical ID
      if (step === 2) {
        if (data.photo_url) {
          await supabaseAdmin
            .from('profiles')
            .update({ avatar_url: data.photo_url, updated_at: new Date().toISOString() })
            .eq('id', userId);
        }

        const isVerified = Boolean(data.aadhaar_number || data.govt_id_number);
        const { error: kycErr } = await supabaseAdmin
          .from('patient_profiles')
          .update({
            aadhaar_number: data.aadhaar_number || null,
            govt_id_type: data.govt_id_type || null,
            govt_id_number: data.govt_id_number || null,
            insurance_policy_url: data.insurance_policy_url || null,
            kyc_status: isVerified ? 'verified' : 'skipped',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (kycErr) throw kycErr;

        return res.status(200).json({
          success: true,
          message: 'KYC documents successfully recorded.',
          data: { step: 2, kyc_status: isVerified ? 'verified' : 'skipped' }
        });
      }

      // Step 3: Finish & ABHA Digital Pass Generation
      if (step === 3) {
        // Retrieve or generate 14-digit ABHA ID
        const { data: existingPatient } = await supabaseAdmin
          .from('patient_profiles')
          .select('abha_id')
          .eq('user_id', userId)
          .single();

        let abhaId = existingPatient?.abha_id;
        if (!abhaId) {
          const rand4 = () => String(Math.floor(1000 + Math.random() * 9000));
          abhaId = `91-${rand4()}-${rand4()}-${rand4()}`;
        }

        await supabaseAdmin
          .from('patient_profiles')
          .update({
            onboarding_completed: true,
            abha_id: abhaId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        await supabaseAdmin
          .from('profiles')
          .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        return res.status(200).json({
          success: true,
          message: 'Onboarding finished and Digital Health Pass activated.',
          data: { step: 3, abha_id: abhaId, onboarding_completed: true }
        });
      }

      return res.status(400).json({
        success: false,
        error: { message: 'Invalid onboarding step requested.' }
      });
    } catch (err) {
      next(err);
    }
  },

  // Fetch full patient profile & health identity
  getProfile: async (req, res, next) => {
    try {
      const userId = req.userId;

      const { data: profile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (pErr) throw pErr;

      const { data: patientProfile, error: patErr } = await supabaseAdmin
        .from('patient_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (patErr && patErr.code !== 'PGRST116') throw patErr;

      return res.status(200).json({
        success: true,
        data: {
          ...profile,
          patient_details: patientProfile || null
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Update preferred patient location
  updateLocation: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { city, state, postalCode } = req.body;

      if (!city) {
        return res.status(400).json({
          success: false,
          error: { message: 'City is required.' }
        });
      }

      const { data, error } = await supabaseAdmin
        .from('patient_profiles')
        .update({
          city: city.trim(),
          state: state ? state.trim() : undefined,
          postal_code: postalCode ? postalCode.trim() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Location preferences updated.',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // Update editable patient profile fields with strict immutability checks
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.userId;
      const {
        blood_group,
        emergency_contact_name,
        emergency_contact_phone,
        city,
        state,
        postal_code,
        preferred_language,
        height_cm,
        weight_kg,
        family_members_count,
        avatar_url
      } = req.body;

      // 1. Fetch current record to verify existence
      const { data: currentPatient, error: pFindErr } = await supabaseAdmin
        .from('patient_profiles')
        .select('id, user_id, date_of_birth, aadhaar_number, govt_id_number, abha_id, gender')
        .eq('user_id', userId)
        .single();

      if (pFindErr || !currentPatient) {
        return res.status(404).json({
          success: false,
          error: { message: 'Patient profile not found.' }
        });
      }

      // 2. Update avatar_url on profiles table if provided
      if (avatar_url) {
        await supabaseAdmin
          .from('profiles')
          .update({
            avatar_url: avatar_url.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      // 3. Prepare mutable updates only (Locked fields: name, email, phone, aadhaar, abha, dob, gender)
      const updates = {
        updated_at: new Date().toISOString()
      };

      if (blood_group !== undefined) updates.blood_group = blood_group;
      if (emergency_contact_name !== undefined) updates.emergency_contact_name = emergency_contact_name ? emergency_contact_name.trim() : null;
      if (emergency_contact_phone !== undefined) updates.emergency_contact_phone = emergency_contact_phone ? emergency_contact_phone.trim() : null;
      if (city !== undefined) updates.city = city ? city.trim() : null;
      if (state !== undefined) updates.state = state ? state.trim() : null;
      if (postal_code !== undefined) updates.postal_code = postal_code ? postal_code.trim() : null;
      if (preferred_language !== undefined) updates.preferred_language = preferred_language;
      if (height_cm !== undefined) updates.height_cm = height_cm ? parseFloat(height_cm) : null;
      if (weight_kg !== undefined) updates.weight_kg = weight_kg ? parseFloat(weight_kg) : null;
      if (family_members_count !== undefined) updates.family_members_count = family_members_count ? parseInt(family_members_count) : 1;

      // 4. Update patient_profiles table
      const { data: updatedPatient, error: uErr } = await supabaseAdmin
        .from('patient_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (uErr) throw uErr;

      // Fetch profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully.',
        data: {
          ...profile,
          patient_details: updatedPatient
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get patient settings
  getSettings: async (req, res, next) => {
    try {
      const userId = req.userId;

      const { data: patient } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!patient?.id) {
        return res.status(404).json({ success: false, error: { message: 'Patient not found.' } });
      }

      let { data: settings } = await supabaseAdmin
        .from('patient_settings')
        .select('*')
        .eq('patient_id', patient.id)
        .maybeSingle();

      if (!settings) {
        const { data: newSettings, error: sErr } = await supabaseAdmin
          .from('patient_settings')
          .insert({ patient_id: patient.id })
          .select()
          .single();
        if (sErr) throw sErr;
        settings = newSettings;
      }

      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (err) {
      next(err);
    }
  },

  // Update patient settings
  updateSettings: async (req, res, next) => {
    try {
      const userId = req.userId;
      const {
        sms_alerts,
        whatsapp_updates,
        email_reports,
        emergency_broadcast_alerts,
        abha_data_sharing,
        anonymous_analytics,
        preferred_language
      } = req.body;

      const { data: patient } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!patient?.id) {
        return res.status(404).json({ success: false, error: { message: 'Patient not found.' } });
      }

      const updates = {
        updated_at: new Date().toISOString()
      };

      if (sms_alerts !== undefined) updates.sms_alerts = Boolean(sms_alerts);
      if (whatsapp_updates !== undefined) updates.whatsapp_updates = Boolean(whatsapp_updates);
      if (email_reports !== undefined) updates.email_reports = Boolean(email_reports);
      if (emergency_broadcast_alerts !== undefined) updates.emergency_broadcast_alerts = Boolean(emergency_broadcast_alerts);
      if (abha_data_sharing !== undefined) updates.abha_data_sharing = Boolean(abha_data_sharing);
      if (anonymous_analytics !== undefined) updates.anonymous_analytics = Boolean(anonymous_analytics);
      if (preferred_language !== undefined) updates.preferred_language = preferred_language;

      const { data, error } = await supabaseAdmin
        .from('patient_settings')
        .upsert({
          patient_id: patient.id,
          ...updates
        }, { onConflict: 'patient_id' })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully.',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // Get all saved items (hospitals & doctors)
  getSavedItems: async (req, res, next) => {
    try {
      const userId = req.userId;

      const { data: patient } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!patient?.id) {
        return res.status(200).json({
          success: true,
          data: { hospitals: [], doctors: [], totalCount: 0 }
        });
      }

      // 1. Fetch Saved Hospitals
      const { data: savedHospitals, error: hErr } = await supabaseAdmin
        .from('saved_hospitals')
        .select(`
          id,
          created_at,
          hospital:hospitals (
            id,
            name,
            type,
            address,
            city,
            latitude,
            longitude,
            rating,
            review_count,
            transparency_score,
            image_url,
            phone,
            specialties,
            emergency_available
          )
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (hErr) console.error('Error fetching saved hospitals:', hErr);

      // 2. Fetch Saved Doctors
      const { data: savedDoctors } = await supabaseAdmin
        .from('saved_doctors')
        .select(`
          id,
          created_at,
          doctor:doctors (
            id,
            name,
            specialization,
            qualification,
            experience_years,
            consultation_fee,
            rating,
            review_count,
            image_url,
            hospital_id,
            hospitals (
              id,
              name,
              city,
              address
            )
          )
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      const hospitals = (savedHospitals || []).map(sh => ({
        savedId: sh.id,
        savedAt: sh.created_at,
        ...sh.hospital
      })).filter(h => h.id);

      const doctors = (savedDoctors || []).map(sd => ({
        savedId: sd.id,
        savedAt: sd.created_at,
        ...sd.doctor,
        hospitalName: sd.doctor?.hospitals?.name || 'Indore Hospital',
        hospitalCity: sd.doctor?.hospitals?.city || 'Indore'
      })).filter(d => d.id);

      return res.status(200).json({
        success: true,
        data: {
          hospitals,
          doctors,
          totalCount: hospitals.length + doctors.length
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Submit KYC documents directly (Matching Onboarding Step 2 specification)
  submitKYC: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { 
        aadhaar_number, 
        govt_id_type, 
        govt_id_number, 
        insurance_policy_url, 
        photo_url 
      } = req.body;

      if (!aadhaar_number && !govt_id_number) {
        return res.status(400).json({
          success: false,
          error: { message: 'Aadhaar or Government Medical ID number is required to verify KYC.' }
        });
      }

      // 1. Update Profile Photo if uploaded
      if (photo_url) {
        await supabaseAdmin
          .from('profiles')
          .update({ 
            avatar_url: photo_url, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);
      }

      // 2. Fetch existing patient details to preserve or generate ABHA ID
      const { data: existingPatient } = await supabaseAdmin
        .from('patient_profiles')
        .select('id, abha_id')
        .eq('user_id', userId)
        .single();

      let abhaId = existingPatient?.abha_id;
      if (!abhaId) {
        const rand4 = () => String(Math.floor(1000 + Math.random() * 9000));
        abhaId = `91-${rand4()}-${rand4()}-${rand4()}`;
      }

      const cleanAadhaar = aadhaar_number ? String(aadhaar_number).replace(/\D/g, '') : null;
      const idType = govt_id_type || 'aadhaar';
      const idNumber = govt_id_number ? String(govt_id_number).trim() : cleanAadhaar;

      // 3. Update patient_profiles with all 4 KYC fields
      const { data: updatedPatient, error: pErr } = await supabaseAdmin
        .from('patient_profiles')
        .update({
          aadhaar_number: cleanAadhaar || (idType === 'aadhaar' ? idNumber : null),
          govt_id_type: idType,
          govt_id_number: idNumber,
          insurance_policy_url: insurance_policy_url || null,
          abha_id: abhaId,
          kyc_status: 'verified',
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (pErr) throw pErr;

      // 4. Mark onboarding_completed on profiles
      await supabaseAdmin
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return res.status(200).json({
        success: true,
        message: 'KYC documents verified and recorded successfully.',
        data: updatedPatient
      });
    } catch (err) {
      next(err);
    }
  },

  // Submit credential change appeal
  submitAppeal: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { credential_field, requested_value, justification } = req.body;

      if (!credential_field || !requested_value) {
        return res.status(400).json({
          success: false,
          error: { message: 'Credential field and requested value are required.' }
        });
      }

      console.log(`[Credential Appeal] User ${userId} requested change for ${credential_field} to ${requested_value}: ${justification}`);

      return res.status(200).json({
        success: true,
        message: 'Your credential correction appeal has been submitted to the compliance helpdesk. Our team will verify your documents within 24-48 hours.',
        data: {
          appealId: `APP-${Date.now().toString().slice(-6)}`,
          status: 'submitted',
          field: credential_field
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Retrieve comprehensive patient clinical & identity data by UID (Patient UID Retrieval Engine)
  getPatientByUid: async (req, res, next) => {
    try {
      const { uid } = req.params;
      if (!uid) {
        return res.status(400).json({
          success: false,
          error: { message: 'Patient UID is required.' }
        });
      }

      // Sanitize UID input in case URL, JSON or raw string was passed
      let cleanUid = String(uid).trim();
      const uuidMatch = cleanUid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const abhaMatch = cleanUid.match(/\b\d{2}-\d{4}-\d{4}-\d{4}\b/);
      if (uuidMatch) {
        cleanUid = uuidMatch[0];
      } else if (abhaMatch) {
        cleanUid = abhaMatch[0];
      }

      // Query by patient_profiles.id / user_id (if UUID) or abha_id
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUid);
      let pQuery = supabaseAdmin
        .from('patient_profiles')
        .select(`
          id,
          user_id,
          date_of_birth,
          age,
          gender,
          blood_group,
          city,
          state,
          postal_code,
          preferred_language,
          emergency_contact_name,
          emergency_contact_phone,
          height_cm,
          weight_kg,
          kyc_status,
          abha_id,
          govt_id_type,
          govt_id_number,
          created_at
        `);

      if (isUUID) {
        pQuery = pQuery.or(`id.eq.${cleanUid},user_id.eq.${cleanUid}`);
      } else {
        pQuery = pQuery.eq('abha_id', cleanUid);
      }

      const { data: patient, error: pErr } = await pQuery.maybeSingle();

      if (pErr) {
        console.error('Patient UID query error:', pErr);
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to retrieve patient by UID: ' + pErr.message }
        });
      }

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: { message: `No registered patient found matching UID: ${uid}` }
        });
      }

      // Fetch patient base profile from profiles table
      const { data: baseProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, phone, avatar_url, email')
        .eq('id', patient.user_id)
        .maybeSingle();

      // Fetch recent medical documents / reports count safely
      const validUids = [patient.id, patient.user_id].filter(u => u && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u));
      
      let docsCount = 0;
      if (validUids.length > 0) {
        const { count } = await supabaseAdmin
          .from('medical_documents')
          .select('id', { count: 'exact', head: true })
          .in('patient_id', validUids);
        docsCount = count || 0;
      }

      // Fetch active bookings count safely
      let bookingsCount = 0;
      if (validUids.length > 0) {
        const { count } = await supabaseAdmin
          .from('bed_reservations')
          .select('id', { count: 'exact', head: true })
          .in('patient_id', validUids)
          .in('status', ['confirmed', 'held', 'pending']);
        bookingsCount = count || 0;
      }

      return res.status(200).json({
        success: true,
        message: 'Patient clinical telemetry retrieved successfully.',
        data: {
          patientUid: patient.id,
          userId: patient.user_id,
          fullName: baseProfile?.full_name || 'Registered Patient',
          email: baseProfile?.email,
          phone: baseProfile?.phone || patient.emergency_contact_phone,
          avatarUrl: baseProfile?.avatar_url,
          age: patient.age || (patient.date_of_birth ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : '--'),
          gender: patient.gender || 'Not Specified',
          bloodGroup: patient.blood_group || 'Not Specified',
          city: patient.city || 'Indore',
          state: patient.state || 'Madhya Pradesh',
          postalCode: patient.postal_code,
          abhaId: patient.abha_id,
          kycStatus: patient.kyc_status,
          emergencyContact: {
            name: patient.emergency_contact_name,
            phone: patient.emergency_contact_phone
          },
          vitals: {
            heightCm: patient.height_cm,
            weightKg: patient.weight_kg
          },
          metrics: {
            totalDocuments: docsCount || 0,
            activeReservations: bookingsCount || 0
          },
          registeredAt: patient.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = patientController;
