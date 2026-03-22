import { canUseFeature, PlanFeature } from './plans';
import { NextResponse } from 'next/server';

export function planGate(plan: string | undefined, feature: PlanFeature) {
  if (!canUseFeature(plan || 'starter', feature)) {
    return NextResponse.json(
      {
        error: 'Plan upgrade required',
        feature,
        currentPlan: plan || 'starter',
        upgradeMessage: 'Contact your Yuktha admin to upgrade your plan.',
      },
      { status: 403 }
    );
  }
  return null;
}
