export interface PaymentMethod {
  id?: string;
  userId: string;
  type: PaymentType;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  bankName?: string;
  accountLast4?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date | string;
}

export enum PaymentType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}
