export interface Coupon {
  id: string;
  code: string;
  active: boolean;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "coupons_data";

const initialCoupons: Coupon[] = [
  {
    id: "1",
    code: "010203",
    active: true,
    discountPercent: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const couponsStore = {
  getAllCoupons(): Coupon[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCoupons));
      return initialCoupons;
    }
    return JSON.parse(stored);
  },

  getActiveCoupons(): Coupon[] {
    return this.getAllCoupons().filter(c => c.active);
  },

  validateCoupon(code: string): { valid: boolean; coupon?: Coupon } {
    const coupon = this.getAllCoupons().find(
      c => c.code.toLowerCase() === code.toLowerCase() && c.active
    );
    return {
      valid: !!coupon,
      coupon,
    };
  },

  addCoupon(code: string, discountPercent: number): Coupon {
    const coupons = this.getAllCoupons();
    
    const codeLower = code.trim().toLowerCase();
    const exists = coupons.some(c => c.code.toLowerCase() === codeLower);
    
    if (exists) {
      throw new Error("Já existe um cupom com este código");
    }

    if (code.trim().length < 4 || code.trim().length > 20) {
      throw new Error("O código deve ter entre 4 e 20 caracteres");
    }

    if (discountPercent <= 0 || discountPercent > 50) {
      throw new Error("O desconto deve ser entre 1% e 50%");
    }

    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: code.trim().toUpperCase(),
      active: true,
      discountPercent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    coupons.push(newCoupon);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    return newCoupon;
  },

  updateCoupon(id: string, code: string, discountPercent: number, active: boolean): Coupon {
    const coupons = this.getAllCoupons();
    const index = coupons.findIndex(c => c.id === id);

    if (index === -1) throw new Error("Cupom não encontrado");

    const codeLower = code.trim().toLowerCase();
    const exists = coupons.some(
      c => c.id !== id && c.code.toLowerCase() === codeLower
    );

    if (exists) {
      throw new Error("Já existe um cupom com este código");
    }

    if (code.trim().length < 4 || code.trim().length > 20) {
      throw new Error("O código deve ter entre 4 e 20 caracteres");
    }

    if (discountPercent <= 0 || discountPercent > 50) {
      throw new Error("O desconto deve ser entre 1% e 50%");
    }

    coupons[index] = {
      ...coupons[index],
      code: code.trim().toUpperCase(),
      discountPercent,
      active,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    return coupons[index];
  },

  toggleCouponStatus(id: string): void {
    const coupons = this.getAllCoupons();
    const index = coupons.findIndex(c => c.id === id);
    
    if (index === -1) throw new Error("Cupom não encontrado");
    
    coupons[index].active = !coupons[index].active;
    coupons[index].updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  },

  deleteCoupon(id: string): void {
    const coupons = this.getAllCoupons();
    const filtered = coupons.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
};
