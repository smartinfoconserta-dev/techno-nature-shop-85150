export interface WarrantyStatus {
  daysRemaining: number;
  isActive: boolean;
  expirationDate: Date;
  percentage: number;
  warrantyDays: number; // Total de dias da garantia
}

export function calculateWarranty(
  saleDate: string, 
  warrantyDays: number = 90
): WarrantyStatus {
  if (warrantyDays === 0) {
    return {
      daysRemaining: 0,
      isActive: false,
      expirationDate: new Date(saleDate),
      percentage: 0,
      warrantyDays: 0,
    };
  }

  const sale = new Date(saleDate);
  const now = new Date();
  const expiration = new Date(sale);
  expiration.setDate(expiration.getDate() + warrantyDays);

  const msRemaining = expiration.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    daysRemaining: Math.max(0, daysRemaining),
    isActive: daysRemaining > 0,
    expirationDate: expiration,
    percentage: Math.max(0, Math.min(100, (daysRemaining / warrantyDays) * 100)),
    warrantyDays,
  };
}
