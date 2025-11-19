import { supabase } from "@/integrations/supabase/client";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  overlay_color: string;
  overlay_opacity: number;
  created_at: string;
  updated_at: string;
}

class BannersStore {
  private banners: Banner[] = [];

  getAllBanners(): Banner[] {
    return [...this.banners].sort((a, b) => b.display_order - a.display_order);
  }

  getActiveBanner(): Banner | null {
    return this.banners.find(b => b.is_active) || null;
  }

  async refreshFromBackend(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: false });

      if (error) throw error;
      this.banners = data || [];
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      throw error;
    }
  }

  async uploadBanner(file: File, title: string, isActive: boolean, overlayColor: string, overlayOpacity: number): Promise<Banner> {
    try {
      // Upload da imagem
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Se este banner for ativo, desativar todos os outros
      if (isActive) {
        await this.deactivateAllBanners();
      }

      // Criar registro no banco
      const { data, error } = await supabase
        .from('banners')
        .insert({
          title,
          image_url: publicUrl,
          is_active: isActive,
          display_order: 0,
          overlay_color: overlayColor,
          overlay_opacity: overlayOpacity
        })
        .select()
        .single();

      if (error) throw error;

      await this.refreshFromBackend();
      return data;
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
      throw error;
    }
  }

  async setActiveBanner(id: string): Promise<void> {
    try {
      // Desativar todos os banners
      await this.deactivateAllBanners();

      // Ativar o banner selecionado
      const { error } = await supabase
        .from('banners')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      await this.refreshFromBackend();
    } catch (error) {
      console.error('Erro ao ativar banner:', error);
      throw error;
    }
  }

  async deactivateBanner(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await this.refreshFromBackend();
    } catch (error) {
      console.error('Erro ao desativar banner:', error);
      throw error;
    }
  }

  private async deactivateAllBanners(): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualiza todos

    if (error) throw error;
  }

  async deleteBanner(id: string): Promise<void> {
    try {
      const banner = this.banners.find(b => b.id === id);
      if (!banner) throw new Error('Banner não encontrado');

      // Extrair caminho da imagem da URL
      const urlParts = banner.image_url.split('/');
      const filePath = `banners/${urlParts[urlParts.length - 1]}`;

      // Deletar imagem do storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (storageError) console.error('Erro ao deletar imagem:', storageError);

      // Deletar registro do banco
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await this.refreshFromBackend();
    } catch (error) {
      console.error('Erro ao deletar banner:', error);
      throw error;
    }
  }
}

export const bannersStore = new BannersStore();
