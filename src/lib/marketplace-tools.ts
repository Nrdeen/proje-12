export type FeastAnimal = 'sheep' | 'goat';
export type FeastOccasion = 'wedding' | 'family' | 'aqiqa' | 'other';

export interface FeastCalculatorInput {
  guests: number;
  occasion: FeastOccasion;
  portionGrams: number;
  animalType: FeastAnimal;
  weightKg: number;
  headPriceSar: number;
  includeSpare: boolean;
}

export interface FeastEstimateResult {
  guests: number;
  meatKg: number;
  riceKg: number;
  ediblePerHeadKg: number;
  baseHeads: number;
  spareHeads: number;
  totalHeads: number;
  totalCostSar: number;
  costPerGuestSar: number;
  isLargeFeast: boolean;
}

export const FEAST_OCCASION_PORTIONS: Array<{
  id: FeastOccasion;
  label: string;
  defaultPortionGrams: number;
}> = [
  { id: 'wedding', label: 'وليمة زواج أو مناسبة كبرى', defaultPortionGrams: 550 },
  { id: 'family', label: 'عزيمة عائلية أو ضيافة', defaultPortionGrams: 550 },
  { id: 'aqiqa', label: 'عقيقة مولود', defaultPortionGrams: 400 },
  { id: 'other', label: 'مناسبة عامة أخرى', defaultPortionGrams: 550 },
];

export const FEAST_PORTION_OPTIONS = [
  { grams: 400, label: '400 جم / ضيف (تقديم معتدل)' },
  { grams: 550, label: '550 جم / ضيف (المعتاد في الولائم)' },
  { grams: 700, label: '700 جم / ضيف (وليمة سخية)' },
] as const;

export const FEAST_ANIMAL_SPECS: Record<
  FeastAnimal,
  {
    label: string;
    categoryId: string;
    weightsKg: readonly number[];
    defaultWeightKg: number;
    defaultPriceSar: number;
    recommendedBreedNote: string;
  }
> = {
  sheep: {
    label: 'خروف (نعيمي / حري / نجدي)',
    categoryId: 'cat_sheep',
    weightsKg: [40, 50, 60, 70],
    defaultWeightKg: 50,
    defaultPriceSar: 1950,
    recommendedBreedNote: 'النعيمي والحري هما الأكثر طلباً لولائم العزائم والمناسبات',
  },
  goat: {
    label: 'ماعز (عارضي / بلدي)',
    categoryId: 'cat_goats',
    weightsKg: [25, 30, 35, 40],
    defaultWeightKg: 30,
    defaultPriceSar: 1450,
    recommendedBreedNote: 'التيس العارضي البلدي ممتاز للمندي والمظبي والعزائم المتوسطة',
  },
};

/**
 * Computes transparent Saudi feast livestock quantities & estimated cost
 * using carcass yield factor (38% clean meat per live kg) and 0.15 kg rice per guest.
 */
export function calculateFeastEstimate(input: FeastCalculatorInput): FeastEstimateResult {
  const guests = Math.min(2000, Math.max(1, Math.round(Number(input.guests) || 1)));
  const portionGrams = Math.min(1200, Math.max(250, Number(input.portionGrams) || 550));
  const weightKg = Math.min(120, Math.max(15, Number(input.weightKg) || 50));
  const headPriceSar = Math.min(50000, Math.max(100, Number(input.headPriceSar) || 1950));

  const meatKg = (guests * portionGrams) / 1000;
  const ediblePerHeadKg = weightKg * 0.38;
  const baseHeads = Math.max(1, Math.ceil(meatKg / ediblePerHeadKg - 1e-9));
  const spareHeads = input.includeSpare && guests >= 10 ? 1 : 0;
  const totalHeads = baseHeads + spareHeads;
  const riceKg = Math.ceil(guests * 0.15);
  const totalCostSar = Math.round(totalHeads * headPriceSar);
  const costPerGuestSar = Math.round(totalCostSar / guests);

  return {
    guests,
    meatKg,
    riceKg,
    ediblePerHeadKg,
    baseHeads,
    spareHeads,
    totalHeads,
    totalCostSar,
    costPerGuestSar,
    isLargeFeast: guests > 1500,
  };
}

export const SAUDI_REGIONS_13 = [
  'منطقة الرياض',
  'منطقة مكة المكرمة',
  'منطقة المدينة المنورة',
  'منطقة القصيم',
  'المنطقة الشرقية',
  'منطقة عسير',
  'منطقة تبوك',
  'منطقة حائل',
  'منطقة الحدود الشمالية',
  'منطقة جازان',
  'منطقة نجران',
  'منطقة الباحة',
  'منطقة الجوف',
] as const;

export const SERVICE_PARTNER_TYPES = [
  'نقل المواشي والأغنام',
  'توريد الأعلاف والمكملات',
  'فحص بيطري وشهادة صحية',
  'خدمة سلخ وتجهيز ولائم',
] as const;

export const CONTACT_TOPICS = [
  'استفسار عام عن السوق',
  'توثيق حساب مربي / مراح',
  'الباقات المدفوعة والإعلانات المميزة',
  'طلب خدمة نقل أو تجهيز أو فحص بيطري',
  'مشكلة تقنية أو بلاغ عن إعلان',
] as const;

export function normalizeSaudiPhoneDigits(raw: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  return raw
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/\D/g, '');
}

export function isValidSaudiMobile(raw: string): boolean {
  const digits = normalizeSaudiPhoneDigits(raw);
  return /^05\d{8}$/.test(digits);
}

export const SEASONAL_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

// Seasonal livestock demand multipliers calibrated around Saudi Ramadan (spring) & Eid Al-Adha (June/July) peaks
export const SEASONAL_FACTORS = [
  0.94, 0.96, 1.04, 1.07, 1.09, 1.19, 1.15, 0.99, 0.95, 0.93, 0.94, 0.98,
] as const;

export interface SeasonalMonthPoint {
  month: string;
  monthIndex: number;
  priceSar: number;
  factor: number;
  seasonTag?: string;
}

export function computeSeasonalPriceSeries(baseAvgPriceSar: number): SeasonalMonthPoint[] {
  const safeAvg = Math.max(100, Number(baseAvgPriceSar) || 1600);
  return SEASONAL_MONTHS.map((month, idx) => {
    const factor = SEASONAL_FACTORS[idx];
    const seasonTag =
      idx === 2
        ? 'موسم رمضان'
        : idx === 5
        ? 'ذروة الأضاحي'
        : idx === 9
        ? 'توازن العرض'
        : undefined;
    return {
      month,
      monthIndex: idx,
      priceSar: Math.round((safeAvg * factor) / 10) * 10,
      factor,
      seasonTag,
    };
  });
}

export interface PlanDefinition {
  id: 'free' | 'featured' | 'merchant';
  title: string;
  subtitle: string;
  monthlyPrice: number;
  annualPrice: number;
  highlighted?: boolean;
  badge?: string;
  features: string[];
  ctaLabel: string;
}

export const PRICING_PLANS: PlanDefinition[] = [
  {
    id: 'free',
    title: 'الباقة المجانية',
    subtitle: 'مثالية للأفراد والمربين الراغبين في عرض مواشيهم مجاناً',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'إنشاء حساب وتفعيل الملف الشخصي',
      'نشر إعلانات أساسية في السوق',
      'إضافة الصور والفيديوهات التوضيحية',
      'التواصل والمفاوضة مع المشترين والبائعين',
      'إدارة الإعلانات من لوحة حسابي',
    ],
    ctaLabel: 'ابدأ مجاناً',
  },
  {
    id: 'featured',
    title: 'باقة الإعلان المميز',
    subtitle: 'لزيادة ظهور إعلانك والوصول إلى عدد أكبر من المهتمين',
    monthlyPrice: 99,
    annualPrice: 79,
    highlighted: true,
    badge: 'الأكثر طلباً',
    features: [
      'ظهور الإعلان في مقدمة نتائج البحث',
      'تمييز الإعلان بتصميم وأولوية خاصة',
      'إضافة عدد أكبر من الصور والفيديوهات',
      'إحصائيات المشاهدات ومؤشرات الاهتمام',
      'دعم فني مخصص وأولوية في المراجعة',
    ],
    ctaLabel: 'اختر الباقة',
  },
  {
    id: 'merchant',
    title: 'باقة التاجر / المربي',
    subtitle: 'مخصصة للتجار والمربين وأصحاب المزارع والمراحات الكبيرة',
    monthlyPrice: 299,
    annualPrice: 239,
    features: [
      'عدد غير محدود من الإعلانات النشطة',
      'إدارة احترافية ومتكاملة للمراح',
      'تحليلات تفصيلية للأداء والمشاهدات',
      'إبراز العلامة التجارية وشارة الموثوقية',
      'دعم فني مخصص على مدار الساعة',
    ],
    ctaLabel: 'اختر الباقة',
  },
];
