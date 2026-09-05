import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  CreditCard 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import { 
  getDynamicAppointmentDates, 
  getAvailableSlotsForDate, 
  getDefaultAppointmentSelection 
} from '../../utils/appointmentTimeUtils';

export default function BookAppointmentModal({ doctor, onClose, onBookingSuccess }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Dynamic real-time synchronized dates and time slots
  const initialSelection = React.useMemo(() => getDefaultAppointmentSelection(), []);
  const [selectedDate, setSelectedDate] = useState(initialSelection.selectedDate);
  const [selectedTime, setSelectedTime] = useState(initialSelection.selectedTime);
  const [consultationType, setConsultationType] = useState('in_clinic'); // 'in_clinic' | 'video'
  const [patientNotes, setPatientNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Daily appointment slots & doctor uniqueness validation state
  const [slotStatus, setSlotStatus] = useState({
    canBook: true,
    activeSlotsCount: 0,
    maxSlots: 2,
    remainingSlots: 2,
    isSameDoctorBooked: false,
    bookedDoctorName: null
  });
  const [checkingSlots, setCheckingSlots] = useState(false);

  // Dynamically recomputed dates and available slots
  const availableDates = React.useMemo(() => getDynamicAppointmentDates(), []);
  const availableSlots = React.useMemo(() => getAvailableSlotsForDate(selectedDate), [selectedDate]);

  // Keep selectedTime valid when switching dates
  React.useEffect(() => {
    if (availableSlots.all.length > 0 && !availableSlots.all.includes(selectedTime)) {
      setSelectedTime(availableSlots.all[0]);
    } else if (availableSlots.all.length === 0) {
      setSelectedTime('');
    }
  }, [availableSlots, selectedTime]);

  // Check daily slot availability whenever doctor or selectedDate changes
  React.useEffect(() => {
    let isMounted = true;
    async function checkSlots() {
      if (!doctor?.id || !selectedDate) return;
      setCheckingSlots(true);
      try {
        const status = await bookingService.checkDailySlotAvailability(doctor.id, selectedDate);
        if (isMounted) {
          setSlotStatus(status);
        }
      } catch (err) {
        console.warn('Daily slot availability check notice:', err);
      } finally {
        if (isMounted) setCheckingSlots(false);
      }
    }
    checkSlots();
    return () => { isMounted = false; };
  }, [doctor?.id, selectedDate]);

  const consultationFee = doctor?.consultation_fee ? Number(doctor.consultation_fee) : 800;
  const hospitalName = doctor?.hospitals?.name || doctor?.hospital_name || 'City Hospital';
  const city = doctor?.hospitals?.city || doctor?.city || 'Indore';

  const handleConfirmBooking = async () => {
    if (!user) {
      onClose();
      navigate('/login');
      return;
    }

    // Pre-flight client guard for slot limits and doctor uniqueness
    if (!slotStatus.canBook) {
      if (slotStatus.isSameDoctorBooked) {
        setErrorMsg(`You already have an appointment booked with Dr. ${doctor.name} on ${selectedDate}. OpenHealth allows up to 2 appointments per day, but they must be with different doctors.`);
      } else if (slotStatus.activeSlotsCount >= 2) {
        setErrorMsg(`Daily limit reached (2/2 active slots booked for ${selectedDate}). Please complete or cancel an existing appointment to free up a slot.`);
      }
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // Invoke backend booking service
      const confirmedData = await bookingService.bookAppointment({
        doctorId: doctor.id,
        hospitalId: doctor.hospital_id || null,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        consultationType,
        patientNotes
      });

      const details = {
        appointmentId: confirmedData.appointmentId,
        doctorName: confirmedData.doctorName || doctor.name,
        specialization: confirmedData.specialization || doctor.specialization,
        hospitalName: confirmedData.hospitalName || hospitalName,
        date: confirmedData.date || selectedDate,
        time: confirmedData.time || selectedTime,
        type: confirmedData.type || (consultationType === 'in_clinic' ? 'In-Clinic Consultation' : 'Video Teleconsultation'),
        fee: confirmedData.fee || consultationFee
      };

      setBookingDetails(details);
      setBookingSuccess(true);

      if (onBookingSuccess) {
        onBookingSuccess(details);
      }
    } catch (err) {
      console.error('Booking appointment error:', err);

      // Check if this error is an invariant/validation rejection
      const isValidationError = err.message && (
        err.message.includes('already have an appointment') ||
        err.message.includes('Daily appointment limit') ||
        err.message.includes('different doctors') ||
        err.message.includes('active slots booked')
      );

      if (isValidationError) {
        setErrorMsg(err.message);
        // Refresh slot status
        bookingService.checkDailySlotAvailability(doctor.id, selectedDate).then(setSlotStatus);
        return;
      }

      // If backend network error, attempt resilient fallback
      try {
        let { data: patProfile } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!patProfile?.id) {
          const { data: newPat } = await supabase
            .from('patient_profiles')
            .insert({ user_id: user.id, city })
            .select('id')
            .single();
          patProfile = newPat;
        }

        const { data: appointment, error: aErr } = await supabase
          .from('doctor_appointments')
          .insert({
            patient_id: patProfile?.id || null,
            doctor_id: doctor.id,
            hospital_id: doctor.hospital_id || null,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            consultation_type: consultationType,
            status: 'confirmed',
            patient_notes: patientNotes || 'General clinical consultation',
            consultation_fee: consultationFee
          })
          .select()
          .single();

        if (aErr) throw aErr;

        const details = {
          appointmentId: appointment?.id || `APT-${Date.now().toString().slice(-6)}`,
          doctorName: doctor.name,
          specialization: doctor.specialization,
          hospitalName,
          date: selectedDate,
          time: selectedTime,
          type: consultationType === 'in_clinic' ? 'In-Clinic Consultation' : 'Video Teleconsultation',
          fee: consultationFee
        };

        setBookingDetails(details);
        setBookingSuccess(true);
        if (onBookingSuccess) onBookingSuccess(details);
      } catch (fallbackErr) {
        const displayErr = fallbackErr.message || err.message || 'Failed to confirm appointment. Please try again.';
        setErrorMsg(displayErr);
        bookingService.checkDailySlotAvailability(doctor.id, selectedDate).then(setSlotStatus);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col justify-between custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Header with Doctor Card Summary */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            Direct Appointment Booking
          </span>
          <div className="flex items-center gap-3.5 mt-3">
            <img 
              src={doctor.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'} 
              alt={doctor.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
              }}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
            />
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {doctor.name}
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                {doctor.specialization}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 font-bold mt-0.5">
                <Building2 className="w-3 h-3" />
                <span>{hospitalName}, {city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Modal Body */}
        <div className="p-6 flex flex-col gap-5 text-xs">
          
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {bookingSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">Appointment Confirmed!</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Your appointment with <strong className="text-slate-800">{bookingDetails?.doctorName}</strong> is scheduled for <strong className="text-slate-800">{bookingDetails?.time}</strong> on <strong className="text-slate-800">{bookingDetails?.date}</strong>.
                </p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left text-xs flex flex-col gap-2">
                <div className="flex justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Booking ID:</span>
                  <span className="font-mono font-bold text-blue-600">{bookingDetails?.appointmentId?.slice(0, 16)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Hospital:</span>
                  <span className="font-bold text-slate-800">{bookingDetails?.hospitalName}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Consultation Mode:</span>
                  <span className="font-bold text-slate-800">{bookingDetails?.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consultation Fee:</span>
                  <span className="font-black text-emerald-600 text-sm">₹{bookingDetails?.fee}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard/patient');
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
                >
                  View in Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Consultation Type Selector */}
              <div>
                <label className="font-bold text-slate-800 block mb-2">Select Consultation Mode:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultationType('in_clinic')}
                    className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      consultationType === 'in_clinic'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/15'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>In-Clinic OPD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationType('video')}
                    className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      consultationType === 'video'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/15'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4 text-purple-600" />
                    <span>Video Consult</span>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">Select Date:</label>
                  {/* Real-time daily slots counter badge */}
                  <div className="flex items-center gap-1.5">
                    {checkingSlots ? (
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        <span>Checking limits...</span>
                      </span>
                    ) : slotStatus.isSameDoctorBooked ? (
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Doctor Booked Today</span>
                      </span>
                    ) : slotStatus.activeSlotsCount >= 2 ? (
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span>Daily Limit (2/2 Slots)</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Daily Slots: {slotStatus.activeSlotsCount}/2 Active ({slotStatus.remainingSlots} free)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDates.map(d => {
                    const isSelected = selectedDate === d.date;
                    const isDisabled = !d.hasSlots;

                    return (
                      <button
                        key={d.date}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) setSelectedDate(d.date);
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                            : isDisabled
                            ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs">
                          {d.label} {isDisabled && '(Passed)'}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {d.day}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Same Doctor Rule Explainer Banner */}
                {slotStatus.isSameDoctorBooked && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black text-amber-950 block">Specialist Already Booked for This Date</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        You already have an appointment scheduled with <strong>{doctor.name}</strong> on <strong>{selectedDate}</strong>. 
                        Under platform policy, you can book up to 2 appointments per day with <em>different specialists</em>. 
                        Please choose another date or consult another doctor.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2-Slot Daily Limit Rule Explainer Banner */}
                {slotStatus.activeSlotsCount >= 2 && !slotStatus.isSameDoctorBooked && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-red-50 border border-red-200/90 text-red-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black text-red-950 block">Daily Limit Reached (2/2 Active Slots Filled)</strong>
                      <p className="text-[11px] text-red-800 mt-0.5 leading-relaxed">
                        You currently hold 2 active appointment slots on <strong>{selectedDate}</strong>. 
                        Once an appointment is completed or cancelled, that slot becomes available immediately for another booking on this date.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Real-Time Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">Select Available Slot:</label>
                  <span className="text-[10.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {availableSlots.all.length} slots available
                  </span>
                </div>
                
                {availableSlots.all.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold text-center flex flex-col items-center gap-1">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>All appointment slots for this date have passed.</span>
                    <span className="text-[11px] text-amber-700 font-bold">Please select Tomorrow or an upcoming date above.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Morning */}
                    {availableSlots.morning.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Morning Slots</span>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.morning.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                selectedTime === slot
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon */}
                    {availableSlots.afternoon.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Afternoon Slots</span>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.afternoon.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                selectedTime === slot
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evening */}
                    {availableSlots.evening.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Evening Slots</span>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.evening.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                                selectedTime === slot
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Patient Note / Symptoms */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Reason for Visit / Symptoms (Optional):</label>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="E.g. Knee joint discomfort when climbing stairs for 3 weeks..."
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Fee & Booking CTA */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Total Payable:</span>
                  <span className="text-xl font-black text-slate-900">₹{consultationFee}</span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={loading || checkingSlots || !slotStatus.canBook || availableSlots.all.length === 0}
                  className={`px-6 py-3 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                    !slotStatus.canBook
                      ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : checkingSlots ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      <span>Checking Limits...</span>
                    </>
                  ) : slotStatus.isSameDoctorBooked ? (
                    <>
                      <span>Doctor Booked Today</span>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </>
                  ) : slotStatus.activeSlotsCount >= 2 ? (
                    <>
                      <span>Daily Limit Reached (2/2)</span>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </>
                  ) : (
                    <>
                      <span>Confirm Booking</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
