import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, User, Mail, Globe, Calendar, Shield, Bell, Lock, Camera, Edit, Save, Key, Trash2, Download, Upload, Eye, EyeOff, CheckCircle, AlertCircle, Settings, Smartphone, Monitor, Palette, Languages as Language, Clock, Heart, Star, Award, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'account' | 'privacy' | 'preferences' | 'data'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    birth_date: '',
    avatar_url: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false
  });

  const [stats, setStats] = useState({
    joinDate: new Date(),
    totalItems: 0,
    lastActive: new Date(),
    storageUsed: 0,
    loginCount: 0
  });

  useEffect(() => {
    document.title = 'Profile Settings - MEMOA';
    
    if (!authLoading && !user) {
      navigate('/memento');
    }
  }, [navigate, user, authLoading]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
      // Check and store Google profile picture if available
      checkGoogleProfilePicture();
    }
  }, [user]);

  const checkGoogleProfilePicture = async () => {
    if (user?.user_metadata?.avatar_url && !profile.avatar_url) {
      // Update profile with Google avatar URL
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            avatar_url: user.user_metadata.avatar_url,
            full_name: user.user_metadata.full_name || user.user_metadata.name || profile.full_name,
            updated_at: new Date().toISOString()
          });

        if (!error) {
          setProfile(prev => ({
            ...prev,
            avatar_url: user.user_metadata.avatar_url,
            full_name: user.user_metadata.full_name || user.user_metadata.name || prev.full_name
          }));
        }
      } catch (err) {
        console.error('Error storing Google profile picture:', err);
      }
    }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          phone: data.phone || '',
          birth_date: data.birth_date || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats - in a real app, these would come from various sources
      setStats({
        joinDate: new Date(user.created_at),
        totalItems: Math.floor(Math.random() * 50) + 10,
        lastActive: new Date(),
        storageUsed: Math.floor(Math.random() * 100) + 10,
        loginCount: Math.floor(Math.random() * 200) + 50
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    setError(null);

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setSuccess('Profile picture updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload profile picture');
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setSuccess('Password updated successfully!');
      setShowPasswordForm(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const userData = {
      profile,
      preferences,
      stats,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoa-profile-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would trigger account deletion process
      alert('Account deletion request submitted. You will receive an email with further instructions.');
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: Edit },
    { id: 'account', label: 'Account', icon: Settings },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data & Storage', icon: BarChart3 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            Return Home
          </button>
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 sticky top-8">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 p-1">
                    <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover" 
                          onError={(e) => {
                            console.error('Avatar image failed to load:', profile.avatar_url);
                            // Fallback to default user icon if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="w-8 h-8 text-white/40" />
                      )}
                      {!profile.avatar_url && (
                        <User className="w-8 h-8 text-white/40" />
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 hover:bg-blue-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {avatarUploading ? (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <h2 className="text-lg font-bold mt-3">{profile.full_name || user.email}</h2>
                <p className="text-white/60 text-sm">{user.email}</p>
                {avatarUploading && (
                  <p className="text-blue-400 text-xs mt-1">Uploading...</p>
                )}
              </div>
              
              <nav className="space-y-2">
                {tabItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'hover:bg-white/5 text-white/70'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-[Rajdhani]">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    {tabItems.find(t => t.id === activeTab)?.label}
                  </h1>
                  
                  {success && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      {success}
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <span className="text-blue-400 font-medium">Member Since</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                          {stats.joinDate.toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-purple-400" />
                          <span className="text-purple-400 font-medium">Total Items</span>
                        </div>
                        <div className="text-lg font-bold text-white">{stats.totalItems}</div>
                      </div>
                      
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Storage Used</span>
                        </div>
                        <div className="text-lg font-bold text-white">{stats.storageUsed} MB</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <Award className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="text-white">Profile updated</p>
                            <p className="text-white/60 text-sm">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <Shield className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-white">Security settings reviewed</p>
                            <p className="text-white/60 text-sm">1 day ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <Heart className="w-5 h-5 text-pink-400" />
                          <div>
                            <p className="text-white">Added new favorites</p>
                            <p className="text-white/60 text-sm">3 days ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="bg-white/5 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Profile Picture</h4>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 p-1">
                            <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                              {profile.avatar_url ? (
                                <img 
                                  src={profile.avatar_url} 
                                  alt="Avatar" 
                                  className="w-full h-full rounded-full object-cover" 
                                />
                              ) : (
                                <User className="w-10 h-10 text-white/40" />
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 hover:bg-blue-600 transition-colors disabled:bg-gray-500"
                          >
                            {avatarUploading ? (
                              <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div>
                          <h5 className="text-white font-medium mb-2">Change Profile Picture</h5>
                          <p className="text-white/60 text-sm mb-4">Upload a new photo or use your Google profile picture</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarUploading}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-4 h-4" />
                              Upload Photo
                            </button>
                            {user?.user_metadata?.avatar_url && (
                              <button
                                onClick={() => setProfile(prev => ({ ...prev, avatar_url: user.user_metadata.avatar_url }))}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                              >
                                <Globe className="w-4 h-4" />
                                Use Google Photo
                              </button>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-2">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/60 opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Location</label>
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="City, Country"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Website</label>
                        <input
                          type="url"
                          value={profile.website}
                          onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="https://"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Birth Date</label>
                        <input
                          type="date"
                          value={profile.birth_date}
                          onChange={(e) => setProfile(prev => ({ ...prev, birth_date: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 h-32 resize-none disabled:opacity-50"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveProfile}
                          disabled={loading}
                          className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Password</h3>
                      {!showPasswordForm ? (
                        <button
                          onClick={() => setShowPasswordForm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          Change Password
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Current Password"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="New Password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          
                          <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                          />
                          
                          <div className="flex gap-4">
                            <button
                              onClick={() => setShowPasswordForm(false)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={updatePassword}
                              disabled={loading}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                              Update Password
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Add an extra layer of security to your account</p>
                          <p className="text-white/60 text-sm">Use an authenticator app to secure your login</p>
                        </div>
                        <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                          Enable 2FA
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-white">Current Session</p>
                              <p className="text-white/60 text-sm">Chrome on Windows • Active now</p>
                            </div>
                          </div>
                          <span className="text-green-400 text-sm">Current</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-white">Mobile Session</p>
                              <p className="text-white/60 text-sm">Safari on iPhone • 2 hours ago</p>
                            </div>
                          </div>
                          <button className="text-red-400 hover:text-red-300 text-sm">Revoke</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Profile Visibility</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Public Profile</p>
                            <p className="text-white/60 text-sm">Allow others to find and view your profile</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Show Email Address</p>
                            <p className="text-white/60 text-sm">Display your email on your public profile</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Show Phone Number</p>
                            <p className="text-white/60 text-sm">Display your phone number on your profile</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Data Processing</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Analytics & Insights</p>
                            <p className="text-white/60 text-sm">Help us improve MEMOA with usage analytics</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Personalized Recommendations</p>
                            <p className="text-white/60 text-sm">Receive personalized content suggestions</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Data Retention</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white">Legacy Data Retention</span>
                          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                            <option value="forever">Forever</option>
                            <option value="10years">10 Years</option>
                            <option value="5years">5 Years</option>
                            <option value="1year">1 Year</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Activity Logs</span>
                          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                            <option value="1year">1 Year</option>
                            <option value="6months">6 Months</option>
                            <option value="3months">3 Months</option>
                            <option value="1month">1 Month</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white">Theme</span>
                          <select 
                            value={preferences.theme}
                            onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="auto">Auto</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Localization</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white">Language</span>
                          <select 
                            value={preferences.language}
                            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="ja">日本語</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white">Time Zone</span>
                          <select 
                            value={preferences.timezone}
                            onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Email Notifications</p>
                            <p className="text-white/60 text-sm">Receive updates via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.emailNotifications}
                              onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Push Notifications</p>
                            <p className="text-white/60 text-sm">Receive browser notifications</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.pushNotifications}
                              onChange={(e) => setPreferences(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Marketing Emails</p>
                            <p className="text-white/60 text-sm">Receive promotional content</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.marketingEmails}
                              onChange={(e) => setPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Storage Usage</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white">Total Storage Used</span>
                          <span className="text-white/60">{stats.storageUsed} MB of 1 GB</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(stats.storageUsed / 1000) * 100}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/60">Profile Data:</span>
                            <span className="text-white">2 MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Media Files:</span>
                            <span className="text-white">{Math.floor(stats.storageUsed * 0.8)} MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Voice Data:</span>
                            <span className="text-white">{Math.floor(stats.storageUsed * 0.15)} MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Other:</span>
                            <span className="text-white">{Math.floor(stats.storageUsed * 0.05)} MB</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Data Export</h3>
                      <div className="space-y-4">
                        <p className="text-white/70">Download a copy of all your data from MEMOA, including your profile, preferences, and content.</p>
                        <button
                          onClick={exportData}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                          Export My Data
                        </button>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                      <div className="space-y-4">
                        <p className="text-white/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button
                          onClick={deleteAccount}
                          className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </motion.div>
  );
}