import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, User, LogOut, Mic, Camera, PenTool, Image, Brain, Shield, Zap, Heart, Volume2, ExternalLink, Wand2, RefreshCw, Cuboid as Cube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PersonalPreferencesInterface } from '../components/PersonalPreferencesInterface';
import { VoiceRecordingInterface } from '../components/VoiceRecordingInterface';
import { PortraitGenerationInterface } from '../components/PortraitGenerationInterface';
import { MemorialSpaceManager } from '../components/MemorialSpaceManager';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';

export function MemoriaDashboard() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showPersonalPreferences, setShowPersonalPreferences] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showPortraitGeneration, setShowPortraitGeneration] = useState(false);
  const [showMemorialSpaceManager, setShowMemorialSpaceManager] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.title = 'MEMORIA Dashboard';
    
    if (!loading && !user) {
      navigate('/memoria');
    }
  }, [navigate, user, loading]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setIsRefreshing(true);
      console.log('Loading MEMORIA user profile for user:', user.id);
      
      const profile = await MemoirIntegrations.getMemoirProfile(user.id);
      console.log('Loaded MEMORIA profile data:', profile);
      
      setProfileData(profile);
      setIntegrationStatus(profile.integration_status);
      
      // Load MEMORIA-specific personal preferences
      const memoriaPersonalData = await MemoirIntegrations.getPersonalPreferences(user.id, 'memoria');
      setPersonalData(memoriaPersonalData);
      
      console.log('MEMORIA personal data loaded:', memoriaPersonalData);
    } catch (error) {
      console.error('Error loading MEMORIA user profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePersonalPreferencesSaved = async (preferencesData: any) => {
    console.log('MEMORIA personal preferences saved callback triggered:', preferencesData);
    // Refresh the profile data after successful personal preferences storage
    await loadUserProfile();
    // Don't auto-close to allow users to continue editing if needed
  };

  const handleVoiceCloned = async (voiceId: string) => {
    // Refresh the profile data after successful voice cloning
    await loadUserProfile();
    setShowVoiceRecording(false);
  };

  const handlePortraitsGenerated = async (portraitData: any) => {
    // Refresh the profile data after successful portrait generation
    await loadUserProfile();
    setShowPortraitGeneration(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'error': return 'Error';
      default: return 'Not Started';
    }
  };

  const totalPersonalItems = personalData ? 
    (personalData.favorite_songs?.length || 0) +
    (personalData.favorite_locations?.length || 0) +
    (personalData.favorite_movies?.length || 0) +
    (personalData.favorite_books?.length || 0) +
    (personalData.favorite_quotes?.length || 0) +
    (personalData.digital_presence?.length || 0) +
    (personalData.gaming_preferences?.length || 0) : 0;

  const totalPortraits = profileData?.memoir_data?.portraits?.generated?.length || 0;

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            Return
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={loadUserProfile}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => navigate('/memoria/settings')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <User className="w-6 h-6" />
            </button>
            <button 
              onClick={logout}
              className="text-white/80 hover:text-white transition-colors"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Revive What Once Lived
        </h1>

        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          A portal to gentle reanimation, allowing you to reconnect with the essence of loved ones who have passed.
          <br />
          Using digital traces they left behind to reconstruct a resonant presence through AI.
        </p>

        {/* Integration Status Overview for MEMORIA */}
        {integrationStatus && (
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 mb-8">
            <h2 className="text-xl font-bold mb-4 text-center text-amber-400">Memory Recreation Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Voice Recreation</span>
                </div>
                <div className={`text-sm ${getStatusColor(integrationStatus.elevenlabs?.status || 'not_started')}`}>
                  {getStatusText(integrationStatus.elevenlabs?.status || 'not_started')}
                </div>
                {profileData?.elevenlabs_voice_id && (
                  <div className="text-xs text-white/60 mt-1">
                    Voice ID: {profileData.elevenlabs_voice_id.slice(0, 8)}...
                  </div>
                )}
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">Visual Recreation</span>
                </div>
                <div className={`text-sm ${getStatusColor(integrationStatus.tavus?.status || 'not_started')}`}>
                  {getStatusText(integrationStatus.tavus?.status || 'not_started')}
                </div>
                {profileData?.tavus_avatar_id && (
                  <div className="text-xs text-white/60 mt-1">
                    Avatar ID: {profileData.tavus_avatar_id.slice(0, 8)}...
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-5 h-5 text-pink-400" />
                  <span className="font-medium">Portrait Generation</span>
                </div>
                <div className={`text-sm ${totalPortraits > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {totalPortraits > 0 ? `${totalPortraits} Portraits` : 'Not Started'}
                </div>
                {totalPortraits > 0 && (
                  <div className="text-xs text-white/60 mt-1">
                    Generated: {totalPortraits} sets
                  </div>
                )}
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">AI Processing</span>
                </div>
                <div className={`text-sm ${getStatusColor(integrationStatus.gemini?.status || 'not_started')}`}>
                  {getStatusText(integrationStatus.gemini?.status || 'not_started')}
                </div>
                {integrationStatus.gemini?.narratives_processed && (
                  <div className="text-xs text-white/60 mt-1">
                    Narratives: Enhanced
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8 mb-12">
          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Memory Collection</h2>
            
            <div className="space-y-6">
              {/* 3D Memorial Spaces Section - NOW AT THE TOP */}
              <div 
                className={`p-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 rounded-lg cursor-pointer transition-all ${expandedSection === 'memorial-spaces' ? 'ring-2 ring-indigo-400' : 'hover:border-indigo-500/50 hover:bg-gradient-to-r hover:from-indigo-500/30 hover:to-purple-500/30'}`}
                onClick={() => setExpandedSection(expandedSection === 'memorial-spaces' ? null : 'memorial-spaces')}
              >
                <div className="flex items-start gap-4">
                  <Cube className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-white">3D Memorial Spaces</h3>
                    </div>
                    <p className="text-white/80 font-medium">Create immersive 3D memorial spaces dedicated to your loved one. Build interactive environments with their photos, voice recordings, favorite memories, and meaningful objects.</p>
                    <div className="mt-3 text-indigo-300 text-sm">
                      👆 Click here to expand and access the 3D Memorial Builder
                    </div>
                  </div>
                </div>
                {expandedSection === 'memorial-spaces' && (
                  <div className="mt-6 pt-6 border-t border-indigo-500/30">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMemorialSpaceManager(true);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-4 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold text-lg shadow-lg"
                    >
                      <Cube className="w-6 h-6" />
                      🚀 Open 3D Memorial Builder
                    </button>
                    
                    <div className="mt-4 p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
                      <h4 className="text-indigo-300 font-medium mb-3">🌟 Memorial Space Features:</h4>
                      <ul className="text-white/80 text-sm space-y-2">
                        <li>• 🎨 Design peaceful memorial environments (gardens, halls, nature)</li>
                        <li>• 📍 Add memory points with their photos, voice recordings, and stories</li>
                        <li>• 🎭 Upload 3D objects that were meaningful to them</li>
                        <li>• 🤝 Create virtual spaces for family and friends to visit</li>
                        <li>• ⚡ Share memorial spaces with others to honor their memory</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'voice' ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'voice' ? null : 'voice')}
              >
                <div className="flex items-start gap-4">
                  <Volume2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Voice Recordings</h3>
                      <a
                        href="https://elevenlabs.io/app/subscription?ref=memoa&code=WORLDSLARGESTHACKATHON-0bb0fa21"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full hover:bg-blue-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        ElevenLabs Pro
                      </a>
                      {integrationStatus?.elevenlabs?.voice_cloned && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Voice Preserved
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Provide voice recordings of your loved one to recreate their unique vocal patterns and expressions using advanced ElevenLabs AI technology.</p>
                  </div>
                </div>
                {expandedSection === 'voice' && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVoiceRecording(true);
                      }}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Mic className="w-5 h-5" />
                      Open Voice Studio
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <a
                        href="https://elevenlabs.io/voice-isolator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voice Isolator
                      </a>
                      
                      <a
                        href="https://elevenlabs.io/app/subscription?ref=memoa&code=WORLDSLARGESTHACKATHON-0bb0fa21"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Get 3 Months Free
                      </a>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="text-blue-400 font-medium mb-2">Voice Recreation Tips:</h4>
                      <ul className="text-white/70 text-sm space-y-1">
                        <li>• Use existing voice messages or recordings</li>
                        <li>• Multiple samples improve recreation quality</li>
                        <li>• Clear audio without background noise works best</li>
                        <li>• Voice Isolator can help clean existing recordings</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'portraits' ? 'ring-2 ring-pink-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'portraits' ? null : 'portraits')}
              >
                <div className="flex items-start gap-4">
                  <Wand2 className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Portrait Generation</h3>
                      {totalPortraits > 0 && (
                        <div className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">
                          {totalPortraits} Generated
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Create additional AI-generated photos of your loved one from a single source image. Generate multiple artistic variations and styles.</p>
                  </div>
                </div>
                {expandedSection === 'portraits' && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPortraitGeneration(true);
                      }}
                      className="w-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-5 h-5" />
                      Open Portrait Studio
                    </button>
                    
                    <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                      <h4 className="text-pink-400 font-medium mb-2">Portrait Generation Features:</h4>
                      <ul className="text-white/70 text-sm space-y-1">
                        <li>• Generate multiple portrait variations from one photo</li>
                        <li>• Choose from realistic, artistic, vintage styles</li>
                        <li>• High-resolution outputs (1024x1024)</li>
                        <li>• Preserve facial features and characteristics</li>
                        <li>• Perfect for creating memorial photo collections</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'visual' ? 'ring-2 ring-purple-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'visual' ? null : 'visual')}
              >
                <div className="flex items-start gap-4">
                  <Camera className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Visual Memories</h3>
                    <p className="text-white/70">Share photographs and videos to help create an authentic visual representation of your loved one.</p>
                  </div>
                </div>
                {expandedSection === 'visual' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Visual memory collection coming soon for MEMORIA!');
                      }}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 rounded-lg transition-colors"
                    >
                      Upload Memories
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'stories' ? 'ring-2 ring-emerald-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'stories' ? null : 'stories')}
              >
                <div className="flex items-start gap-4">
                  <PenTool className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Personal Stories</h3>
                    <p className="text-white/70">Share memories, stories, and meaningful moments that capture their personality and values.</p>
                  </div>
                </div>
                {expandedSection === 'stories' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Personal story collection coming soon for MEMORIA!');
                      }}
                      className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3 rounded-lg transition-colors"
                    >
                      Share Stories
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'moments' ? 'ring-2 ring-amber-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'moments' ? null : 'moments')}
              >
                <div className="flex items-start gap-4">
                  <Image className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Cherished Moments</h3>
                    <p className="text-white/70">Upload photographs of significant life events, daily moments, and treasured memories.</p>
                  </div>
                </div>
                {expandedSection === 'moments' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Cherished moments collection coming soon for MEMORIA!');
                      }}
                      className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 rounded-lg transition-colors"
                    >
                      Upload Moments
                    </button>
                  </div>
                )}
              </div>

              {/* Personal Preferences Section for MEMORIA */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'personal' ? 'ring-2 ring-pink-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
              >
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Personal Favorites of Your Loved One</h3>
                      {totalPersonalItems > 0 && (
                        <div className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">
                          {totalPersonalItems} Items
                        </div>
                      )}
                      {personalData?.last_updated && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Saved
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Document their favorite songs, movies, books, locations, quotes, and digital presence. Preserve what brought them joy and meaning.</p>
                  </div>
                </div>
                {expandedSection === 'personal' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPersonalPreferences(true);
                      }}
                      className="w-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Heart className="w-5 h-5" />
                      Manage Personal Favorites
                    </button>
                    
                    {personalData && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div className="bg-pink-500/10 rounded px-2 py-1 text-center">
                          <div className="text-pink-400 font-medium">{personalData.favorite_songs?.length || 0}</div>
                          <div className="text-white/60">Songs</div>
                        </div>
                        <div className="bg-blue-500/10 rounded px-2 py-1 text-center">
                          <div className="text-blue-400 font-medium">{personalData.favorite_movies?.length || 0}</div>
                          <div className="text-white/60">Movies</div>
                        </div>
                        <div className="bg-green-500/10 rounded px-2 py-1 text-center">
                          <div className="text-green-400 font-medium">{personalData.favorite_books?.length || 0}</div>
                          <div className="text-white/60">Books</div>
                        </div>
                        <div className="bg-amber-500/10 rounded px-2 py-1 text-center">
                          <div className="text-amber-400 font-medium">{personalData.favorite_locations?.length || 0}</div>
                          <div className="text-white/60">Locations</div>
                        </div>
                        <div className="bg-purple-500/10 rounded px-2 py-1 text-center">
                          <div className="text-purple-400 font-medium">{personalData.favorite_quotes?.length || 0}</div>
                          <div className="text-white/60">Quotes</div>
                        </div>
                        <div className="bg-cyan-500/10 rounded px-2 py-1 text-center">
                          <div className="text-cyan-400 font-medium">{personalData.gaming_preferences?.length || 0}</div>
                          <div className="text-white/60">Games</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Digital Presence Recreation</h2>
            
            <div className="space-y-6">
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'essence' ? 'ring-2 ring-rose-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'essence' ? null : 'essence')}
              >
                <div className="flex items-start gap-4">
                  <Brain className="w-6 h-6 text-rose-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Essence Preservation</h3>
                    <p className="text-white/70">Our AI technology carefully preserves and recreates the unique essence of your loved one.</p>
                  </div>
                </div>
                {expandedSection === 'essence' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Essence preservation coming soon for MEMORIA!');
                      }}
                      className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-3 rounded-lg transition-colors"
                    >
                      Start Preservation
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'recreation' ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'recreation' ? null : 'recreation')}
              >
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Authentic Recreation</h3>
                    <p className="text-white/70">A respectful digital presence crafted from shared memories, voice recordings, and personal stories.</p>
                  </div>
                </div>
                {expandedSection === 'recreation' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Authentic recreation coming soon for MEMORIA!');
                      }}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-lg transition-colors"
                    >
                      Start Recreation
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'integration' ? 'ring-2 ring-purple-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'integration' ? null : 'integration')}
              >
                <div className="flex items-start gap-4">
                  <Zap className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Memory Integration</h3>
                    <p className="text-white/70">Advanced processing of shared memories to create a genuine representation of their personality.</p>
                  </div>
                </div>
                {expandedSection === 'integration' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Memory integration coming soon for MEMORIA!');
                      }}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 rounded-lg transition-colors"
                    >
                      Start Integration
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'interactive' ? 'ring-2 ring-emerald-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'interactive' ? null : 'interactive')}
              >
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Interactive Presence</h3>
                    <p className="text-white/70">Experience meaningful interactions while preserving the authentic nature of your memories.</p>
                  </div>
                </div>
                {expandedSection === 'interactive' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Interactive presence coming soon for MEMORIA!');
                      }}
                      className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3 rounded-lg transition-colors"
                    >
                      Configure Presence
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Memorial Space Manager Modal */}
      <AnimatePresence>
        {showMemorialSpaceManager && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white font-[Orbitron]">🚀 3D Memorial Space Builder</h2>
                <button
                  onClick={() => setShowMemorialSpaceManager(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              <MemorialSpaceManager />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal Preferences Interface Modal for MEMORIA */}
      <AnimatePresence>
        {showPersonalPreferences && (
          <PersonalPreferencesInterface
            onPreferencesSaved={handlePersonalPreferencesSaved}
            onClose={() => setShowPersonalPreferences(false)}
            context="memoria"
          />
        )}
      </AnimatePresence>

      {/* Voice Recording Interface Modal for MEMORIA */}
      <AnimatePresence>
        {showVoiceRecording && (
          <VoiceRecordingInterface
            onVoiceCloned={handleVoiceCloned}
            onClose={() => setShowVoiceRecording(false)}
          />
        )}
      </AnimatePresence>

      {/* Portrait Generation Interface Modal for MEMORIA */}
      <AnimatePresence>
        {showPortraitGeneration && (
          <PortraitGenerationInterface
            onPortraitsGenerated={handlePortraitsGenerated}
            onClose={() => setShowPortraitGeneration(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}