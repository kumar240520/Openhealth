/**
 * Responsive Keyword Search & Specialty Filter Matcher
 * 
 * Provides flexible tokenization, stem matching, and clinical synonym expansion
 * so that search queries and AI specialty filters return relevant hospitals
 * and doctors if ANY keyword or related clinical term matches.
 */

const STOP_WORDS = new Set([
  'in', 'at', 'near', 'for', 'of', 'and', 'the', 'a', 'an', 'to', 'with', 'from',
  'best', 'top', 'good', 'find', 'search', 'hospital', 'hospitals', 'doctor', 
  'doctors', 'clinic', 'clinics', 'center', 'centre', 'care', 'department', 
  'specialist', 'specialists', 'consultant', 'consultation', 'service', 'services'
]);

/**
 * Splits text into meaningful search keywords.
 */
export function extractSearchTokens(input) {
  if (!input) return [];
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !STOP_WORDS.has(t));
}

/**
 * Returns true if ANY keyword token matches any of the target strings.
 * Supports bidirectional matching, prefix/stem matching, and clinical synonyms.
 */
export function matchesAnyKeyword(sourceTokens, targetStrings) {
  if (!sourceTokens || sourceTokens.length === 0) return true;
  
  const targets = (Array.isArray(targetStrings) ? targetStrings : [targetStrings])
    .filter(Boolean)
    .map(t => String(t).toLowerCase());

  if (targets.length === 0) return false;

  return sourceTokens.some(token => {
    // 5-character stem (e.g., 'orthoped' matches 'orthopedic', 'orthopedics', 'orthopaedics')
    const stem = token.length > 5 ? token.slice(0, 5) : token;
    
    return targets.some(target => {
      // 1. Direct inclusion in either direction
      if (target.includes(token) || token.includes(target)) return true;
      
      // 2. Stem/prefix match
      if (target.includes(stem)) return true;
      
      // 3. Clinical Synonyms & Cross-specialty Aliases
      if ((token.includes('ortho') || token.includes('knee') || token.includes('bone') || token.includes('joint') || token.includes('arthro') || token.includes('fracture')) && 
          (target.includes('ortho') || target.includes('joint') || target.includes('bone') || target.includes('spine') || target.includes('knee'))) {
        return true;
      }

      if ((token.includes('cardio') || token.includes('heart') || token.includes('chest') || token.includes('angina') || token.includes('ecg')) && 
          (target.includes('cardio') || target.includes('heart') || target.includes('cardiac'))) {
        return true;
      }

      if ((token.includes('neuro') || token.includes('brain') || token.includes('stroke') || token.includes('nerve')) && 
          (target.includes('neuro') || target.includes('brain') || target.includes('spine'))) {
        return true;
      }

      if ((token.includes('onco') || token.includes('cancer') || token.includes('tumor')) && 
          (target.includes('onco') || target.includes('cancer'))) {
        return true;
      }

      if ((token.includes('pedia') || token.includes('child') || token.includes('baby') || token.includes('infant')) && 
          (target.includes('pedia') || target.includes('child') || target.includes('neonat'))) {
        return true;
      }

      if ((token.includes('gastro') || token.includes('stomach') || token.includes('digest') || token.includes('liver')) && 
          (target.includes('gastro') || target.includes('digest') || target.includes('hepato'))) {
        return true;
      }

      if ((token.includes('pulmo') || token.includes('lung') || token.includes('breath') || token.includes('respir') || token.includes('asthma')) && 
          (target.includes('pulmo') || target.includes('chest') || target.includes('respir'))) {
        return true;
      }

      if ((token.includes('nephro') || token.includes('kidney') || token.includes('renal') || token.includes('dialysis')) && 
          (target.includes('nephro') || target.includes('kidney') || target.includes('renal'))) {
        return true;
      }

      if ((token.includes('sugar') || token.includes('diabet') || token.includes('endocrin') || token.includes('thyroid')) && 
          (target.includes('diabet') || target.includes('endocrin') || target.includes('sugar'))) {
        return true;
      }

      if ((token.includes('physio') || token.includes('rehab') || token.includes('therapy')) && 
          (target.includes('physio') || target.includes('rehab') || target.includes('therapy') || target.includes('ortho'))) {
        return true;
      }

      return false;
    });
  });
}
