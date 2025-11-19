import { supabase } from "@/integrations/supabase/client";

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url: string | null;
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

  async uploadBanner(
    desktopFile: File,
    mobileFile: File | null,
    title: string,
    isActive: boolean,
    overlayColor: string,
    overlayOpacity: number
  ): Promise<Banner> {
    try {
      // Upload da imagem DESKTOP
      const desktopExt = desktopFile.name.split('.').pop();
      const desktopFileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${desktopExt}`;
      const desktopPath = `banners/${desktopFileName}`;

      const { error: desktopUploadError } = await supabase.storage
        .from('product-images')
        .upload(desktopPath, desktopFile);

      if (desktopUploadError) throw desktopUploadError;

      const { data: { publicUrl: desktopUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(desktopPath);

      // Upload da imagem MOBILE (se fornecida)
      let mobileUrl: string | null = null;
      
      if (mobileFile) {
        const mobileExt = mobileFile.name.split('.').pop();
        const mobileFileName = `${Math.random().toString(36).substring(2)}_mobile_${Date.now()}.${mobileExt}`;
        const mobilePath = `banners/${mobileFileName}`;

        const { error: mobileUploadError } = await supabase.storage
          .from('product-images')
          .upload(mobilePath, mobileFile);

        if (mobileUploadError) throw mobileUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(mobilePath);

        mobileUrl = publicUrl;
      }

      // Se este banner for ativo, desativar todos os outros
      if (isActive) {
        await this.deactivateAllBanners();
      }

      // Criar registro no banco
      const { data, error } = await supabase
        .from('banners')
        .insert({
          title,
          image_url: desktopUrl,
          mobile_image_url: mobileUrl,
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

      const filesToDelete: string[] = [];

      // Extrair caminho da imagem DESKTOP
      const desktopUrlParts = banner.image_url.split('/');
      const desktopPath = `banners/${desktopUrlParts[desktopUrlParts.length - 1]}`;
      filesToDelete.push(desktopPath);

      // Extrair caminho da imagem MOBILE (se existir)
      if (banner.mobile_image_url) {
        const mobileUrlParts = banner.mobile_image_url.split('/');
        const mobilePath = `banners/${mobileUrlParts[mobileUrlParts.length - 1]}`;
        filesToDelete.push(mobilePath);
      }

      // Deletar todas as imagens do storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove(filesToDelete);

      if (storageError) console.error('Erro ao deletar imagens:', storageError);

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
