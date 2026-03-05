'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { AppConfig } from '@/lib/types';
import { doc } from 'firebase/firestore';

const DEFAULT_LIMITS: AppConfig = {
  anonymousQuoteLimit: 2,
  registeredQuoteLimit: 7,
};

export function useQuoteLimits() {
  const firestore = useFirestore();
  const limitsRef = useMemoFirebase(() => doc(firestore, 'appConfig/limits'), [firestore]);
  const { data: limits, isLoading } = useDoc<AppConfig>(limitsRef);

  return {
    limits: limits ?? DEFAULT_LIMITS,
    isLoading,
  };
}

    