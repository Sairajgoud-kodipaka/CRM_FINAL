// ================================
// JEWELRY CRM GEO DATA 2025
// ================================

// City to State mapping (focused on priority jewelry cities)
export const CITY_STATE_MAP: Record<string, string> = {
    // Telangana
    'Hyderabad': 'Telangana',
    // Gujarat
    'Ahmedabad': 'Gujarat',
    // Maharashtra
    'Mumbai': 'Maharashtra',
  };

// City to Catchment Area mapping for contextual filtering
export const CITY_CATCHMENT_MAP: Record<string, string[]> = {
    'Hyderabad': [
        'Abids',
        'Banjara Hills',
        'Jubilee Hills',
        'Himayat Nagar',
        'Punjagutta',
        'Somajiguda',
        'Hitech City',
        'Kondapur',
        'Kukatpally',
        'Secunderabad',
        'Charminar',
        'Begumpet',
        'Dilsukhnagar',
        'Ameerpet',
        'Mehdipatnam',
    ],
    'Ahmedabad': [
        'Manek Chowk',
        'CG Road',
        'Ellisbridge',
        'Satellite',
        'Shivranjani Cross Roads',
        'Vastrapur',
        'Ambawadi',
        'Prahlad Nagar',
        'Bodakdev',
        'Paldi',
        'Naranpura',
        'Thaltej',
        'Vasna',
        'Ghatlodia',
        'Vastral',
    ],
    'Mumbai': [
        'Zaveri Bazaar',
        'Borivali West',
        'Bandra West',
        'Khar',
        'Malad',
        'Andheri West',
        'Dadar',
        'Thane West',
        'Ghatkopar',
        'Vashi',
        'Lower Parel',
        'Santacruz',
        'Chembur',
        'Ghatkopar East',
        'Fort',
    ],
};
  
  // Catchment Area to Pincode mapping (15 popular catchments per city)
  export const CATCHMENT_PINCODE_MAP: Record<string, string> = {
    // Hyderabad Areas
    'Abids': '500001',
    'Banjara Hills': '500034',
    'Jubilee Hills': '500033',
    'Himayat Nagar': '500029',
    'Punjagutta': '500082',
    'Somajiguda': '500082',
    'Hitech City': '500081',
    'Kondapur': '500084',
    'Kukatpally': '500072',
    'Secunderabad': '500003',
    'Charminar': '500002',
    'Begumpet': '500016',
    'Dilsukhnagar': '500060',
    'Ameerpet': '500038',
    'Mehdipatnam': '500028',
  
    // Ahmedabad Areas
    'Manek Chowk': '380001',
    'CG Road': '380009',
    'Ellisbridge': '380006',
    'Satellite': '380015',
    'Shivranjani Cross Roads': '380015',
    'Vastrapur': '380015',
    'Ambawadi': '380006',
    'Prahlad Nagar': '380015',
    'Bodakdev': '380054',
    'Paldi': '380007',
    'Naranpura': '380013',
    'Thaltej': '380059',
    'Vasna': '380007',
    'Ghatlodia': '380061',
    'Vastral': '382418',
  
    // Mumbai Areas
    'Zaveri Bazaar': '400003',
    'Borivali West': '400092',
    'Bandra West': '400050',
    'Khar': '400052',
    'Malad': '400064',
    'Andheri West': '400058',
    'Dadar': '400028',
    'Thane West': '400601',
    'Ghatkopar': '400086',
    'Vashi': '400703',
    'Lower Parel': '400013',
    'Santacruz': '400055',
    'Chembur': '400071',
    'Ghatkopar East': '400077',
    'Fort': '400001',
  };

// Helper function to get catchment areas for a specific city
export const getCatchmentAreasForCity = (city: string): string[] => {
    return CITY_CATCHMENT_MAP[city] || [];
};

// Helper function to get state from city
export const getStateFromCity = (city: string): string | null => {
    return CITY_STATE_MAP[city] || null;
};

// Helper function to get pincode from catchment area
export const getPincodeFromCatchment = (catchmentArea: string): string | null => {
    return CATCHMENT_PINCODE_MAP[catchmentArea] || null;
};

// Helper function to lock/unlock fields
export const lockField = (fieldName: string, lockedFields: Set<string>): Set<string> => {
    const newLockedFields = new Set(lockedFields);
    newLockedFields.add(fieldName);
    return newLockedFields;
};

export const unlockField = (fieldName: string, lockedFields: Set<string>): Set<string> => {
    const newLockedFields = new Set(lockedFields);
    newLockedFields.delete(fieldName);
    return newLockedFields;
};

export const isFieldLocked = (fieldName: string, lockedFields: Set<string>): boolean => {
    return lockedFields.has(fieldName);
};
  
  // Dropdown Options
  export const INDIAN_CITIES = Object.keys(CITY_STATE_MAP).sort();
  export const INDIAN_STATES = Array.from(new Set(Object.values(CITY_STATE_MAP))).sort();
  export const INDIAN_CATCHMENT_AREAS = Object.keys(CATCHMENT_PINCODE_MAP).sort();
  
  export const REASONS_FOR_VISIT = [
    'Wedding Jewellery',
    'Engagement',
    'Gifting',
    'Self Purchase',
    'Repair',
    'Valuation',
    'Exchange',
    'Investment',
    'Inquiry',
    'Other',
  ] as const;
  
  export const CUSTOMER_STATUSES = [
    'VVIP',
    'VIP',
    'GENERAL',
  ] as const;
  
  export const LEAD_SOURCES = [
    'General Walk-in',
    'Referral',
    'Social Media',
    'Newspaper',
    'Hoarding',
    'Website',
    'Exhibition',
    'Television',
    'Radio',
    'Magazine',
    'Cold Call',
    'Email Campaign',
    'SMS Campaign',
    'Other',
  ] as const;
  
  export const SAVING_SCHEMES = [
    'Inactive',
    'Active',
    'Pending',
  ] as const;
  
  export const CUSTOMER_INTERESTS = [
    'Gold',
    'Diamond Studded',
    'Uncut Diamond',
    'Silver',
    'Gold Coin',
    'Silver Coin',
    'Platinum',
    'Pearl',
    'Ruby',
    'Emerald',
    'Sapphire',
    'Other Gemstones',
  ] as const;
  
  export const PRODUCT_TYPES = [
    'Necklace',
    'Ring',
    'Bangle',
    'Bracelet',
    'Pendant',
    'Earrings',
    'Chain',
    'Mangalsutra',
    'Nose Ring',
    'Toe Ring',
    'Anklet',
    'Waist Chain',
    'Hair Accessories',
    'Other',
  ] as const;
  
  export const STYLES = [
    'Traditional',
    'Contemporary',
    'Antique',
    'Minimalist',
    'Modern',
    'Fusion',
    'Vintage',
    'Art Deco',
    'Victorian',
    'Other',
  ] as const;
  
  export const WEIGHT_RANGES = [
    '<5g',
    '5–10g',
    '10–20g',
    '20–50g',
    '>50g',
  ] as const;
  
  // High Priority Constants - Pipeline & Purchase Management
  export const PIPELINE_STAGES = [
    'exhibition',
    'social_media', 
    'interested',
    'store_walkin',
    'negotiation',
    'purchased',
    'closed_lost',
    'future_prospect',
    'not_qualified',
  ] as const;
  
  export const BUDGET_RANGES = [
    '0-50000',
    '50000-100000',
    '100000-250000',
    '250000-500000',
    '500000-1000000',
    '1000000+',
  ] as const;
  
  export const APPOINTMENT_TYPES = [
    'In-Person',
    'Virtual Consultation',
    'Phone Call',
    'WhatsApp',
    'Store Visit',
    'Home Visit',
    'Exhibition Meeting',
  ] as const;
  
  // Customer Classification
  export const CUSTOMER_TYPES = [
    'individual',
    'corporate',
    'wholesale',
  ] as const;
  
  export const DEFAULT_SALES_PERSONS = [
    'Sales Person 1',
    'Sales Person 2',
    'Sales Person 3',
  ] as const;

  // Age ranges for end user
  export const AGE_RANGES = [
    '18-25',
    '25-35', 
    '35-45',
    '45-60',
    '60+',
  ] as const;

  // Product subtypes for detailed categorization
  export const PRODUCT_SUBTYPES = [
    'DI.RING',
    'DI.EARRINGS', 
    'DI.NECKLACE',
    'DI.BRACELET',
    'DI.BANGLE',
    'G.AD.RING',
    'G.AD.EARRINGS',
    'G.AD.NECKLACE',
    'G.AD.BRACELET',
    'G.AD.BANGLE',
    'G.PLAIN.RING',
    'G.PLAIN.EARRINGS',
    'G.PLAIN.NECKLACE',
    'G.PLAIN.BRACELET',
    'G.PLAIN.BANGLE',
    'J.SET',
    'POLKI.RING',
    'POLKI.EARRINGS',
    'POLKI.NECKLACE',
    'POLKI.BRACELET',
    'POLKI.BANGLE',
    'JADTAR.RING',
    'JADTAR.EARRINGS',
    'JADTAR.NECKLACE',
    'JADTAR.BRACELET',
    'JADTAR.BANGLE',
    'OTHER',
  ] as const;

  // Gold price ranges
  export const GOLD_RANGES = [
    '100K-500K',
    '500K-1000K',
    '1000K-1500K',
    '1500K-2000K',
    '2000K-2400K',
    '2400K+',
  ] as const;

  // Diamond price ranges
  export const DIAMOND_RANGES = [
    '0-50K',
    '50K-100K',
    '100K-150K',
    '150K-200K',
    '200K-250K',
    '250K+',
  ] as const;

  // Material types for jewelry
  export const MATERIAL_TYPES = [
    'GOLD JEWELLERY',
    'DIAMOND JEWELLERY', 
    'UNCUT JEWELLERY',
    'PLATINUM JEWELLERY',
    'SILVER JEWELLERY',
    'GEMSTONE JEWELLERY',
    'PEARL JEWELLERY',
    'OTHER',
  ] as const;
  