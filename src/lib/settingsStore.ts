import { supabase } from "@/integrations/supabase/client";

export interface TaxSettings {
  digitalTaxRate: number;
  includeCashInTax: boolean;
}

export interface InstallmentRate {
  installments: number;
  rate: number;
}

export interface Settings extends TaxSettings {
  installmentRates: InstallmentRate[];
  processorOptions: string[];
  ramOptions: string[];
}

const DEFAULT_INSTALLMENT_RATES: InstallmentRate[] = [
  { installments: 1, rate: 0 },
  { installments: 2, rate: 2.99 },
  { installments: 3, rate: 3.99 },
  { installments: 4, rate: 4.99 },
  { installments: 5, rate: 5.99 },
  { installments: 6, rate: 6.99 },
  { installments: 7, rate: 7.99 },
  { installments: 8, rate: 8.99 },
  { installments: 9, rate: 9.99 },
  { installments: 10, rate: 10.99 },
  { installments: 11, rate: 11.99 },
  { installments: 12, rate: 12.99 },
];

const DEFAULT_PROCESSOR_OPTIONS = ["i3", "i5", "i7", "i9", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9"];
const DEFAULT_RAM_OPTIONS = ["4GB", "8GB", "16GB", "32GB", "64GB"];

export const settingsStore = {
  async getSettings(): Promise<Settings> {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        digitalTaxRate: 3.9,
        includeCashInTax: false,
        installmentRates: DEFAULT_INSTALLMENT_RATES,
        processorOptions: DEFAULT_PROCESSOR_OPTIONS,
        ramOptions: DEFAULT_RAM_OPTIONS,
      };
    }

    return {
      digitalTaxRate: Number(data.digital_tax_rate),
      includeCashInTax: data.include_cash_in_tax,
      installmentRates: (data.installment_rates as any[]) || DEFAULT_INSTALLMENT_RATES,
      processorOptions: (data.processor_options as string[]) || DEFAULT_PROCESSOR_OPTIONS,
      ramOptions: (data.ram_options as string[]) || DEFAULT_RAM_OPTIONS,
    };
  },

  async updateTaxSettings(
    digitalTaxRate: number,
    includeCashInTax: boolean
  ): Promise<void> {
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("settings")
        .update({
          digital_tax_rate: digitalTaxRate,
          include_cash_in_tax: includeCashInTax,
        })
        .eq("id", existing.id);

      if (error) {
        console.error("Erro ao atualizar configurações de taxa:", error);
        throw error;
      }
    }
  },

  async updateInstallmentRates(rates: InstallmentRate[]): Promise<void> {
    const sorted = [...rates].sort((a, b) => a.installments - b.installments);

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("settings")
        .update({ installment_rates: sorted as any })
        .eq("id", existing.id);

      if (error) {
        console.error("Erro ao atualizar taxas de parcelamento:", error);
        throw error;
      }
    }
  },

  async addInstallmentRate(installments: number, rate: number): Promise<void> {
    const settings = await this.getSettings();
    const exists = settings.installmentRates.some((r) => r.installments === installments);

    if (exists) {
      throw new Error(`Já existe uma taxa configurada para ${installments}x`);
    }

    const newRates = [...settings.installmentRates, { installments, rate }];
    await this.updateInstallmentRates(newRates);
  },

  async removeInstallmentRate(installments: number): Promise<void> {
    if (installments >= 1 && installments <= 12) {
      throw new Error("Não é possível remover taxas padrão (1x a 12x)");
    }

    const settings = await this.getSettings();
    const filtered = settings.installmentRates.filter((r) => r.installments !== installments);
    await this.updateInstallmentRates(filtered);
  },

  async updateSingleRate(installments: number, rate: number): Promise<void> {
    const settings = await this.getSettings();
    const updated = settings.installmentRates.map((r) =>
      r.installments === installments ? { installments, rate } : r
    );
    await this.updateInstallmentRates(updated);
  },

  // Processor Options Management
  async updateProcessorOptions(options: string[]): Promise<void> {
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("settings")
        .update({ processor_options: options as any })
        .eq("id", existing.id);

      if (error) {
        console.error("Erro ao atualizar opções de processador:", error);
        throw error;
      }
    }
  },

  async addProcessorOption(option: string): Promise<void> {
    const settings = await this.getSettings();
    const exists = settings.processorOptions.some((o) => o === option);

    if (exists) {
      throw new Error(`Já existe a opção "${option}" configurada`);
    }

    const newOptions = [...settings.processorOptions, option];
    await this.updateProcessorOptions(newOptions);
  },

  async removeProcessorOption(option: string): Promise<void> {
    const settings = await this.getSettings();
    const filtered = settings.processorOptions.filter((o) => o !== option);
    await this.updateProcessorOptions(filtered);
  },

  // RAM Options Management
  async updateRAMOptions(options: string[]): Promise<void> {
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("settings")
        .update({ ram_options: options as any })
        .eq("id", existing.id);

      if (error) {
        console.error("Erro ao atualizar opções de RAM:", error);
        throw error;
      }
    }
  },

  async addRAMOption(option: string): Promise<void> {
    const settings = await this.getSettings();
    const exists = settings.ramOptions.some((o) => o === option);

    if (exists) {
      throw new Error(`Já existe a opção "${option}" configurada`);
    }

    const newOptions = [...settings.ramOptions, option];
    await this.updateRAMOptions(newOptions);
  },

  async removeRAMOption(option: string): Promise<void> {
    const settings = await this.getSettings();
    const filtered = settings.ramOptions.filter((o) => o !== option);
    await this.updateRAMOptions(filtered);
  },
};
