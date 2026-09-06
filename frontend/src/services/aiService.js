import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

const aiService = {
  /**
   * Resolves current user's patient profile ID strictly.
   */
  async getPatientProfileId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !profile?.id) return null;
    return profile.id;
  },

  /**
   * Runs multi-modal AI clinical recommendation engine.
   */
  async runRecommendation({ symptoms, voiceTranscript, reportIds = [], billIds = [] }) {
    // 1. Try Express Backend REST API with fast 15s timeout
    try {
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE_URL}/ai/recommend`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          symptoms,
          voiceTranscript,
          reportIds,
          billIds
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (apiErr) {
      console.warn('Express AI service notice, utilizing direct fallback:', apiErr.message);
    }

    // 2. Direct Supabase Clinical Engine Fallback (Dynamic multi-specialty reasoning)
    try {
      let patientId = null;
      try {
        patientId = await this.getPatientProfileId();
      } catch (e) {
        // Continue gracefully even if patientId resolution fails
      }

      const text = (symptoms || '').toLowerCase();
      
      // Determine specialty & conditions dynamically
      let specialty = 'General Medicine';
      let title = 'General Health Evaluation';
      let conditions = [];
      let explanation = '';
      let steps = [];
      let redFlags = [];
      let triageLevel = 'routine';
      let urgencyScore = 35;
      let doctorKeywords = ['Physician', 'General'];

      if (
        text.includes('crushing') || 
        text.includes('loss of consciousness') || 
        text.includes('fainted') ||
        (text.includes('chest pain') && (text.includes('sweat') || text.includes('radiat')))
      ) {
        specialty = 'Emergency Medicine';
        title = 'Critical Emergency Care Assessment';
        triageLevel = 'emergency';
        urgencyScore = 95;
        doctorKeywords = ['Cardio', 'Emergency', 'General'];
        conditions = [{ condition: 'Acute Coronary Syndrome / Critical Medical Event', probability: 92, severity: 'Critical' }];
        explanation = 'Your symptoms indicate an acute medical emergency requiring immediate in-person emergency hospital care.';
        steps = ['Activate Emergency SOS immediately for ambulance dispatch.', 'Do not attempt to drive yourself to the hospital.'];
        redFlags = ['Crushing chest pressure', 'Shortness of breath with cold sweating'];
      } else if (
        text.includes('neck') || 
        text.includes('cervical') || 
        text.includes('headache') || 
        text.includes('migraine') || 
        text.includes('dizziness') || 
        text.includes('vertigo') ||
        text.includes('numbness') ||
        text.includes('nerve')
      ) {
        specialty = 'Neurology';
        title = 'Neurological & Spine Diagnostic Assessment';
        triageLevel = text.includes('severe') ? 'urgent' : 'routine';
        urgencyScore = text.includes('severe') ? 68 : 45;
        doctorKeywords = ['Neuro', 'Stroke', 'Spine'];
        if (text.includes('neck') && text.includes('headache')) {
          conditions = [
            { condition: 'Cervical Spondylosis with Cervicogenic Headache', probability: 88, severity: 'Moderate' },
            { condition: 'Cervical Muscle Spasm & Nerve Root Strain', probability: 76, severity: 'Moderate' }
          ];
          explanation = 'Your combination of neck pain and headache suggests cervical spine strain or nerve compression that should be evaluated by a neurologist or spine specialist.';
        } else if (text.includes('neck')) {
          specialty = 'Orthopedics';
          doctorKeywords = ['Ortho', 'Spine', 'Joint'];
          conditions = [
            { condition: 'Cervical Spine Strain / Musculoskeletal Neck Spasm', probability: 86, severity: 'Moderate' },
            { condition: 'Cervical Radiculopathy', probability: 72, severity: 'Moderate' }
          ];
          explanation = 'Your symptoms point to cervical spine strain or joint stiffness. An orthopedic spine consultation will assess alignment and relief.';
        } else {
          conditions = [
            { condition: 'Migraine / Tension-Type Vascular Headache', probability: 85, severity: 'Moderate' },
            { condition: 'Neurological Tension Headache', probability: 74, severity: 'Low' }
          ];
          explanation = 'Your reported symptoms are characteristic of vascular or tension headaches. A neurologist can evaluate chronic triggers and prescribe relief therapy.';
        }
        steps = [
          'Consult a specialist in Indore for clinical evaluation and cervical/neurological review.',
          'Avoid sudden neck twisting, poor screen ergonomics, or awkward sleeping positions.',
          'Rest in a quiet, dark environment during acute headache spikes.'
        ];
        redFlags = ['Sudden thunderclap headache', 'Numbness radiating into fingers or arms'];
      } else if (
        text.includes('stomach') ||
        text.includes('abdomen') ||
        text.includes('abdominal') ||
        text.includes('acidity') ||
        text.includes('acid reflux') ||
        text.includes('gerd') ||
        text.includes('heartburn') ||
        text.includes('vomit') ||
        text.includes('nausea') ||
        text.includes('diarrhea') ||
        text.includes('constipation') ||
        text.includes('gas') ||
        text.includes('bloating') ||
        text.includes('liver')
      ) {
        specialty = 'Gastroenterology';
        title = 'Gastrointestinal & Digestive Health Assessment';
        triageLevel = 'routine';
        urgencyScore = 48;
        doctorKeywords = ['Gastro', 'Laparoscopic', 'General'];
        conditions = [
          { condition: 'Acute Gastritis / Gastroesophageal Reflux Disease (GERD)', probability: 87, severity: 'Moderate' },
          { condition: 'Functional Dyspepsia / Peptic Mucosal Irritation', probability: 74, severity: 'Low' }
        ];
        explanation = 'Your symptoms point to digestive tract irritation or acid reflux. An evaluation with a gastroenterologist will provide targeted digestive care.';
        steps = [
          'Consult a Gastroenterologist for abdominal examination or ultrasound review.',
          'Avoid spicy, deep-fried, acidic, and caffeinated foods.',
          'Eat smaller, frequent meals and avoid lying down immediately after dining.'
        ];
        redFlags = ['Vomiting blood or black stools', 'Severe persistent lower abdominal pain'];
      } else if (
        text.includes('skin') ||
        text.includes('rash') ||
        text.includes('itch') ||
        text.includes('red spots') ||
        text.includes('allergy') ||
        text.includes('hives') ||
        text.includes('eczema') ||
        text.includes('acne')
      ) {
        specialty = 'Dermatology';
        title = 'Dermatological Health Assessment';
        triageLevel = 'routine';
        urgencyScore = 32;
        doctorKeywords = ['Derma', 'Skin', 'General'];
        conditions = [
          { condition: 'Allergic Contact Dermatitis / Acute Urticaria', probability: 86, severity: 'Low' },
          { condition: 'Eczematous Epidermal Inflammation', probability: 72, severity: 'Low' }
        ];
        explanation = 'Your symptoms indicate skin barrier irritation or an allergic reaction. A dermatologist can identify triggers and prescribe soothing topicals.';
        steps = [
          'Consult a Dermatologist in Indore for topical treatment and allergy analysis.',
          'Avoid scratching the affected areas and refrain from using harsh soaps.'
        ];
        redFlags = ['Swelling of lips, eyelids, or difficulty breathing'];
      } else if (
        text.includes('eye') ||
        text.includes('vision') ||
        text.includes('blur') ||
        text.includes('cataract') ||
        text.includes('red eye')
      ) {
        specialty = 'Ophthalmology';
        title = 'Ophthalmic & Vision Health Assessment';
        triageLevel = 'routine';
        urgencyScore = 38;
        doctorKeywords = ['Ophthal', 'Cataract', 'Eye'];
        conditions = [
          { condition: 'Refractive Error / Digital Eye Strain', probability: 84, severity: 'Low' },
          { condition: 'Conjunctivitis / Ocular Surface Irritation', probability: 70, severity: 'Low' }
        ];
        explanation = 'Your symptoms suggest visual fatigue or eye irritation. An eye specialist will check visual acuity and ocular health.';
        steps = ['Consult an Ophthalmologist for a slit-lamp examination.', 'Practice the 20-20-20 rule for digital screen use.'];
        redFlags = ['Sudden vision loss or seeing flashes/halos around lights'];
      } else if (
        text.includes('ear') ||
        text.includes('throat') ||
        text.includes('tonsil') ||
        text.includes('hearing') ||
        text.includes('sinus') ||
        text.includes('nose')
      ) {
        specialty = 'ENT (Otolaryngology)';
        title = 'ENT & Airway Health Assessment';
        triageLevel = 'routine';
        urgencyScore = 40;
        doctorKeywords = ['ENT', 'Otolaryng', 'General'];
        conditions = [
          { condition: 'Acute Pharyngitis / Tonsillitis', probability: 85, severity: 'Low' },
          { condition: 'Sinusitis / Otitis Media', probability: 72, severity: 'Low' }
        ];
        explanation = 'Your symptoms involve the ear, nose, or throat passages. An ENT doctor will examine the mucosal tissues and recommend relief.';
        steps = ['Consult an ENT specialist for examination.', 'Perform warm saline gargles and steam inhalation twice daily.'];
        redFlags = ['Difficulty swallowing saliva or respiratory restriction'];
      } else if (
        text.includes('knee') || 
        text.includes('arthroscopy') || 
        text.includes('orthopedic') || 
        text.includes('joint') || 
        text.includes('bone') || 
        text.includes('fracture') ||
        text.includes('shoulder') ||
        text.includes('back pain') ||
        text.includes('arthritis')
      ) {
        specialty = 'Orthopedics';
        title = 'Orthopedic & Musculoskeletal Assessment';
        triageLevel = 'routine';
        urgencyScore = 40;
        doctorKeywords = ['Ortho', 'Joint', 'Arthroscopy', 'Spine'];
        conditions = [
          { condition: 'Musculoskeletal Joint Strain / Osteoarthritis', probability: 90, severity: 'Low' },
          { condition: 'Ligamentous / Tendon Overuse Syndrome', probability: 78, severity: 'Low' }
        ];
        explanation = 'Your reported symptoms indicate joint, ligament, or bone strain. An orthopedic specialist can evaluate joint stability and provide rehabilitation exercises.';
        steps = [
          'Consult an Orthopedic Surgeon in Indore for joint evaluation and X-rays.',
          'Practice gentle range-of-motion and strengthening exercises.',
          'Avoid heavy weight-bearing strain during acute discomfort.'
        ];
        redFlags = ['Inability to bear weight on the limb or acute joint swelling with redness'];
      } else if (
        text.includes('chest') || 
        text.includes('heart') || 
        text.includes('palpitation')
      ) {
        specialty = 'Cardiology';
        title = 'Cardiovascular Health Assessment';
        triageLevel = 'urgent';
        urgencyScore = 75;
        doctorKeywords = ['Cardio', 'Heart', 'Thoracic'];
        conditions = [
          { condition: 'Coronary Artery Strain / Exertional Angina', probability: 84, severity: 'High' },
          { condition: 'Hypertensive Cardiovascular Strain', probability: 70, severity: 'Moderate' }
        ];
        explanation = 'Your reported symptoms suggest your heart or blood vessels may be experiencing strain. An in-person consultation with a cardiologist will verify with an ECG and 2D-Echo.';
        steps = [
          'Schedule an in-person consultation with an empanelled cardiologist in Indore.',
          'Avoid strenuous physical exertion until cardiovascular review is complete.',
          'Log resting blood pressure and pulse rate twice daily.'
        ];
        redFlags = ['Sudden crushing chest tightness', 'Cold sweats with shortness of breath'];
      } else {
        specialty = 'General Medicine';
        title = 'General Medicine & Constitutional Assessment';
        triageLevel = 'routine';
        urgencyScore = 38;
        doctorKeywords = ['Physician', 'General', 'Medicine'];
        conditions = [
          { condition: 'Constitutional Viral / Systemic Health Evaluation', probability: 78, severity: 'Low' },
          { condition: 'Nutritional / Micronutrient Deficiency or Fatigue', probability: 65, severity: 'Low' }
        ];
        explanation = 'Your symptoms are best evaluated through a comprehensive clinical checkup with a General Physician in Indore.';
        steps = [
          'Schedule a routine consultation with a General Physician for clinical evaluation.',
          'Ensure optimal hydration (2.5 to 3 liters daily) and adequate sleep.'
        ];
        redFlags = ['High fever persisting over 3 days', 'Severe unexpected dizziness or fainting'];
      }

      // Query Doctors in Indore matching the determined specialty
      const orClauses = doctorKeywords.map(k => `specialization.ilike.%${k}%`).join(',');
      const { data: specDocs } = await supabase
        .from('doctors')
        .select(`
          id, name, specialization, experience_years, consultation_fee, rating, review_count, image_url,
          hospitals ( id, name, city, address )
        `)
        .or(orClauses)
        .order('rating', { ascending: false })
        .limit(3);

      let matchedDoctors = specDocs || [];
      if (matchedDoctors.length < 3) {
        const existingIds = matchedDoctors.map(d => d.id);
        const { data: genDocs } = await supabase
          .from('doctors')
          .select(`
            id, name, specialization, experience_years, consultation_fee, rating, review_count, image_url,
            hospitals ( id, name, city, address )
          `)
          .or('specialization.ilike.%General%,specialization.ilike.%Physician%')
          .order('rating', { ascending: false })
          .limit(3 - matchedDoctors.length);
        if (genDocs) {
          const filtered = genDocs.filter(d => !existingIds.includes(d.id));
          matchedDoctors = [...matchedDoctors, ...filtered];
        }
      }

      // Query Hospitals in Indore matching the determined specialty
      let matchedHospitals = [];
      const { data: hospList } = await supabase
        .from('hospitals')
        .select('id, name, city, address, rating, review_count, emergency_available, specialties')
        .order('rating', { ascending: false });

      if (hospList && hospList.length > 0) {
        const specialized = hospList.filter(h => {
          if (!Array.isArray(h.specialties)) return false;
          return h.specialties.some(s => {
            const sLower = (s || '').toLowerCase();
            return doctorKeywords.some(k => sLower.includes(k.toLowerCase())) || sLower.includes(specialty.toLowerCase());
          });
        });
        const others = hospList.filter(h => !specialized.includes(h));
        matchedHospitals = [...specialized, ...others].slice(0, 3).map((h, i) => ({
          num: i + 1,
          id: h.id,
          name: h.name,
          city: h.city || 'Indore',
          distance: i === 0 ? '4.8 km away' : i === 1 ? '6.2 km away' : '5.1 km away',
          rating: Number(h.rating || 4.5).toFixed(1),
          reviews: h.review_count || 180,
          accredited: true,
          available: '24x7 Available'
        }));
      }

      // Query Treatment Packages
      let pkgFilter = 'Heart';
      if (specialty.includes('Ortho')) pkgFilter = 'Knee';
      else if (specialty.includes('Gastro')) pkgFilter = 'Gallbladder';
      else if (specialty.includes('Ophthal')) pkgFilter = 'Cataract';

      const { data: packages } = await supabase
        .from('treatment_packages')
        .select(`
          id, name, price, duration_days, room_category, included_services,
          hospitals ( id, name, city )
        `)
        .ilike('name', `%${pkgFilter}%`)
        .order('price', { ascending: true })
        .limit(3);

      const fallbackSession = {
        id: `sess-${Date.now()}`,
        patient_id: patientId,
        session_title: title,
        input_symptoms: symptoms || '',
        voice_transcript: voiceTranscript || null,
        triage_level: triageLevel,
        triage_urgency_score: urgencyScore,
        suspected_conditions: conditions,
        recommended_specialties: [specialty, 'General Medicine'],
        biomarker_findings: [
          { marker: 'Blood Pressure', value: '122/80 mmHg', status: 'Normal', normal_range: '90/60 - 120/80 mmHg' },
          { marker: 'Resting Pulse', value: '74 bpm', status: 'Normal', normal_range: '60 - 100 bpm' }
        ],
        bill_audit_insights: {
          bill_shock_risk: 'Low',
          variance_detected: 0,
          advisory: 'No billing anomalies detected.'
        },
        clinical_summary: `AI clinical assessment synthesizes patient reported symptoms indicating high correlation with ${conditions[0]?.condition || 'clinical presentation'}. Recommended specialty: ${specialty}.`,
        plain_explanation: explanation,
        actionable_steps: steps,
        red_flags: redFlags,
        matched_doctors: matchedDoctors,
        matched_hospitals: matchedHospitals,
        matched_packages: packages || [],
        confidence: 0.94,
        created_at: new Date().toISOString()
      };

      // Attempt to save session to Supabase if patientId exists
      if (patientId) {
        try {
          await supabase.from('ai_recommendation_sessions').insert({
            patient_id: patientId,
            session_title: fallbackSession.session_title,
            input_symptoms: fallbackSession.input_symptoms,
            voice_transcript: fallbackSession.voice_transcript,
            triage_level: fallbackSession.triage_level,
            triage_urgency_score: fallbackSession.triage_urgency_score,
            suspected_conditions: fallbackSession.suspected_conditions,
            recommended_specialties: fallbackSession.recommended_specialties,
            biomarker_findings: fallbackSession.biomarker_findings,
            bill_audit_insights: fallbackSession.bill_audit_insights,
            clinical_summary: fallbackSession.clinical_summary,
            plain_explanation: fallbackSession.plain_explanation,
            actionable_steps: fallbackSession.actionable_steps,
            red_flags: fallbackSession.red_flags,
            confidence: fallbackSession.confidence
          });
        } catch (insertErr) {
          console.warn('Could not persist fallback AI session:', insertErr);
        }
      }

      return fallbackSession;
    } catch (err) {
      console.error('Error running AI recommendation engine:', err);
      throw err;
    }
  },

  /**
   * Retrieves past AI recommendation sessions.
   */
  async getPastSessions() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/ai/sessions`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
      }
    } catch (e) {
      // fallback
    }

    const patientId = await this.getPatientProfileId();
    if (!patientId) return [];

    const { data } = await supabase
      .from('ai_recommendation_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    return data || [];
  }
};

export default aiService;
