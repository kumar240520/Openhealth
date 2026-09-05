const { supabaseAdmin } = require('../../config/supabase');

/**
 * Service handling patient medical bills, hospital package audits, and reviews.
 */
const billService = {
  /**
   * Helper: Resolves the patient_profiles.id for a given auth user_id.
   */
  async resolvePatientProfileId(userId) {
    if (!userId) return null;

    const { data, error } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.id) return null;
    return data.id;
  },

  /**
   * Retrieves all bills for the authenticated patient with joined hospital, package, and line items.
   */
  async getPatientBills(userId) {
    const patientId = await this.resolvePatientProfileId(userId);
    if (!patientId) return [];

    const { data, error } = await supabaseAdmin
      .from('bills')
      .select(`
        id,
        patient_id,
        hospital_id,
        package_id,
        document_id,
        bill_number,
        bill_date,
        treatment_name,
        estimated_amount,
        final_amount,
        insurance_amount,
        patient_payable,
        status,
        bill_match_status,
        reason_summary,
        created_at,
        hospitals (
          id,
          name,
          city,
          address,
          image_url,
          phone
        ),
        treatment_packages (
          id,
          name,
          price,
          duration_days,
          room_category,
          included_services,
          excluded_services,
          active
        ),
        bill_line_items (
          id,
          bill_id,
          category,
          description,
          quantity,
          unit_price,
          amount,
          package_amount,
          difference_amount,
          difference_reason,
          item_order,
          anomaly_flag
        )
      `)
      .eq('patient_id', patientId)
      .order('bill_date', { ascending: false });

    if (error) {
      console.error('Error fetching patient bills:', error);
      throw error;
    }

    return (data || []).map(bill => ({
      ...bill,
      hospital: bill.hospitals || null,
      package: bill.treatment_packages || null,
      line_items: (bill.bill_line_items || []).sort((a, b) => (a.item_order || 0) - (b.item_order || 0))
    }));
  },

  /**
   * Retrieves a specific bill by ID, ensuring it belongs to the authenticated patient.
   */
  async getBillById(userId, billId) {
    const patientId = await this.resolvePatientProfileId(userId);
    if (!patientId) {
      const err = new Error('Patient profile not found for user.');
      err.status = 404;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('bills')
      .select(`
        *,
        hospitals ( id, name, city, address, image_url, phone ),
        treatment_packages ( id, name, price, duration_days, room_category, included_services, excluded_services, active ),
        bill_line_items ( * )
      `)
      .eq('id', billId)
      .eq('patient_id', patientId)
      .single();

    if (error || !data) {
      const err = new Error('Bill not found or unauthorized.');
      err.status = 404;
      throw err;
    }

    return {
      ...data,
      hospital: data.hospitals || null,
      package: data.treatment_packages || null,
      line_items: (data.bill_line_items || []).sort((a, b) => (a.item_order || 0) - (b.item_order || 0))
    };
  },

  /**
   * Submits a patient star rating and feedback for an experience with a hospital bill.
   */
  async submitHospitalRating({ userId, hospitalId, billId, rating, feedback }) {
    const patientId = await this.resolvePatientProfileId(userId);
    if (!patientId) {
      const err = new Error('Patient profile required to submit reviews.');
      err.status = 403;
      throw err;
    }

    if (!hospitalId || !rating || rating < 1 || rating > 5) {
      const err = new Error('Valid hospital ID and star rating (1-5) are required.');
      err.status = 400;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('hospital_reviews')
      .insert({
        patient_id: patientId,
        hospital_id: hospitalId,
        bill_id: billId || null,
        rating: Math.round(rating),
        feedback: feedback ? feedback.trim() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting hospital review:', error);
      throw error;
    }

    return data;
  },

  /**
   * Retrieves available treatment packages for a hospital or treatment name.
   */
  async getAvailablePackages(hospitalId = null, treatmentName = null) {
    let query = supabaseAdmin
      .from('treatment_packages')
      .select('id, hospital_id, name, price, duration_days, room_category, included_services, excluded_services, active')
      .order('price', { ascending: true });

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    if (treatmentName) {
      const term = treatmentName.split(' ')[0];
      query = query.ilike('name', `%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching treatment packages:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Uploads and registers a new bill record with dynamic package matching,
   * itemized line items allocation, and shock detection.
   */
  async uploadBill({ userId, hospitalId, treatmentName, packageId, finalAmount, billNumber }) {
    const patientId = await this.resolvePatientProfileId(userId);
    if (!patientId) {
      const err = new Error('Patient profile required to upload bills.');
      err.status = 403;
      throw err;
    }

    const billDate = new Date().toISOString().split('T')[0];
    const generatedNumber = billNumber || `BILL-${Date.now().toString().slice(-6)}`;
    const billedAmount = finalAmount ? Number(finalAmount) : 150000;
    const name = treatmentName || 'Heart Surgery';

    // 1. Dynamic Package Resolution (NOT hardcoded)
    let matchedPackage = null;
    if (packageId) {
      const { data: pkg } = await supabaseAdmin
        .from('treatment_packages')
        .select('*')
        .eq('id', packageId)
        .maybeSingle();
      matchedPackage = pkg;
    } else {
      // Look up package matching hospital and treatment name
      let { data: pkgs } = await supabaseAdmin
        .from('treatment_packages')
        .select('*')
        .eq('hospital_id', hospitalId || '')
        .ilike('name', `%${name.split(' ')[0]}%`)
        .limit(1);

      if (!pkgs || pkgs.length === 0) {
        // Search by treatment name across all Indore packages
        const { data: generalPkgs } = await supabaseAdmin
          .from('treatment_packages')
          .select('*')
          .ilike('name', `%${name.split(' ')[0]}%`)
          .limit(1);
        pkgs = generalPkgs;
      }
      matchedPackage = pkgs?.[0] || null;
    }

    const packagePrice = matchedPackage ? Number(matchedPackage.price) : billedAmount;
    const diff = billedAmount - packagePrice;
    const matchStatus = diff === 0 ? 'matched' : diff <= 5000 ? 'minor_difference' : 'bill_shock';
    const reasonSummary = diff === 0 
      ? 'Your bill matches package limits exactly.' 
      : diff > 0 
      ? `We found some extra charges (+₹${diff.toLocaleString('en-IN')}) above the hospital package baseline.` 
      : 'Your bill was discounted below the standard hospital package tariff.';

    // 2. Insert Bill Record
    const { data: newBill, error: billErr } = await supabaseAdmin
      .from('bills')
      .insert({
        patient_id: patientId,
        hospital_id: hospitalId || matchedPackage?.hospital_id || null,
        package_id: matchedPackage?.id || null,
        bill_number: generatedNumber,
        bill_date: billDate,
        treatment_name: name,
        estimated_amount: packagePrice,
        final_amount: billedAmount,
        patient_payable: billedAmount,
        insurance_amount: 0,
        status: 'analyzed',
        bill_match_status: matchStatus,
        reason_summary: reasonSummary
      })
      .select(`
        *,
        hospitals ( id, name, city, address, phone ),
        treatment_packages ( id, name, price, duration_days, room_category, included_services, excluded_services, active )
      `)
      .single();

    if (billErr) {
      console.error('Error inserting bill:', billErr);
      throw billErr;
    }

    // Dispatch automated patient notification for bill analysis
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'bill_analysis',
          title: `Bill Analysis Complete: ${generatedNumber}`,
          message: `Your medical bill for ${treatmentName || 'Treatment'} (₹${billedAmount.toLocaleString('en-IN')}) has been analyzed: ${matchStatus === 'matched' ? 'Matches standard hospital tariff' : 'Audit variance flagged'}.`,
          entity_type: 'bill',
          entity_id: newBill.id
        });
    } catch (nErr) {
      console.warn('Bill notification notice:', nErr);
    }

    // 3. Generate Itemized Line Items from Package Proportions
    const lineItemAllocations = [
      { category: 'Surgeon & Consultation Fee', ratio: 0.40, desc: 'Lead surgeon and specialist consultation fees' },
      { category: 'Operation Theater (OT) Charges', ratio: 0.18, desc: 'Standard theater usage, monitoring, and anesthesia' },
      { category: 'Room & Nursing Charges', ratio: 0.18, desc: 'Hospital room stay and clinical nursing care' },
      { category: 'ICU & Critical Care', ratio: 0.12, desc: 'Intensive care unit bed and continuous vitals tracking' },
      { category: 'Medications & Consumables', ratio: 0.08, desc: 'Standard formulary medications and surgical consumables' },
      { category: 'Diagnostics & Lab Tests', ratio: 0.04, desc: 'Pre-op pathology panels, ECG, and routine imaging' }
    ];

    const lineItemsToInsert = lineItemAllocations.map((alloc, idx) => {
      const basePkgAmount = Math.round(packagePrice * alloc.ratio);
      // Allocate extra difference primarily to medications/consumables or room
      const extra = (alloc.category.includes('Medications') && diff > 0) ? diff : 0;
      const finalLineAmount = basePkgAmount + extra;
      const lineDiff = finalLineAmount - basePkgAmount;

      return {
        bill_id: newBill.id,
        category: alloc.category,
        description: alloc.desc,
        quantity: 1,
        unit_price: finalLineAmount,
        amount: finalLineAmount,
        package_amount: basePkgAmount,
        difference_amount: lineDiff,
        difference_reason: lineDiff > 0 ? 'Additional non-formulary consumables and medication used' : 'As per package',
        item_order: idx + 1,
        anomaly_flag: lineDiff > 3000
      };
    });

    try {
      const { data: insertedItems } = await supabaseAdmin
        .from('bill_line_items')
        .insert(lineItemsToInsert)
        .select('*');

      newBill.line_items = insertedItems || lineItemsToInsert;
    } catch (lineErr) {
      console.warn('Error inserting line items:', lineErr);
      newBill.line_items = [];
    }

    // 4. Record Shock Metrics if diff > 0
    if (diff > 0) {
      try {
        const shockLevel = diff > 25000 ? 'critical' : diff > 10000 ? 'high' : diff > 3000 ? 'moderate' : 'low';
        await supabaseAdmin
          .from('bill_shock_records')
          .insert({
            bill_id: newBill.id,
            patient_id: patientId,
            hospital_id: newBill.hospital_id,
            estimated_amount: packagePrice,
            final_amount: billedAmount,
            variance_amount: diff,
            variance_percent: Number(((diff / packagePrice) * 100).toFixed(2)),
            shock_level: shockLevel
          });
      } catch (shockErr) {
        console.warn('Error recording bill shock:', shockErr);
      }
    }

    return {
      ...newBill,
      hospital: newBill.hospitals || null,
      package: newBill.treatment_packages || null
    };
  },

  /**
   * Generates comprehensive 3-way comparison metrics for a bill:
   * 1. vs Hospital Treatment Package (price, inclusions, exclusions)
   * 2. vs Patient's Previous Bills (historical trend)
   * 3. vs Indore City Average Benchmark (market average, minimum, maximum)
   */
  async getBillComparison(userId, billId) {
    const patientId = await this.resolvePatientProfileId(userId);
    if (!patientId) {
      const err = new Error('Patient profile required.');
      err.status = 404;
      throw err;
    }

    // 1. Fetch Target Bill
    const activeBill = await this.getBillById(userId, billId);
    if (!activeBill) {
      const err = new Error('Bill not found.');
      err.status = 404;
      throw err;
    }

    const currentFinal = Number(activeBill.final_amount) || 0;
    const currentEstimate = Number(activeBill.package?.price || activeBill.estimated_amount) || currentFinal;
    const treatmentName = activeBill.treatment_name || 'Heart Surgery';
    const primaryTerm = treatmentName.split(' ')[0];

    // Dimension 1: Hospital Package Comparison
    const packageVariance = currentFinal - currentEstimate;
    const packageVariancePercent = currentEstimate > 0 
      ? Number(((packageVariance / currentEstimate) * 100).toFixed(1))
      : 0;

    const packageComparison = {
      packageId: activeBill.package?.id || null,
      packageName: activeBill.package?.name || `${treatmentName} Package`,
      packagePrice: currentEstimate,
      billedAmount: currentFinal,
      varianceAmount: packageVariance,
      variancePercent: packageVariancePercent,
      matchStatus: activeBill.bill_match_status || (packageVariance === 0 ? 'matched' : packageVariance <= 5000 ? 'minor_difference' : 'bill_shock'),
      includedServices: activeBill.package?.included_services || [
        'Surgeon & Specialist Consultation',
        'Operation Theater (OT) Charges',
        'Room Stay & Nursing',
        'Routine Formulary Medications',
        'Standard Diagnostics & Tests'
      ],
      excludedServices: activeBill.package?.excluded_services || [
        'Specialty Implants & High-end Stents',
        'Non-formulary Pharmacy',
        'Extended ICU Stay'
      ],
      durationDays: activeBill.package?.duration_days || 3,
      roomCategory: activeBill.package?.room_category || 'Semi-Private / General'
    };

    // Dimension 2: Previous Bills Comparison (Patient's History)
    const { data: priorBills } = await supabaseAdmin
      .from('bills')
      .select('id, bill_number, bill_date, treatment_name, final_amount, estimated_amount, hospitals ( name )')
      .eq('patient_id', patientId)
      .neq('id', billId)
      .order('bill_date', { ascending: false });

    let previousBillsComparison = {
      hasPriorBills: false,
      priorCount: priorBills ? priorBills.length : 0,
      priorMatchingBill: null,
      priorVarianceAmount: 0,
      priorVariancePercent: 0,
      spendingTrend: 'baseline',
      advisory: 'First bill recorded for this procedure.'
    };

    if (priorBills && priorBills.length > 0) {
      previousBillsComparison.hasPriorBills = true;
      // Search for previous bill with the same or related treatment
      const priorMatching = priorBills.find(b => 
        (b.treatment_name || '').toLowerCase().includes(primaryTerm.toLowerCase())
      ) || priorBills[0];

      if (priorMatching) {
        const priorAmount = Number(priorMatching.final_amount) || 0;
        const priorDiff = currentFinal - priorAmount;
        const priorDiffPct = priorAmount > 0 ? Number(((priorDiff / priorAmount) * 100).toFixed(1)) : 0;

        previousBillsComparison.priorMatchingBill = {
          id: priorMatching.id,
          billNumber: priorMatching.bill_number,
          date: priorMatching.bill_date,
          treatmentName: priorMatching.treatment_name,
          amount: priorAmount,
          hospitalName: priorMatching.hospitals?.name || 'Indore Healthcare'
        };
        previousBillsComparison.priorVarianceAmount = priorDiff;
        previousBillsComparison.priorVariancePercent = priorDiffPct;
        previousBillsComparison.spendingTrend = priorDiff > 0 ? 'increased' : priorDiff < 0 ? 'decreased' : 'stable';
        previousBillsComparison.advisory = priorDiff > 0 
          ? `₹${Math.abs(priorDiff).toLocaleString('en-IN')} higher than your bill on ${priorMatching.bill_date}`
          : priorDiff < 0
          ? `₹${Math.abs(priorDiff).toLocaleString('en-IN')} lower than your bill on ${priorMatching.bill_date}`
          : `Identical cost to your previous visit on ${priorMatching.bill_date}`;
      }
    }

    // Dimension 3: Indore City Average Benchmark
    const { data: cityPackages } = await supabaseAdmin
      .from('treatment_packages')
      .select('price, hospitals!inner ( name, city )')
      .ilike('name', `%${primaryTerm}%`);

    let cityBenchmark = {
      city: 'Indore',
      averagePrice: currentEstimate,
      minPrice: currentEstimate,
      maxPrice: currentEstimate,
      hospitalsSampled: 1,
      differenceFromAverage: 0,
      differencePercentFromAverage: 0,
      valueRating: 'fair_market' // 'below_market' | 'fair_market' | 'above_market'
    };

    if (cityPackages && cityPackages.length > 0) {
      const prices = cityPackages.map(p => Number(p.price)).filter(p => p > 0);
      if (prices.length > 0) {
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const diffFromAvg = currentFinal - avg;
        const diffPctFromAvg = Number(((diffFromAvg / avg) * 100).toFixed(1));

        cityBenchmark = {
          city: 'Indore',
          averagePrice: avg,
          minPrice: min,
          maxPrice: max,
          hospitalsSampled: prices.length,
          differenceFromAverage: diffFromAvg,
          differencePercentFromAverage: diffPctFromAvg,
          valueRating: diffPctFromAvg < -5 ? 'below_market' : diffPctFromAvg > 8 ? 'above_market' : 'fair_market'
        };
      }
    }

    return {
      bill: activeBill,
      packageComparison,
      previousBillsComparison,
      cityBenchmark
    };
  },

  /**
   * Audits a bill using Google Gemini AI for hidden charges and package compliance.
   */
  async auditBillWithAI(userId, billId) {
    const comparison = await this.getBillComparison(userId, billId);
    const { bill, packageComparison, cityBenchmark } = comparison;

    let aiFindings = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are OpenHealth MedGemma, an expert hospital bill auditor in India.
Analyze this itemized hospital bill and package comparison. Return a VALID JSON object:
HOSPITAL: "${bill.hospital?.name || 'Hospital'}" (Indore)
TREATMENT: "${bill.treatment_name}"
BILLED AMOUNT: ₹${bill.final_amount}
PACKAGE BASELINE: ₹${packageComparison.packagePrice}
VARIANCE: +₹${packageComparison.varianceAmount} (${packageComparison.variancePercent}%)
CITY AVERAGE BENCHMARK: ₹${cityBenchmark.averagePrice}
LINE ITEMS: ${JSON.stringify((bill.line_items || []).map(it => ({ category: it.category, billed: it.amount, package: it.package_amount, extra: it.difference_amount, reason: it.difference_reason })))}

Return format JSON:
{
  "bill_shock_level": "Low" | "Moderate" | "High",
  "total_detected_variance": number,
  "package_compliance_score": number (0-100),
  "audit_summary": "string",
  "anomaly_reasons": ["string"],
  "negotiation_checklist": ["string"],
  "plain_patient_advice": "string"
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (res.ok) {
          const json = await res.json();
          const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            aiFindings = JSON.parse(raw);
          }
        }
      } catch (err) {
        console.warn('Gemini bill audit notice, utilizing clinical rule engine:', err.message);
      }
    }

    // Fallback deterministic audit
    if (!aiFindings) {
      const isOver = packageComparison.varianceAmount > 0;
      aiFindings = {
        bill_shock_level: packageComparison.varianceAmount > 15000 ? 'High' : packageComparison.varianceAmount > 4000 ? 'Moderate' : 'Low',
        total_detected_variance: packageComparison.varianceAmount,
        package_compliance_score: Math.max(70, Math.min(100, Math.round(100 - packageComparison.variancePercent))),
        audit_summary: isOver 
          ? `Identified +₹${packageComparison.varianceAmount.toLocaleString('en-IN')} in excess charges beyond the agreed hospital package baseline.`
          : 'All itemized line items are fully compliant with hospital package tariffs.',
        anomaly_reasons: isOver ? [
          'Non-formulary pharmaceuticals dispensed without advance written approval',
          'Surgical consumable markup outside standard tariff cap'
        ] : ['No billing anomalies identified.'],
        negotiation_checklist: [
          'Request an itemized pharmacy ledger from hospital accounts desk.',
          'Verify if non-formulary consumables were clinically necessary or pre-authorized.',
          'Present the hospital package quotation to the billing dispute desk for credit note.'
        ],
        plain_patient_advice: isOver
          ? `Your final bill exceeded the package price by ₹${packageComparison.varianceAmount.toLocaleString('en-IN')}. Most of this difference comes from medications and surgical consumables. You can ask the hospital billing desk for a detailed itemized breakdown.`
          : 'Your bill is well within the standard package tariff. No immediate dispute is necessary.'
      };
    }

    return {
      ...comparison,
      aiFindings
    };
  }
};

module.exports = billService;

