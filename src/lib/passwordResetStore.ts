export interface PasswordResetCode {
  customerId: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

const STORAGE_KEY = "password_reset_codes";
const CODE_VALIDITY_MINUTES = 15;

export const passwordResetStore = {
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  createResetCode(customerId: string): PasswordResetCode {
    const codes = this.getAllCodes();
    
    // Remover códigos anteriores do mesmo cliente
    const filteredCodes = codes.filter(c => c.customerId !== customerId);
    
    const code: PasswordResetCode = {
      customerId,
      code: this.generateCode(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CODE_VALIDITY_MINUTES * 60 * 1000).toISOString(),
    };
    
    filteredCodes.push(code);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCodes));
    
    return code;
  },

  validateCode(customerId: string, code: string): boolean {
    const codes = this.getAllCodes();
    const resetCode = codes.find(
      c => c.customerId === customerId && c.code === code
    );
    
    if (!resetCode) return false;
    
    // Verificar se o código expirou
    if (new Date(resetCode.expiresAt) < new Date()) {
      this.removeCode(customerId);
      return false;
    }
    
    return true;
  },

  removeCode(customerId: string): void {
    const codes = this.getAllCodes().filter(c => c.customerId !== customerId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  },

  getAllCodes(): PasswordResetCode[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  cleanExpiredCodes(): void {
    const codes = this.getAllCodes();
    const validCodes = codes.filter(c => new Date(c.expiresAt) >= new Date());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validCodes));
  },
};
