import { supabase } from './supabase';

// Environment variables for API keys (add these to your .env file)
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface MemoirIntegrationStatus {
  elevenlabs: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    voice_cloned: boolean;
    last_updated: string | null;
  };
  tavus: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    avatar_created: boolean;
    last_updated: string | null;
  };
  gemini: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    narratives_processed: boolean;
    last_updated: string | null;
  };
  portrait_generation?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    portraits_generated: boolean;
    last_updated: string | null;
  };
}

export interface GameEntry {
  id: string;
  name: string;
  platform: string;
  invite_link?: string;
  invite_code?: string;
  notes?: string;
  favorite: boolean;
  timestamp: string;
}

export interface DigitalPresenceEntry {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

interface GeneratedPortrait {
  id: string;
  name: string;
  sourceImage: string;
  generatedImages: string[];
  style: string;
  timestamp: string;
}

interface PersonalPreferences {
  favorite_songs: string[];
  favorite_locations: string[];
  favorite_movies: string[];
  favorite_books: string[];
  favorite_quotes: string[];
  digital_presence: DigitalPresenceEntry[];
  gaming_preferences: GameEntry[];
  last_updated?: string;
}

interface MemoirData {
  narratives?: {
    personal_stories?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    memories?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    values?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    wisdom?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    reflections?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    ai_insights?: {
      personality_traits: string[];
      core_themes: string[];
      writing_style: string;
      processed_at: string;
    };
  };
  preferences?: {
    music: {
      spotify_playlist?: string;
      youtube_playlist?: string;
      deezer_playlist?: string;
    };
    places: {
      google_maps_saved_places?: any[];
      favorite_locations?: string[];
    };
    social_media: {
      facebook_data?: any;
      instagram_data?: any;
    };
    gaming?: {
      games: GameEntry[];
      favorite_genres?: string[];
      gaming_platforms?: string[];
      total_games: number;
      last_updated: string;
    };
    personal?: PersonalPreferences;
    memoria_personal?: PersonalPreferences; // Separate storage for MEMORIA personal preferences
  };
  portraits?: {
    generated?: GeneratedPortrait[];
    last_updated?: string;
  };
  ai_generated?: {
    additional_photos?: string[];
    generated_videos?: string[];
    synthetic_voice_samples?: string[];
  };
}

export class MemoirIntegrations {
  
  /**
   * Update user's memoir integration status
   */
  static async updateIntegrationStatus(
    userId: string, 
    integration: keyof MemoirIntegrationStatus, 
    updates: Partial<MemoirIntegrationStatus[keyof MemoirIntegrationStatus]>
  ) {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('integration_status')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentStatus = profile.integration_status as MemoirIntegrationStatus;
      const updatedStatus = {
        ...currentStatus,
        [integration]: {
          ...currentStatus[integration],
          ...updates,
          last_updated: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('profiles')
        .update({ integration_status: updatedStatus })
        .eq('user_id', userId);

      if (error) throw error;
      return updatedStatus;
    } catch (error) {
      console.error('Error updating integration status:', error);
      throw error;
    }
  }

  /**
   * Update user's memoir data
   */
  static async updateMemoirData(userId: string, data: Partial<MemoirData>) {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('memoir_data')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentData = (profile.memoir_data as MemoirData) || {};
      
      // Deep merge the data, especially for nested objects like preferences
      const updatedData = {
        ...currentData,
        ...data,
        preferences: {
          ...currentData.preferences,
          ...data.preferences
        }
      };

      const { error } = await supabase
        .from('profiles')
        .update({ memoir_data: updatedData })
        .eq('user_id', userId);

      if (error) throw error;
      return updatedData;
    } catch (error) {
      console.error('Error updating memoir data:', error);
      throw error;
    }
  }

  /**
   * Get user's current memoir integration status and data
   */
  static async getMemoirProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching memoir profile:', error);
      throw error;
    }
  }

  /**
   * Store ElevenLabs voice ID with enhanced error handling
   */
  static async storeElevenLabsVoiceId(userId: string, voiceId: string) {
    try {
      console.log('Storing ElevenLabs voice ID:', { userId, voiceId });

      // Validate voice ID format
      if (!voiceId || typeof voiceId !== 'string' || voiceId.length < 10) {
        throw new Error('Invalid voice ID format');
      }

      // Update integration status to completed
      await this.updateIntegrationStatus(userId, 'elevenlabs', {
        status: 'completed',
        voice_cloned: true
      });

      // Store the voice ID in the profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          elevenlabs_voice_id: voiceId.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Database error storing voice ID:', error);
        throw error;
      }

      console.log('Successfully stored ElevenLabs voice ID');
      return voiceId;
    } catch (error) {
      console.error('Error storing ElevenLabs voice ID:', error);
      
      // Update integration status to error
      try {
        await this.updateIntegrationStatus(userId, 'elevenlabs', {
          status: 'error',
          voice_cloned: false
        });
      } catch (statusError) {
        console.error('Error updating integration status to error:', statusError);
      }
      
      throw error;
    }
  }

  /**
   * Store Tavus avatar ID
   */
  static async storeTavusAvatarId(userId: string, avatarId: string) {
    try {
      await this.updateIntegrationStatus(userId, 'tavus', {
        status: 'completed',
        avatar_created: true
      });

      const { error } = await supabase
        .from('profiles')
        .update({ tavus_avatar_id: avatarId })
        .eq('user_id', userId);

      if (error) throw error;
      return avatarId;
    } catch (error) {
      console.error('Error storing Tavus avatar ID:', error);
      throw error;
    }
  }

  /**
   * Store processed Gemini narratives
   */
  static async storeGeminiNarratives(userId: string, narrativeData: any) {
    try {
      // Update memoir data with processed narratives
      await this.updateMemoirData(userId, {
        narratives: narrativeData
      });

      // Update integration status
      await this.updateIntegrationStatus(userId, 'gemini', {
        status: 'completed',
        narratives_processed: true
      });

      return narrativeData;
    } catch (error) {
      console.error('Error storing Gemini narratives:', error);
      throw error;
    }
  }

  /**
   * Get processed narratives for a user
   */
  static async getUserNarratives(userId: string) {
    try {
      const profile = await this.getMemoirProfile(userId);
      return profile?.memoir_data?.narratives || null;
    } catch (error) {
      console.error('Error fetching user narratives:', error);
      throw error;
    }
  }

  /**
   * Store gaming preferences
   */
  static async storeGamingPreferences(userId: string, games: GameEntry[]) {
    try {
      const gamingData = {
        games: games,
        favorite_genres: [...new Set(games.filter(g => g.favorite).map(g => g.platform))],
        gaming_platforms: [...new Set(games.map(g => g.platform))],
        total_games: games.length,
        last_updated: new Date().toISOString()
      };

      // Update memoir data with gaming preferences
      await this.updateMemoirData(userId, {
        preferences: {
          gaming: gamingData
        }
      });

      return gamingData;
    } catch (error) {
      console.error('Error storing gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Get gaming preferences for a user
   */
  static async getGamingPreferences(userId: string) {
    try {
      const profile = await this.getMemoirProfile(userId);
      return profile?.memoir_data?.preferences?.gaming || null;
    } catch (error) {
      console.error('Error fetching gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Store personal preferences with context (memoir vs memoria)
   */
  static async storePersonalPreferences(
    userId: string, 
    preferences: PersonalPreferences,
    context: 'memoir' | 'memoria' = 'memoir'
  ) {
    try {
      console.log(`Storing ${context} personal preferences for user:`, userId, preferences);
      
      const personalData = {
        ...preferences,
        last_updated: new Date().toISOString()
      };

      // Use different storage keys based on context
      const preferenceKey = context === 'memoria' ? 'memoria_personal' : 'personal';

      // Use direct update to ensure data persistence
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('memoir_data')
        .eq('user_id', userId)
        .single();

      const currentMemoirData = currentProfile?.memoir_data || {};
      const currentPreferences = currentMemoirData.preferences || {};

      const updatedMemoirData = {
        ...currentMemoirData,
        preferences: {
          ...currentPreferences,
          [preferenceKey]: personalData
        }
      };

      const { error, data } = await supabase
        .from('profiles')
        .update({ memoir_data: updatedMemoirData })
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Successfully stored ${context} personal preferences:`, data);
      return personalData;
    } catch (error) {
      console.error(`Error storing ${context} personal preferences:`, error);
      throw error;
    }
  }

  /**
   * Get personal preferences with context (memoir vs memoria)
   */
  static async getPersonalPreferences(userId: string, context: 'memoir' | 'memoria' = 'memoir') {
    try {
      console.log(`Loading ${context} personal preferences for user:`, userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('memoir_data')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        throw error;
      }

      // Use different storage keys based on context
      const preferenceKey = context === 'memoria' ? 'memoria_personal' : 'personal';
      const personalData = data?.memoir_data?.preferences?.[preferenceKey] || null;
      
      console.log(`Loaded ${context} personal preferences:`, personalData);
      return personalData;
    } catch (error) {
      console.error(`Error fetching ${context} personal preferences:`, error);
      throw error;
    }
  }

  /**
   * Store generated portraits
   */
  static async storeGeneratedPortraits(userId: string, portraits: GeneratedPortrait[]) {
    try {
      const portraitData = {
        generated: portraits,
        last_updated: new Date().toISOString()
      };

      // Update memoir data with portrait data
      await this.updateMemoirData(userId, {
        portraits: portraitData
      });

      // Update integration status
      await this.updateIntegrationStatus(userId, 'portrait_generation', {
        status: 'completed',
        portraits_generated: true
      });

      return portraitData;
    } catch (error) {
      console.error('Error storing generated portraits:', error);
      throw error;
    }
  }

  /**
   * Get generated portraits for a user
   */
  static async getGeneratedPortraits(userId: string) {
    try {
      const profile = await this.getMemoirProfile(userId);
      return profile?.memoir_data?.portraits || null;
    } catch (error) {
      console.error('Error fetching generated portraits:', error);
      throw error;
    }
  }

  /**
   * Check if API keys are configured
   */
  static checkAPIKeys() {
    return {
      elevenlabs: !!ELEVENLABS_API_KEY,
      tavus: !!TAVUS_API_KEY,
      gemini: !!GEMINI_API_KEY
    };
  }

  /**
   * Get API configuration status
   */
  static getAPIStatus() {
    const keys = this.checkAPIKeys();
    return {
      elevenlabs: {
        configured: keys.elevenlabs,
        url: 'https://elevenlabs.io/app/subscription?ref=memoa&code=WORLDSLARGESTHACKATHON-0bb0fa21'
      },
      tavus: {
        configured: keys.tavus,
        url: 'https://tavus.io/?ref=memoa'
      },
      gemini: {
        configured: keys.gemini,
        url: 'https://makersuite.google.com/app/apikey'
      }
    };
  }
}