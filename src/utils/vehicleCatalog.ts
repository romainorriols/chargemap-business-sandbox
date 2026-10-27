// Fake brand → model → version catalog for the "Changer de véhicule" modal.
// Brands follow the Figma list (choix-modele-1-constructeur); Renault matches
// choix-modele-3 exactly (model names drop the brand so the listing doesn't
// read "Renault Renault 4 E-Tech"), the rest is plausible demo data.
export type VehicleCatalog = Record<string, Record<string, string[]>>

export const VEHICLE_CATALOG: VehicleCatalog = {
  'Abarth': {
    '500e': ['155ch Turismo', 'Scorpionissima'],
    '600e': ['240ch Turismo', '280ch Scorpionissima'],
  },
  'Alfa Romeo': {
    'Junior Elettrica': ['156ch', 'Veloce 280ch'],
  },
  'Alpine': {
    'A290': ['GT', 'GTS'],
  },
  'Audi': {
    'Q4 e-tron': ['40 204ch', '45 quattro 286ch'],
    'Q6 e-tron': ['quattro 387ch', 'SQ6 517ch'],
  },
  'BMW': {
    'i4': ['eDrive35', 'eDrive40', 'M50'],
    'iX1': ['eDrive20', 'xDrive30'],
  },
  'BYD': {
    'Atto 3': ['Comfort', 'Design'],
    'Seal': ['Design RWD', 'Design AWD'],
  },
  'Citroën': {
    'ë-C3': ['YOU', 'MAX'],
    'ë-C4': ['136ch Feel', '156ch Shine'],
  },
  'Hyundai': {
    'Ioniq 5': ['58 kWh', '77 kWh'],
    'Kona Electric': ['48 kWh', '65 kWh'],
  },
  'Kia': {
    'EV3': ['Air', 'GT-Line'],
    'EV6': ['Air', 'GT-Line', 'GT'],
  },
  'Peugeot': {
    'e-208': ['GT 136ch', 'GT 156ch'],
    'e-3008': ['Allure 210ch', 'GT 230ch'],
  },
  'Renault': {
    'Megane E-Tech': ['EV40 130ch Urban Range', 'EV60 220ch Optimum Charge', 'EV60 220ch Supercharge'],
    '4 E-Tech': ['Comfort Range', 'Comfort Range Plus'],
    '5 E-Tech': ['Urban Range', 'Comfort Range'],
    'Scenic E-Tech': ['Standard Range', 'Long Range'],
    'Twingo E-Tech': ['Equilibre', 'Techno'],
    'Zoe': ['R110', 'R135'],
  },
  'Tesla': {
    'Model 3': ['Propulsion', 'Grande Autonomie', 'Performance'],
    'Model Y': ['Propulsion', 'Grande Autonomie'],
  },
  'Volvo': {
    'EX30': ['Single Motor', 'Twin Motor Performance'],
    'XC40 Recharge': ['Single Motor', 'Twin Motor AWD'],
  },
}

export const CATALOG_BRANDS = Object.keys(VEHICLE_CATALOG).sort((a, b) => a.localeCompare(b, 'fr'))

// Model photos from the Chargetrip vehicle database (same images as go.chargetrip.com),
// one per catalog model, served from their CDN. Key: "<brand> <model>".
const CHARGETRIP_CDN = 'https://cars.chargetrip.io/'
const VEHICLE_PHOTOS: Record<string, string> = {
  'Abarth 500e': '6385be4b150257d93e72d848-f0e2178714a873acb2f18d8301694359e3b53ab1.png',
  'Abarth 600e': '67331802c3c63317cfc3de13-0cbbc812360c4a390c56daaf1c60fb5e28f300b3.png',
  'Alfa Romeo Junior Elettrica': '663a50aab0a87b078922c06e-4ca2b4c5edcc6c5ff5acb5a7f68f9972b9ab10f7.png',
  'Alpine A290': '66bb244602831f3714c9eddb-420d90f2782129086c2048ac2735cddbbb5f554c.png',
  'Audi Q4 e-tron': '66cf19879f96eb541f95fa8a-659280a0e1375cf000ac3bed290eec2d0e61a22d.png',
  'Audi Q6 e-tron': '671b92a1c583e73b875a557c-33dcaddbbbd0441f0c6527c2702b57c0c26a64dc.png',
  'BMW i4': '688c8839f048ef791ae200ca-d3410f01915f470307601a3063155af805a47f82.png',
  'BMW iX1': '65117558e3598c22fa083d62-4a0de24f1574c6c91ce14af4aca04d25ebf88136.png',
  'BYD Atto 3': '68603069dde7f05e288ac5a0-607256b0b8c72d02397344584b0d199654c12235.png',
  'BYD Seal': '650867f545c49115ed2fa6cf-8fd940d1e2a4e5b5f093b72429d06985de0556d2.png',
  'Citroën ë-C3': '65b2277749f52e25f507b4d8-a4f5deaa5dca9a54877b409a4d3e75dbbdfdf0b5.png',
  'Citroën ë-C4': '6763dd241c0a0c743a703de4-71e267e03c274c094d4f173bc5937e7ee68490b9.png',
  'Hyundai Ioniq 5': '669e316365d78d38e7f84b31-066e67bcbda5b38a39bb3730e259b5cc53d868a4.png',
  'Hyundai Kona Electric': '698ecd2199c0ae1bcbd05234-5b8acadcf9cee7b317462ecfbc552c475485e574.png',
  'Kia EV3': '66a398786cb96c4415fa5fc4-cd362ee495626e3fe2437dd4367b0b67283e6eb0.png',
  'Kia EV6': '67d426c888c9081f4662b3da-dd43d6e00720c550660ed43d3c3c63ffbd7d5cb8.png',
  'Peugeot e-208': '64c39ac7329e4399e2413762-7f1f84cda39b8ba5b5a7c5fee55fdd90c06f8152.png',
  'Peugeot e-3008': '657064c8b226514bc3088cf9-798b2240844f67bf57982c94d1cf7c65062fb91a.png',
  'Renault Megane E-Tech': '67dacf3bf0a1b95f3afb87f1-ab6edcce4ab35a60e54b8a441a4f511100715780.png',
  'Renault 4 E-Tech': '67d4086076133104c5ce8ef8-ce7bd1a70802af848b72d80761307d76f74506ca.png',
  'Renault 5 E-Tech': '670cc3d81c36ad3ff0217305-ae3d6464773654f6ab45ac4e3d6938e9871a65c3.png',
  'Renault Scenic E-Tech': '670d0382f4d0847d6d5e889d-0815ce640cba074ad7e14268f8e641122fa95bba.png',
  'Renault Twingo E-Tech': '6935d6b5c57bfb2443229ae6-0a3e1facf5244d250c2010177c7d5cfe20a56dc8.png',
  'Renault Zoe': '64c3b39f580c7e9c313a16fa-e0bd51e4794df57d31a5ad7ca124e3067c0943c8.png',
  'Tesla Model 3': '6511775be2227d22fd1db0a0-78c37ed1a914e7d544d18bafbe533ffbc710a286.png',
  'Tesla Model Y': '6798dc6f45cb4c77968a345f-411118093471f751b26edc5b350402cdd3cf96d5.png',
  'Volvo EX30': '69ba728e0741137711d97f69-10d1f9ae8329cdba959e1bd504b2cbb8dacd4fa7.png',
  'Volvo XC40 Recharge': '64c78a018cfdb54975bd3f65-b8f710f417e2d96e747683bf53a8ca9bb6b9648c.png',
}

export const vehiclePhotoUrl = (brand: string | null, model: string | null): string | null => {
  const file = brand && model ? VEHICLE_PHOTOS[`${brand} ${model}`] : undefined
  return file ? CHARGETRIP_CDN + file : null
}
