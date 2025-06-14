import { supabase } from './supabase';

export interface MemorialSpace {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  environment_template: string;
  space_data: any;
  is_published: boolean;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface MemoryPoint {
  id: string;
  memorial_space_id: string;
  title: string;
  description?: string;
  position_x: number;
  position_y: number;
  position_z: number;
  point_type: 'text' | 'voice' | 'photo' | 'video' | 'model';
  content: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemorialAsset {
  id: string;
  user_id: string;
  memorial_space_id?: string;
  asset_name: string;
  asset_type: 'model' | 'image' | 'video' | 'audio';
  file_path: string;
  file_size?: number;
  mime_type?: string;
  metadata: any;
  is_template: boolean;
  created_at: string;
}

export interface SpaceTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  environment_data: any;
  is_active: boolean;
  created_at: string;
}

export class MemorialSpaceAPI {
  
  /**
   * Get all memorial spaces for a user
   */
  static async getUserMemorialSpaces(userId: string): Promise<MemorialSpace[]> {
    const { data, error } = await supabase
      .from('memorial_spaces')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific memorial space
   */
  static async getMemorialSpace(spaceId: string): Promise<MemorialSpace | null> {
    const { data, error } = await supabase
      .from('memorial_spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new memorial space
   */
  static async createMemorialSpace(spaceData: Partial<MemorialSpace>): Promise<MemorialSpace> {
    const { data, error } = await supabase
      .from('memorial_spaces')
      .insert([spaceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a memorial space
   */
  static async updateMemorialSpace(spaceId: string, updates: Partial<MemorialSpace>): Promise<MemorialSpace> {
    const { data, error } = await supabase
      .from('memorial_spaces')
      .update(updates)
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a memorial space
   */
  static async deleteMemorialSpace(spaceId: string): Promise<void> {
    const { error } = await supabase
      .from('memorial_spaces')
      .delete()
      .eq('id', spaceId);

    if (error) throw error;
  }

  /**
   * Get memory points for a memorial space
   */
  static async getMemoryPoints(spaceId: string): Promise<MemoryPoint[]> {
    const { data, error } = await supabase
      .from('memory_points')
      .select('*')
      .eq('memorial_space_id', spaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a memory point
   */
  static async createMemoryPoint(pointData: Partial<MemoryPoint>): Promise<MemoryPoint> {
    const { data, error } = await supabase
      .from('memory_points')
      .insert([pointData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a memory point
   */
  static async updateMemoryPoint(pointId: string, updates: Partial<MemoryPoint>): Promise<MemoryPoint> {
    const { data, error } = await supabase
      .from('memory_points')
      .update(updates)
      .eq('id', pointId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a memory point
   */
  static async deleteMemoryPoint(pointId: string): Promise<void> {
    const { error } = await supabase
      .from('memory_points')
      .delete()
      .eq('id', pointId);

    if (error) throw error;
  }

  /**
   * Get memorial assets for a user
   */
  static async getUserAssets(userId: string): Promise<MemorialAsset[]> {
    const { data, error } = await supabase
      .from('memorial_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get template assets
   */
  static async getTemplateAssets(): Promise<MemorialAsset[]> {
    const { data, error } = await supabase
      .from('memorial_assets')
      .select('*')
      .eq('is_template', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a memorial asset
   */
  static async createMemorialAsset(assetData: Partial<MemorialAsset>): Promise<MemorialAsset> {
    const { data, error } = await supabase
      .from('memorial_assets')
      .insert([assetData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a memorial asset
   */
  static async deleteMemorialAsset(assetId: string): Promise<void> {
    const { error } = await supabase
      .from('memorial_assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;
  }

  /**
   * Get space templates
   */
  static async getSpaceTemplates(): Promise<SpaceTemplate[]> {
    const { data, error } = await supabase
      .from('space_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Upload file to memorial storage
   */
  static async uploadFile(
    file: File,
    bucket: 'memorial-models' | 'memorial-media' | 'memorial-thumbnails',
    userId: string,
    filename?: string
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = filename || `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Delete file from memorial storage
   */
  static async deleteFile(
    bucket: 'memorial-models' | 'memorial-media' | 'memorial-thumbnails',
    filePath: string
  ): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  }

  /**
   * Get published public memorial spaces
   */
  static async getPublicMemorialSpaces(limit: number = 10): Promise<MemorialSpace[]> {
    const { data, error } = await supabase
      .from('memorial_spaces')
      .select('*')
      .eq('is_published', true)
      .eq('is_public', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Increment view count for a memorial space
   */
  static async incrementViewCount(spaceId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_memorial_view_count', {
      space_id: spaceId
    });

    if (error) throw error;
  }

  /**
   * Search public memorial spaces
   */
  static async searchPublicSpaces(query: string): Promise<MemorialSpace[]> {
    const { data, error } = await supabase
      .from('memorial_spaces')
      .select('*')
      .eq('is_published', true)
      .eq('is_public', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('view_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Create RPC function for incrementing view count
const createViewCountFunction = async () => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION increment_memorial_view_count(space_id uuid)
      RETURNS void AS $$
      BEGIN
        UPDATE public.memorial_spaces 
        SET view_count = view_count + 1 
        WHERE id = space_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });

  if (error) console.error('Error creating view count function:', error);
};