'use client';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { AppConfig, UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

const DEFAULT_LIMITS: AppConfig = {
  anonymousQuoteLimit: 2,
  registeredQuoteLimit: 7,
  anonymousBlockLimit: 7,
  registeredBlockLimit: 20,
};

const PRO_LIMITS: AppConfig = {
    anonymousQuoteLimit: 99999,
    registeredQuoteLimit: 99999,
    anonymousBlockLimit: 99999,
    registeredBlockLimit: 99999,
}

export function useQuoteLimits() {
  const firestore = useFirestore();
  const { user } = useUser();

  const limitsRef = useMemoFirebase(() => doc(firestore, 'appConfig/limits'), [firestore]);
  const { data: limitsConfig, isLoading: isLoadingLimits } = useDoc<AppConfig>(limitsRef);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  const isPro = userProfile?.subscriptionStatus === 'active';

  const finalLimits = isPro 
    ? PRO_LIMITS
    : (limitsConfig ? { ...DEFAULT_LIMITS, ...limitsConfig } : DEFAULT_LIMITS);

  return {
    limits: finalLimits,
    isPro,
    isLoading: isLoadingLimits || isLoadingProfile,
  };
}

    