import { useState, useEffect } from 'react';
import { supabase, isSessionError } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const createUserProfile = async (userId: string, userMetadata: any = {}) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      // If profile doesn't exist (no data returned), create one
      if (fetchError && fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: userId,
              full_name: userMetadata.full_name || userMetadata.name || null,
              avatar_url: userMetadata.avatar_url || null,
              // Let the database handle defaults for other fields
            }
          ]);

        if (insertError) {
          console.error('Error creating user profile:', insertError.message);
        }
      } else if (fetchError) {
        console.error('Error checking for existing profile:', fetchError.message);
      } else if (existingProfile && userMetadata.avatar_url) {
        // Profile exists but check if we need to update Google avatar
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: userMetadata.avatar_url,
            full_name: userMetadata.full_name || userMetadata.name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating profile with Google data:', updateError.message);
        }
      }
    } catch (err) {
      console.error('Error in createUserProfile:', err);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (isSessionError(error)) {
            await supabase.auth.signOut();
            setUser(null);
          } else {
            console.error('Error fetching user:', error.message);
            setUser(null);
          }
        } else if (user) {
          setUser(user);
          // Create profile in background, don't wait for it
          createUserProfile(user.id, user.user_metadata).catch(console.error);
        }
      } catch (err) {
        console.error('Error in getUser:', err);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
        // Create profile in background, don't wait for it
        createUserProfile(session.user.id, session.user.user_metadata).catch(console.error);
      }
      
      if (!initialized) {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      // Don't reload the page, just clear the user state and let routing handle it
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return { user, loading, logout, initialized };
}