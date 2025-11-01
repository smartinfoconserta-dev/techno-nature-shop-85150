export interface WarrantyStatus {
  daysRemaining: number;
  isActive: boolean;
  expirationDate: Date;
  percentage: number;
}

export function calculateWarranty(saleDate: string): WarrantyStatus {
  const sale = new Date(saleDate);
  const now = new Date();
  const expiration = new Date(sale);
  expiration.setDate(expiration.getDate() + 90);

  const msRemaining = expiration.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    daysRemaining: Math.max(0, daysRemaining),
    isActive: daysRemaining > 0,
    expirationDate: expiration,
    percentage: Math.max(0, Math.min(100, (daysRemaining / 90) * 100)),
  };
}
