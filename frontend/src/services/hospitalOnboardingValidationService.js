/**
 * OpenHealth Hospital Onboarding Client-Side Validation Service
 * Enforces strict compliance for mandatory facility information & bed setup,
 * while allowing regulatory KYC to be optionally skippable.
 */

export class HospitalOnboardingValidationService {
  /**
   * Validate Step 1: Hospital Facility Profile (Mandatory & Non-Skippable)
   */
  static validateFacilityProfile(profile = {}) {
    const errors = {};

    // Hospital Facility Name
    if (!profile.name || typeof profile.name !== 'string' || profile.name.trim().length < 3) {
      errors.name = 'Hospital legal name must be at least 3 characters.';
    }

    // Facility Type
    if (!profile.type || profile.type.trim().length === 0) {
      errors.type = 'Please select a facility category.';
    } else if (profile.type === '__custom__' && (!profile.customType || profile.customType.trim().length < 3)) {
      errors.customType = 'Please specify your custom facility type.';
    }

    // Official Phone Number (Must be 10 digits)
    const cleanPhone = (profile.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Valid 10-digit contact phone number is required.';
    }

    // Official Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email || !emailRegex.test(profile.email.trim())) {
      errors.email = 'Valid administrative email address is required.';
    }

    // Street Address
    if (!profile.address || profile.address.trim().length < 5) {
      errors.address = 'Street address must be at least 5 characters.';
    }

    // State & City
    if (!profile.state || profile.state.trim().length === 0) {
      errors.state = 'State / Union Territory is required.';
    }
    if (!profile.city || profile.city.trim().length === 0) {
      errors.city = 'City / District is required.';
    }

    // Postal PIN Code (6 digits in India)
    const cleanPin = (profile.postal_code || '').replace(/\D/g, '');
    if (cleanPin && cleanPin.length !== 6) {
      errors.postal_code = 'Postal PIN code must be a 6-digit numeric code.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate Step 2: Bed Inventory & Clinical Setup (Mandatory & Non-Skippable)
   */
  static validateBedInventory({ generalBeds, icuBeds, customBeds = [], departments = [] }) {
    const errors = {};

    const genCount = parseInt(generalBeds?.total, 10);
    const genRate = parseFloat(generalBeds?.price);
    if (isNaN(genCount) || genCount < 0) {
      errors.generalBedsCount = 'General ward bed capacity must be a valid number (0 or more).';
    }
    if (isNaN(genRate) || genRate < 0) {
      errors.generalBedsPrice = 'General ward daily tariff must be a valid non-negative amount.';
    }

    const icuCount = parseInt(icuBeds?.total, 10);
    const icuRate = parseFloat(icuBeds?.price);
    if (isNaN(icuCount) || icuCount < 0) {
      errors.icuBedsCount = 'ICU bed capacity must be a valid number (0 or more).';
    }
    if (isNaN(icuRate) || icuRate < 0) {
      errors.icuBedsPrice = 'ICU daily tariff must be a valid non-negative amount.';
    }

    // Validate each dynamically added custom bed type
    customBeds.forEach((b, idx) => {
      if (!b.name || b.name.trim().length < 2) {
        errors[`customBed_${idx}_name`] = `Bed category #${idx + 1} name is required.`;
      }
      const bCount = parseInt(b.total, 10);
      if (isNaN(bCount) || bCount <= 0) {
        errors[`customBed_${idx}_total`] = `Bed category #${idx + 1} capacity must be at least 1.`;
      }
      const bPrice = parseFloat(b.price);
      if (isNaN(bPrice) || bPrice < 0) {
        errors[`customBed_${idx}_price`] = `Bed category #${idx + 1} tariff cannot be negative.`;
      }
    });

    // Hospital must configure at least 1 total bed across all categories
    const customTotal = customBeds.reduce((acc, b) => acc + (parseInt(b.total, 10) || 0), 0);
    const overallTotal = (isNaN(genCount) ? 0 : genCount) + (isNaN(icuCount) ? 0 : icuCount) + customTotal;

    if (overallTotal <= 0) {
      errors.overallTotal = 'Hospital must register at least 1 bed across your ward categories.';
    }

    // Departments check (at least 1 department selected)
    if (!Array.isArray(departments) || departments.length === 0) {
      errors.departments = 'Select at least 1 clinical department to initialize your facility services.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      overallTotal
    };
  }

  /**
   * Validate Step 3: Accreditation & Regulatory KYC (Skippable)
   */
  static validateKyc(kyc = {}, isSkipped = false) {
    // If skipped by user, it's 100% valid!
    if (isSkipped) {
      return { isValid: true, errors: {} };
    }

    const errors = {};

    if (!kyc.license_number || kyc.license_number.trim().length < 3) {
      errors.license_number = 'Clinical Establishment / Health Authority license number is required for verification.';
    }

    if (!kyc.signatory_name || kyc.signatory_name.trim().length < 3) {
      errors.signatory_name = 'Authorized Medical Superintendent / Signatory full name is required.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Complete All-Step Validation Service
   */
  static validateAll({ profile, bedSetup, kyc, isKycSkipped = false }) {
    const profileVal = this.validateFacilityProfile(profile);
    const bedVal = this.validateBedInventory(bedSetup);
    const kycVal = this.validateKyc(kyc, isKycSkipped);

    const allErrors = {
      ...profileVal.errors,
      ...bedVal.errors,
      ...kycVal.errors
    };

    return {
      isValid: profileVal.isValid && bedVal.isValid && kycVal.isValid,
      errors: allErrors,
      details: {
        profileValid: profileVal.isValid,
        bedSetupValid: bedVal.isValid,
        kycValid: kycVal.isValid
      }
    };
  }
}

export default HospitalOnboardingValidationService;
