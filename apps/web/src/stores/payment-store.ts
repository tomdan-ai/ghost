import { create } from 'zustand';
import type { PaymentRequest } from '@ghost/shared-types';

interface PaymentState {
  currentPayment: PaymentRequest | null;
  paymentHistory: PaymentRequest[];
}

interface PaymentActions {
  setCurrentPayment: (payment: PaymentRequest | null) => void;
  clearCurrentPayment: () => void;
  addToHistory: (payment: PaymentRequest) => void;
  setPaymentHistory: (payments: PaymentRequest[]) => void;
}

export type PaymentStore = PaymentState & PaymentActions;

export const usePaymentStore = create<PaymentStore>((set) => ({
  // State
  currentPayment: null,
  paymentHistory: [],

  // Actions
  setCurrentPayment: (payment) => set({ currentPayment: payment }),
  clearCurrentPayment: () => set({ currentPayment: null }),
  addToHistory: (payment) =>
    set((state) => ({
      paymentHistory: [payment, ...state.paymentHistory],
    })),
  setPaymentHistory: (payments) => set({ paymentHistory: payments }),
}));
