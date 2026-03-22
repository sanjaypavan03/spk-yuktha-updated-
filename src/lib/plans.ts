export const PLANS = {
  starter: {
    name: 'Starter',
    price: 2500,
    maxDoctors: 3,
    features: {
      vault: false,
      aiAnalysis: false,
      ipAdmissions: false,
      performanceReports: false,
      whatsapp: false,
      multiBranch: false,
      customAnalytics: false,
    },
  },
  growth: {
    name: 'Growth',
    price: 5000,
    maxDoctors: 10,
    features: {
      vault: true,
      aiAnalysis: true,
      ipAdmissions: true,
      performanceReports: true,
      whatsapp: true,
      multiBranch: false,
      customAnalytics: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 10000,
    maxDoctors: 25,
    features: {
      vault: true,
      aiAnalysis: true,
      ipAdmissions: true,
      performanceReports: true,
      whatsapp: true,
      multiBranch: true,
      customAnalytics: true,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type PlanFeature = keyof typeof PLANS.starter.features;

export function canUseFeature(plan: string, feature: PlanFeature): boolean {
  return PLANS[(plan as PlanKey)]?.features[feature] ?? false;
}

export function getPlanConfig(plan: string) {
  return PLANS[(plan as PlanKey)] ?? PLANS.starter;
}
