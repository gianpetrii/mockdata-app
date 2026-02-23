import { ColumnInfo } from './types';

export type PIIType = 
  // Personal Identifiers
  | 'email'
  | 'phone'
  | 'name'
  | 'address'
  | 'ssn'
  | 'passport'
  | 'driver_license'
  | 'date_of_birth'
  | 'ip_address'
  | 'username'
  | 'password'
  
  // Financial
  | 'credit_card'
  | 'bank_account'
  | 'iban'
  | 'swift_code'
  | 'routing_number'
  | 'salary'
  | 'income'
  | 'tax_id'
  | 'vat_number'
  
  // Medical/Health
  | 'medical_record'
  | 'diagnosis'
  | 'prescription'
  | 'blood_type'
  | 'insurance_number'
  | 'patient_id'
  
  // Biometric
  | 'fingerprint'
  | 'face_id'
  | 'biometric_data'
  
  // Location
  | 'gps_coordinates'
  | 'geolocation'
  | 'latitude'
  | 'longitude'
  
  // Digital Identity
  | 'device_id'
  | 'mac_address'
  | 'session_token'
  | 'api_key'
  | 'oauth_token'
  
  // Sensitive Personal
  | 'race'
  | 'ethnicity'
  | 'religion'
  | 'political_affiliation'
  | 'sexual_orientation'
  | 'gender_identity'
  | 'criminal_record'
  
  // Other Sensitive
  | 'signature'
  | 'photo'
  | 'video'
  | 'voice_recording'
  
  | 'none';

export type DataClassification = 
  | 'direct_identifier'    // Can directly identify a person
  | 'indirect_identifier'  // Can identify when combined with other data
  | 'sensitive_data'       // Sensitive but not identifying
  | 'non_sensitive';

export interface PIIDetectionResult {
  columnName: string;
  detectedType: PIIType;
  classification: DataClassification;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export class EnhancedPIIDetector {
  private static readonly COLUMN_NAME_PATTERNS: Record<PIIType, RegExp[]> = {
    // Personal Identifiers
    email: [/^email$/i, /^e_?mail$/i, /^user_?email$/i, /_email$/i, /^contact_?email$/i],
    phone: [/^phone$/i, /^telephone$/i, /^mobile$/i, /_phone$/i, /^cell$/i, /^contact_?number$/i],
    name: [/^name$/i, /^full_?name$/i, /^first_?name$/i, /^last_?name$/i, /^given_?name$/i, /^surname$/i, /^middle_?name$/i],
    address: [/^address$/i, /^street$/i, /^city$/i, /_address$/i, /^postal_?address$/i, /^home_?address$/i],
    ssn: [/^ssn$/i, /^social_?security$/i, /^dni$/i, /^cuit$/i, /^cuil$/i, /^nif$/i, /^nie$/i],
    passport: [/^passport$/i, /^passport_?number$/i, /^passport_?id$/i],
    driver_license: [/^driver_?license$/i, /^license_?number$/i, /^dl_?number$/i],
    date_of_birth: [/^dob$/i, /^birth_?date$/i, /^date_?of_?birth$/i, /^birthday$/i],
    ip_address: [/^ip$/i, /^ip_?address$/i, /^ip_?addr$/i],
    username: [/^username$/i, /^user_?name$/i, /^login$/i, /^login_?name$/i],
    password: [/^password$/i, /^passwd$/i, /^pwd$/i, /^pass$/i, /_password$/i, /^encrypted_?password$/i, /^password_?hash$/i],
    
    // Financial
    credit_card: [/^card_?number$/i, /^credit_?card$/i, /^cc_?number$/i, /^card_?no$/i, /^pan$/i],
    bank_account: [/^account_?number$/i, /^bank_?account$/i, /^account_?no$/i],
    iban: [/^iban$/i, /^iban_?number$/i],
    swift_code: [/^swift$/i, /^swift_?code$/i, /^bic$/i],
    routing_number: [/^routing$/i, /^routing_?number$/i, /^aba$/i],
    salary: [/^salary$/i, /^wage$/i, /^compensation$/i, /^annual_?salary$/i],
    income: [/^income$/i, /^annual_?income$/i, /^monthly_?income$/i],
    tax_id: [/^tax_?id$/i, /^tin$/i, /^ein$/i, /^rfc$/i],
    vat_number: [/^vat$/i, /^vat_?number$/i, /^vat_?id$/i],
    
    // Medical/Health
    medical_record: [/^medical_?record$/i, /^mrn$/i, /^patient_?record$/i, /^health_?record$/i],
    diagnosis: [/^diagnosis$/i, /^medical_?diagnosis$/i, /^condition$/i, /^disease$/i],
    prescription: [/^prescription$/i, /^medication$/i, /^drug$/i, /^medicine$/i],
    blood_type: [/^blood_?type$/i, /^blood_?group$/i],
    insurance_number: [/^insurance$/i, /^insurance_?number$/i, /^policy_?number$/i, /^health_?insurance$/i],
    patient_id: [/^patient_?id$/i, /^patient_?number$/i],
    
    // Biometric
    fingerprint: [/^fingerprint$/i, /^finger_?print$/i, /^biometric_?finger$/i],
    face_id: [/^face_?id$/i, /^facial_?recognition$/i],
    biometric_data: [/^biometric$/i, /^biometric_?data$/i, /^bio_?data$/i],
    
    // Location
    gps_coordinates: [/^gps$/i, /^coordinates$/i, /^gps_?coordinates$/i, /^location$/i],
    geolocation: [/^geolocation$/i, /^geo_?location$/i, /^geo$/i],
    latitude: [/^lat$/i, /^latitude$/i],
    longitude: [/^lon$/i, /^lng$/i, /^longitude$/i],
    
    // Digital Identity
    device_id: [/^device_?id$/i, /^device_?identifier$/i, /^udid$/i],
    mac_address: [/^mac$/i, /^mac_?address$/i, /^mac_?addr$/i],
    session_token: [/^session$/i, /^session_?token$/i, /^session_?id$/i],
    api_key: [/^api_?key$/i, /^secret_?key$/i, /^access_?key$/i],
    oauth_token: [/^oauth$/i, /^oauth_?token$/i, /^access_?token$/i, /^refresh_?token$/i],
    
    // Sensitive Personal
    race: [/^race$/i, /^ethnicity$/i, /^ethnic_?group$/i],
    ethnicity: [/^ethnicity$/i, /^ethnic_?origin$/i],
    religion: [/^religion$/i, /^religious_?affiliation$/i, /^faith$/i],
    political_affiliation: [/^political$/i, /^political_?party$/i, /^political_?affiliation$/i],
    sexual_orientation: [/^sexual_?orientation$/i, /^orientation$/i],
    gender_identity: [/^gender_?identity$/i, /^gender$/i, /^sex$/i],
    criminal_record: [/^criminal$/i, /^criminal_?record$/i, /^conviction$/i, /^arrest$/i],
    
    // Other Sensitive
    signature: [/^signature$/i, /^digital_?signature$/i, /^sign$/i],
    photo: [/^photo$/i, /^picture$/i, /^image$/i, /^avatar$/i, /^profile_?picture$/i],
    video: [/^video$/i, /^video_?file$/i, /^recording$/i],
    voice_recording: [/^voice$/i, /^audio$/i, /^voice_?recording$/i, /^audio_?file$/i],
    
    none: [],
  };

  /**
   * Detect PII in columns using regex patterns + optional LLM fallback
   */
  static async detectPII(
    columns: ColumnInfo[],
    useLLMFallback: boolean = false,
    apiKey?: string
  ): Promise<PIIDetectionResult[]> {
    const results: PIIDetectionResult[] = [];

    for (const column of columns) {
      const regexResult = this.detectColumnPIIWithRegex(column);
      
      if (regexResult.confidence === 'high' || !useLLMFallback) {
        results.push(regexResult);
      } else {
        // Use LLM for ambiguous cases
        try {
          const llmResult = await this.detectColumnPIIWithLLM(column, apiKey!);
          results.push(llmResult);
        } catch (error) {
          results.push(regexResult);
        }
      }
    }

    return results;
  }

  /**
   * Synchronous detection using regex patterns (fast)
   */
  static detectPIISync(columns: ColumnInfo[]): PIIDetectionResult[] {
    return columns.map(column => this.detectColumnPIIWithRegex(column));
  }

  private static detectColumnPIIWithRegex(column: ColumnInfo): PIIDetectionResult {
    const lowerName = column.name.toLowerCase();
    const lowerComment = column.comment?.toLowerCase() || '';

    // Check patterns
    for (const [piiType, patterns] of Object.entries(this.COLUMN_NAME_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(column.name)) {
          const classification = this.classifyData(piiType as PIIType);
          return {
            columnName: column.name,
            detectedType: piiType as PIIType,
            classification,
            confidence: 'high',
            reason: `Column name matches ${piiType} pattern`,
          };
        }
      }
    }

    // Check comment for hints
    if (lowerComment) {
      if (lowerComment.includes('personal') || lowerComment.includes('sensitive')) {
        return {
          columnName: column.name,
          detectedType: 'none',
          classification: 'sensitive_data',
          confidence: 'medium',
          reason: 'Comment suggests sensitive data',
        };
      }
    }

    // Check for common sensitive patterns in name
    const sensitiveKeywords = [
      'secret', 'private', 'confidential', 'sensitive', 
      'personal', 'protected', 'restricted'
    ];
    
    if (sensitiveKeywords.some(kw => lowerName.includes(kw))) {
      return {
        columnName: column.name,
        detectedType: 'none',
        classification: 'sensitive_data',
        confidence: 'medium',
        reason: 'Column name suggests sensitive data',
      };
    }

    return {
      columnName: column.name,
      detectedType: 'none',
      classification: 'non_sensitive',
      confidence: 'high',
      reason: 'No PII patterns detected',
    };
  }

  private static async detectColumnPIIWithLLM(
    column: ColumnInfo,
    apiKey: string
  ): Promise<PIIDetectionResult> {
    const prompt = `Analyze this database column and determine if it contains PII or sensitive data:

Column Name: ${column.name}
Data Type: ${column.type}
Comment: ${column.comment || 'none'}
Nullable: ${column.nullable}

Classify this column as one of these PII types:
${Object.keys(this.COLUMN_NAME_PATTERNS).filter(k => k !== 'none').join(', ')}

Or 'none' if it's not PII.

Also provide:
- classification: direct_identifier, indirect_identifier, sensitive_data, or non_sensitive
- confidence: high, medium, or low
- reason: brief explanation

Output ONLY valid JSON:
{
  "detectedType": "email",
  "classification": "direct_identifier",
  "confidence": "high",
  "reason": "Column stores email addresses"
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'MockData App',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('LLM API failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No LLM response');
    }

    const result = JSON.parse(content);

    return {
      columnName: column.name,
      detectedType: result.detectedType || 'none',
      classification: result.classification || 'non_sensitive',
      confidence: result.confidence || 'medium',
      reason: result.reason || 'Detected by LLM analysis',
    };
  }

  private static classifyData(piiType: PIIType): DataClassification {
    // Direct identifiers - can identify a person directly
    const directIdentifiers: PIIType[] = [
      'email', 'phone', 'name', 'ssn', 'passport', 'driver_license',
      'credit_card', 'bank_account', 'iban', 'tax_id',
      'medical_record', 'patient_id', 'insurance_number',
      'username', 'device_id', 'mac_address'
    ];
    
    // Indirect identifiers - can identify when combined
    const indirectIdentifiers: PIIType[] = [
      'date_of_birth', 'address', 'ip_address', 'gps_coordinates',
      'geolocation', 'latitude', 'longitude', 'blood_type'
    ];
    
    // Sensitive data - sensitive but not identifying alone
    const sensitiveData: PIIType[] = [
      'salary', 'income', 'diagnosis', 'prescription',
      'race', 'ethnicity', 'religion', 'political_affiliation',
      'sexual_orientation', 'gender_identity', 'criminal_record',
      'fingerprint', 'face_id', 'biometric_data',
      'signature', 'photo', 'video', 'voice_recording',
      'password', 'session_token', 'api_key', 'oauth_token',
      'swift_code', 'routing_number', 'vat_number'
    ];
    
    if (directIdentifiers.includes(piiType)) {
      return 'direct_identifier';
    }
    if (indirectIdentifiers.includes(piiType)) {
      return 'indirect_identifier';
    }
    if (sensitiveData.includes(piiType)) {
      return 'sensitive_data';
    }
    return 'non_sensitive';
  }

  /**
   * Get human-readable description of PII type
   */
  static getTypeDescription(piiType: PIIType): string {
    const descriptions: Record<PIIType, string> = {
      // Personal
      email: 'Email address',
      phone: 'Phone number',
      name: 'Personal name',
      address: 'Physical address',
      ssn: 'Social Security Number / National ID',
      passport: 'Passport number',
      driver_license: 'Driver license number',
      date_of_birth: 'Date of birth',
      ip_address: 'IP address',
      username: 'Username',
      password: 'Password/credentials',
      
      // Financial
      credit_card: 'Credit card number',
      bank_account: 'Bank account number',
      iban: 'IBAN',
      swift_code: 'SWIFT/BIC code',
      routing_number: 'Bank routing number',
      salary: 'Salary information',
      income: 'Income data',
      tax_id: 'Tax ID',
      vat_number: 'VAT number',
      
      // Medical
      medical_record: 'Medical record',
      diagnosis: 'Medical diagnosis',
      prescription: 'Prescription data',
      blood_type: 'Blood type',
      insurance_number: 'Insurance number',
      patient_id: 'Patient identifier',
      
      // Biometric
      fingerprint: 'Fingerprint data',
      face_id: 'Facial recognition data',
      biometric_data: 'Biometric information',
      
      // Location
      gps_coordinates: 'GPS coordinates',
      geolocation: 'Geolocation data',
      latitude: 'Latitude',
      longitude: 'Longitude',
      
      // Digital
      device_id: 'Device identifier',
      mac_address: 'MAC address',
      session_token: 'Session token',
      api_key: 'API key',
      oauth_token: 'OAuth token',
      
      // Sensitive Personal
      race: 'Race/ethnicity',
      ethnicity: 'Ethnicity',
      religion: 'Religious affiliation',
      political_affiliation: 'Political affiliation',
      sexual_orientation: 'Sexual orientation',
      gender_identity: 'Gender identity',
      criminal_record: 'Criminal record',
      
      // Other
      signature: 'Digital signature',
      photo: 'Photo/image',
      video: 'Video recording',
      voice_recording: 'Voice recording',
      
      none: 'No PII detected',
    };

    return descriptions[piiType] || piiType;
  }

  /**
   * Get recommended anonymization strategy for PII type
   */
  static getAnonymizationStrategy(piiType: PIIType): string[] {
    const strategies: Record<PIIType, string[]> = {
      // Personal - Replace with fake
      email: ['mask', 'tokenize', 'fake'],
      phone: ['mask', 'tokenize', 'fake'],
      name: ['tokenize', 'fake', 'pseudonymize'],
      address: ['generalize', 'fake', 'remove'],
      ssn: ['mask', 'tokenize', 'remove'],
      passport: ['mask', 'tokenize', 'remove'],
      driver_license: ['mask', 'tokenize', 'remove'],
      date_of_birth: ['generalize_year', 'age_range', 'remove'],
      ip_address: ['mask', 'anonymize', 'remove'],
      username: ['tokenize', 'fake'],
      password: ['remove', 'hash'],
      
      // Financial - High security
      credit_card: ['tokenize', 'mask', 'remove'],
      bank_account: ['tokenize', 'mask', 'remove'],
      iban: ['mask', 'remove'],
      swift_code: ['mask', 'remove'],
      routing_number: ['mask', 'remove'],
      salary: ['range', 'noise', 'remove'],
      income: ['range', 'noise', 'remove'],
      tax_id: ['mask', 'tokenize', 'remove'],
      vat_number: ['mask', 'remove'],
      
      // Medical - HIPAA compliance
      medical_record: ['tokenize', 'remove'],
      diagnosis: ['generalize', 'remove'],
      prescription: ['generalize', 'remove'],
      blood_type: ['keep', 'remove'],
      insurance_number: ['tokenize', 'mask', 'remove'],
      patient_id: ['tokenize', 'remove'],
      
      // Biometric - Remove only
      fingerprint: ['remove'],
      face_id: ['remove'],
      biometric_data: ['remove'],
      
      // Location - Generalize
      gps_coordinates: ['generalize', 'noise', 'remove'],
      geolocation: ['generalize', 'remove'],
      latitude: ['noise', 'generalize', 'remove'],
      longitude: ['noise', 'generalize', 'remove'],
      
      // Digital - Tokenize
      device_id: ['tokenize', 'hash', 'remove'],
      mac_address: ['mask', 'remove'],
      session_token: ['remove'],
      api_key: ['remove'],
      oauth_token: ['remove'],
      
      // Sensitive Personal - Remove or generalize
      race: ['remove', 'generalize'],
      ethnicity: ['remove', 'generalize'],
      religion: ['remove', 'generalize'],
      political_affiliation: ['remove'],
      sexual_orientation: ['remove'],
      gender_identity: ['generalize', 'remove'],
      criminal_record: ['remove'],
      
      // Other
      signature: ['remove'],
      photo: ['remove', 'placeholder'],
      video: ['remove'],
      voice_recording: ['remove'],
      
      none: ['keep'],
    };

    return strategies[piiType] || ['keep'];
  }
}
