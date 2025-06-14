import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, User, LogOut, Mic, Camera, PenTool, Image, Brain, Shield, Zap, Volume2, ExternalLink, Gamepad2, Heart, RefreshCw, Cuboid as Cube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { VoiceRecordingInterface } from '../components/VoiceRecordingInterface';
import { TavusAvatarInterface } from '../components/TavusAvatarInterface';
import { GeminiNarrativesInterface } from '../components/GeminiNarrativesInterface';
import { GamingPreferencesInterface } from '../components/GamingPreferencesInterface';
import { PersonalPreferencesInterface } from '../components/PersonalPreferencesInterface';
import { MemorialSpaceManager } from '../components/MemorialSpaceManager';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';

export function MemoirDashboard() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showAvatarCreation, setShowAvatarCreation] = useState(false);
  const [showGeminiNarratives, setShowGeminiNarratives] = useState(false);
  const [showGamingPreferences, setShowGamingPreferences] = useState(false);
  const [showPersonalPreferences, setShowPersonalPreferences] = useState(false);
  const [initialPersonalPreferencesTab, setInitialPersonalPreferencesTab] = useState<'favorites' | 'digital'>('favorites');
  const [showMemorialSpaceManager, setShowMemorialSpaceManager] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [gamingData, setGamingData] = useState<any>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.title = 'MEMOIR Dashboard';
    
    if (!loading && !user) {
      navigate('/memoir');
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
      console.log('Loading user profile for user:', user.id);
      
      const profile = await MemoirIntegrations.getMemoirProfile(user.id);
      console.log('Loaded profile data:', profile);
      
      setProfileData(profile);
      setIntegrationStatus(profile.integration_status);
      setGamingData(profile.memoir_data?.preferences?.gaming);
      setPersonalData(profile.memoir_data?.preferences?.personal);
      
      console.log('Personal data loaded:', profile.memoir_data?.preferences?.personal);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVoiceCloned = async (voiceId: string) => {
    // Refresh the profile data after successful voice cloning
    await loadUserProfile();
    setShowVoiceRecording(false);
  };

  const handleAvatarCreated = async (avatarId: string) => {
    // Refresh the profile data after successful avatar creation
    await loadUserProfile();
    setShowAvatarCreation(false);
  };

  const handleNarrativesProcessed = async (narrativeData: any) => {
    // Refresh the profile data after successful narrative processing
    await loadUserProfile();
    setShowGeminiNarratives(false);
  };

  const handleGamesStored = async (gamingData: any) => {
    // Refresh the profile data after successful gaming preferences storage
    await loadUserProfile();
    setShowGamingPreferences(false);
  };

  const handlePersonalPreferencesSaved = async (preferencesData: any) => {
    console.log('Personal preferences saved callback triggered:', preferencesData);
    // Refresh the profile data after successful personal preferences storage
    await loadUserProfile();
    // Don't auto-close to allow users to continue editing if needed
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

  const totalPersonalItems = personalData ? 
    (personalData.favorite_songs?.length || 0) +
    (personalData.favorite_locations?.length || 0) +
    (personalData.favorite_movies?.length || 0) +
    (personalData.favorite_books?.length || 0) +
    (personalData.favorite_quotes?.length || 0) +
    (personalData.digital_presence?.length || 0) +
    (personalData.gaming_preferences?.length || 0) : 0;

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
              onClick={() => navigate('/memoir/settings')}
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
          Craft Your Digital Legacy
        </h1>

        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          A sacred space to record your voice, scan your presence, write your truths.
          <br />
          Forging your memories, words, and images into a living mosaic of your essence.
        </p>

        {/* Integration Status Overview */}
        {integrationStatus && (
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 mb-8">
            <h2 className="text-xl font-bold mb-4 text-center text-amber-400">Integration Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">ElevenLabs Voice</span>
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
                  <span className="font-medium">Tavus Avatar</span>
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
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">Gemini AI</span>
                </div>
                <div className={`text-sm ${getStatusColor(integrationStatus.gemini?.status || 'not_started')}`}>
                  {getStatusText(integrationStatus.gemini?.status || 'not_started')}
                </div>
                {integrationStatus.gemini?.narratives_processed && (
                  <div className="text-xs text-white/60 mt-1">
                    Narratives: Processed
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8 mb-12">
          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Inputs for Legacy Creation</h2>
            
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
                    <p className="text-white/80 font-medium">Design and build immersive 3D memorial spaces. Create interactive environments with memory points, voice recordings, photos, and 3D objects to preserve your legacy.</p>
                    <div className="mt-3 text-indigo-300 text-sm">
                      👆 Click here to expand and access the 3D Space Builder
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
                      🚀 Open 3D Space Builder
                    </button>
                    
                    <div className="mt-4 p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
                      <h4 className="text-indigo-300 font-medium mb-3">🌟 Memorial Space Features:</h4>
                      <ul className="text-white/80 text-sm space-y-2">
                        <li>• 🎨 Design custom 3D environments with different themes</li>
                        <li>• 📍 Add interactive memory points with text, voice, photos, videos</li>
                        <li>• 🎭 Upload and place personal 3D models and objects</li>
                        <li>• 🤝 Share memorial spaces with family and friends</li>
                        <li>• ⚡ Real-time 3D editing with intuitive tools</li>
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
                          ✓ Voice Cloned
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Record your voice for AI voice reanimation. Capture your unique vocal patterns and expressions with industry-leading ElevenLabs technology.</p>
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
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'scans' ? 'ring-2 ring-purple-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'scans' ? null : 'scans')}
              >
                <div className="flex items-start gap-4">
                  <Camera className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Presence Scans</h3>
                      <a
                        href="https://tavus.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full hover:bg-purple-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Tavus
                      </a>
                      {integrationStatus?.tavus?.avatar_created && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Avatar Created
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Create your visual likeness through advanced AI avatar generation for a realistic representation.</p>
                  </div>
                </div>
                {expandedSection === 'scans' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAvatarCreation(true);
                      }}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Start Avatar Creation
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'written' ? 'ring-2 ring-emerald-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'written' ? null : 'written')}
              >
                <div className="flex items-start gap-4">
                  <PenTool className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Written Content/Narratives</h3>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full hover:bg-emerald-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Gemini AI
                      </a>
                      {integrationStatus?.gemini?.narratives_processed && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ AI Processed
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Write your truths, including personal narratives, memories, reflections, and core values. Enhanced by Google Gemini AI.</p>
                  </div>
                </div>
                {expandedSection === 'written' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGeminiNarratives(true);
                      }}
                      className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Brain className="w-5 h-5" />
                      Open Narrative Studio
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'social-media' ? 'ring-2 ring-amber-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'social-media' ? null : 'social-media')}
              >
                <div className="flex items-start gap-4">
                  <Image className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Digital Presence</h3>
                    <p className="text-white/70">Share direct links to your main social media profiles.</p>
                  </div>
                </div>
                {expandedSection === 'social-media' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInitialPersonalPreferencesTab('digital'); // Set tab to 'digital'
                        setShowPersonalPreferences(true); // Open PersonalPreferencesInterface
                      }}
                      className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 rounded-lg transition-colors"
                    >
                      Manage Social Media Links
                    </button>
                  </div>
                )}
              </div>

              {/* Personal Preferences Section */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'personal' ? 'ring-2 ring-pink-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
              >
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Personal Favorites</h3>
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
                    <p className="text-white/70">Share your favorite songs, movies, books, locations, quotes, and digital presence. Create a comprehensive profile of your interests and inspirations.</p>
                  </div>
                </div>
                {expandedSection === 'personal' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInitialPersonalPreferencesTab('favorites'); // Set tab to 'favorites'
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
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Personalized Digital Avatar</h2>
            
            <div className="space-y-6">
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'twin' ? 'ring-2 ring-rose-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'twin' ? null : 'twin')}
              >
                <div className="flex items-start gap-4">
                  <Brain className="w-6 h-6 text-rose-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Immortal Digital Twin</h3>
                    <p className="text-white/70">Experience the birth of your immortal digital twin, a dynamic digital afterimage that preserves your essence.</p>
                  </div>
                </div>
                {expandedSection === 'twin' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Digital twin creation available after completing voice and avatar setup!');
                      }}
                      className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-3 rounded-lg transition-colors"
                    >
                      Create Twin
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'auth' ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'auth' ? null : 'auth')}
              >
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Authenticity</h3>
                    <p className="text-white/70">Your digital twin is crafted from your voice recordings, 3D scans, and personal narratives.</p>
                  </div>
                </div>
                {expandedSection === 'auth' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Authenticity verification coming soon!');
                      }}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-lg transition-colors"
                    >
                      Verify Authenticity
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'profile' ? 'ring-2 ring-purple-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
              >
                <div className="flex items-start gap-4">
                  <Zap className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Personality Profiling</h3>
                    <p className="text-white/70">Enhanced avatar depth through analysis of your provided data and platform interactions.</p>
                  </div>
                </div>
                {expandedSection === 'profile' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Personality profiling coming soon!');
                      }}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 rounded-lg transition-colors"
                    >
                      Start Profiling
                    </button>
                  </div>
                )}
              </div>

              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'presence' ? 'ring-2 ring-emerald-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'presence' ? null : 'presence')}
              >
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Dynamic Presence</h3>
                    <p className="text-white/70">Your digital twin evolves and adapts while maintaining the core essence of your personality.</p>
                  </div>
                </div>
                {expandedSection === 'presence' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Dynamic presence configuration coming soon!');
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

      {/* Voice Recording Interface Modal */}
      <AnimatePresence>
        {showVoiceRecording && (
          <VoiceRecordingInterface
            onVoiceCloned={handleVoiceCloned}
            onClose={() => setShowVoiceRecording(false)}
          />
        )}
      </AnimatePresence>

      {/* Tavus Avatar Interface Modal */}
      <AnimatePresence>
        {showAvatarCreation && (
          <TavusAvatarInterface
            onAvatarCreated={handleAvatarCreated}
            onClose={() => setShowAvatarCreation(false)}
          />
        )}
      </AnimatePresence>

      {/* Gemini Narratives Interface Modal */}
      <AnimatePresence>
        {showGeminiNarratives && (
          <GeminiNarrativesInterface
            onNarrativesProcessed={handleNarrativesProcessed}
            onClose={() => setShowGeminiNarratives(false)}
          />
        )}
      </AnimatePresence>

      {/* Gaming Preferences Interface Modal */}
      <AnimatePresence>
        {showGamingPreferences && (
          <GamingPreferencesInterface
            onGamesStored={handleGamesStored}
            onClose={() => setShowGamingPreferences(false)}
          />
        )}
      </AnimatePresence>

      {/* Personal Preferences Interface Modal */}
      <AnimatePresence>
        {showPersonalPreferences && (
          <PersonalPreferencesInterface
            onPreferencesSaved={handlePersonalPreferencesSaved}
            onClose={() => setShowPersonalPreferences(false)}
            initialTab={initialPersonalPreferencesTab}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}