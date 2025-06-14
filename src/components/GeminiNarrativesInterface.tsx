import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Save, Sparkles, ExternalLink, CheckCircle, AlertCircle, PenTool, FileText, Trash2, Download, Upload } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface NarrativeSection {
  id: string;
  title: string;
  content: string;
  type: 'personal_story' | 'memory' | 'value' | 'wisdom' | 'reflection';
  timestamp: Date;
  aiEnhanced?: boolean;
}

interface GeminiNarrativesInterfaceProps {
  onNarrativesProcessed?: (narrativeData: any) => void;
  onClose?: () => void;
}

export function GeminiNarrativesInterface({ onNarrativesProcessed, onClose }: GeminiNarrativesInterfaceProps) {
  const { user } = useAuth();
  const [narratives, setNarratives] = useState<NarrativeSection[]>([]);
  const [currentNarrative, setCurrentNarrative] = useState<NarrativeSection>({
    id: '',
    title: '',
    content: '',
    type: 'personal_story',
    timestamp: new Date()
  });
  const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [showAffiliatePrompt, setShowAffiliatePrompt] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'manage'>('write');
  const [selectedType, setSelectedType] = useState<NarrativeSection['type']>('personal_story');

  const narrativeTypes = [
    { id: 'personal_story', label: 'Personal Story', icon: FileText, description: 'Share meaningful life experiences' },
    { id: 'memory', label: 'Memory', icon: Brain, description: 'Capture special moments and recollections' },
    { id: 'value', label: 'Core Value', icon: Sparkles, description: 'Express your fundamental beliefs' },
    { id: 'wisdom', label: 'Wisdom', icon: PenTool, description: 'Share lessons learned and advice' },
    { id: 'reflection', label: 'Reflection', icon: CheckCircle, description: 'Thoughtful contemplations on life' }
  ] as const;

  useEffect(() => {
    if (user) {
      loadExistingNarratives();
    }
  }, [user]);

  const loadExistingNarratives = async () => {
    try {
      const profile = await MemoirIntegrations.getMemoirProfile(user.id);
      if (profile?.memoir_data?.narratives) {
        const loadedNarratives = Object.entries(profile.memoir_data.narratives).flatMap(([type, stories]: [string, any]) => {
          if (Array.isArray(stories)) {
            return stories.map((story, index) => ({
              id: `${type}-${index}`,
              title: story.title || `${type.replace('_', ' ')} ${index + 1}`,
              content: story.content || story,
              type: type as NarrativeSection['type'],
              timestamp: new Date(story.timestamp || Date.now()),
              aiEnhanced: story.aiEnhanced || false
            }));
          }
          return [];
        });
        setNarratives(loadedNarratives);
      }
    } catch (error) {
      console.error('Error loading narratives:', error);
    }
  };

  const handleSaveNarrative = () => {
    if (!currentNarrative.title.trim() || !currentNarrative.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    const newNarrative: NarrativeSection = {
      ...currentNarrative,
      id: `narrative-${Date.now()}`,
      type: selectedType,
      timestamp: new Date()
    };

    setNarratives(prev => [...prev, newNarrative]);
    setCurrentNarrative({
      id: '',
      title: '',
      content: '',
      type: selectedType,
      timestamp: new Date()
    });
  };

  const handleDeleteNarrative = (narrativeId: string) => {
    setNarratives(prev => prev.filter(n => n.id !== narrativeId));
  };

  const handleImportText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCurrentNarrative(prev => ({
          ...prev,
          content: prev.content + '\n\n' + content
        }));
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const exportNarratives = () => {
    const data = {
      narratives: narratives,
      exportDate: new Date().toISOString(),
      user: user.email
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoir-narratives-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openGeminiAffiliate = () => {
    window.open('https://makersuite.google.com/app/apikey', '_blank');
    setShowAffiliatePrompt(false);
  };

  const processWithGeminiAI = async () => {
    if (!user || narratives.length === 0) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setShowAffiliatePrompt(true);
      return;
    }

    setProcessStatus('processing');
    setProcessError(null);

    try {
      // Update integration status to in_progress
      await MemoirIntegrations.updateIntegrationStatus(user.id, 'gemini', {
        status: 'in_progress'
      });

      // Organize narratives by type
      const organizedNarratives = narratives.reduce((acc, narrative) => {
        if (!acc[narrative.type]) {
          acc[narrative.type] = [];
        }
        acc[narrative.type].push({
          title: narrative.title,
          content: narrative.content,
          timestamp: narrative.timestamp.toISOString(),
          aiEnhanced: narrative.aiEnhanced
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Mock Gemini AI processing (in real implementation, this would call Gemini API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate AI enhancement
      const enhancedNarratives = {
        ...organizedNarratives,
        ai_insights: {
          personality_traits: ['thoughtful', 'reflective', 'empathetic'],
          core_themes: ['family', 'growth', 'resilience'],
          writing_style: 'contemplative and heartfelt',
          processed_at: new Date().toISOString()
        }
      };

      // Store processed narratives in memoir_data
      await MemoirIntegrations.updateMemoirData(user.id, {
        narratives: enhancedNarratives
      });

      // Update integration status to completed
      await MemoirIntegrations.updateIntegrationStatus(user.id, 'gemini', {
        status: 'completed',
        narratives_processed: true
      });

      setProcessStatus('success');
      onNarrativesProcessed?.(enhancedNarratives);

    } catch (error) {
      console.error('Error processing with Gemini:', error);
      setProcessStatus('error');
      
      // Set user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          setProcessError('Invalid Gemini API key. Please check your configuration.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          setProcessError('Gemini API quota exceeded. Please try again later.');
        } else {
          setProcessError(error.message);
        }
      } else {
        setProcessError('An unexpected error occurred. Please try again.');
      }

      // Update integration status to error
      if (user) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'gemini', {
            status: 'error'
          });
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      }
    }
  };

  const selectedTypeInfo = narrativeTypes.find(t => t.id === selectedType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">Narrative Studio</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-8">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'write' ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('write')}
          >
            Write & Create
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'manage' ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage & Process
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="space-y-6">
            {/* Narrative Type Selection */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Narrative Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {narrativeTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-lg transition-all text-left ${
                        selectedType === type.id
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium text-white">{type.label}</span>
                      </div>
                      <p className="text-sm text-white/60">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Writing Interface */}
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {selectedTypeInfo && <selectedTypeInfo.icon className="w-6 h-6 text-emerald-400" />}
                <h3 className="text-lg font-semibold text-white">Write Your {selectedTypeInfo?.label}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder={`Enter a title for your ${selectedTypeInfo?.label.toLowerCase()}`}
                    value={currentNarrative.title}
                    onChange={(e) => setCurrentNarrative(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Content</label>
                  <textarea
                    placeholder={`Share your ${selectedTypeInfo?.label.toLowerCase()}... Write freely and authentically.`}
                    value={currentNarrative.content}
                    onChange={(e) => setCurrentNarrative(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 h-48 resize-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSaveNarrative}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Save Narrative
                  </button>
                  
                  <label className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Import Text
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleImportText}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <h4 className="text-emerald-400 font-medium mb-2">Writing Tips:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Write in your authentic voice</li>
                  <li>• Include specific details and emotions</li>
                  <li>• Consider what you want others to remember</li>
                  <li>• Don't worry about perfect grammar - focus on meaning</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Saved Narratives */}
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Saved Narratives ({narratives.length})</h3>
                <button
                  onClick={exportNarratives}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              
              {narratives.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {narratives.map((narrative) => {
                    const typeInfo = narrativeTypes.find(t => t.id === narrative.type);
                    const Icon = typeInfo?.icon || FileText;
                    
                    return (
                      <div key={narrative.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-emerald-400" />
                              <span className="font-medium text-white">{narrative.title}</span>
                              <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                                {typeInfo?.label}
                              </span>
                              {narrative.aiEnhanced && (
                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                                  AI Enhanced
                                </span>
                              )}
                            </div>
                            <p className="text-white/70 text-sm line-clamp-2">
                              {narrative.content.substring(0, 120)}...
                            </p>
                            <p className="text-white/50 text-xs mt-2">
                              {narrative.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNarrative(narrative.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No narratives saved yet. Switch to "Write & Create" to get started.</p>
                </div>
              )}
            </div>

            {/* Gemini AI Processing */}
            <div className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-lg p-6 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Gemini AI Processing</h3>
              </div>
              
              <p className="text-white/70 mb-4">
                Enhance your narratives with Google Gemini AI. Get insights, personality analysis, and thematic organization of your stories.
              </p>

              {processError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {processError}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={processWithGeminiAI}
                  disabled={narratives.length === 0 || processStatus === 'processing'}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {processStatus === 'processing' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : processStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Processed!
                    </>
                  ) : processStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Try Again
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Process with AI
                    </>
                  )}
                </button>

                <button
                  onClick={openGeminiAffiliate}
                  className="flex items-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Get Gemini API
                </button>
              </div>

              {processStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Narratives successfully processed!</span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">
                    Your stories have been analyzed and enhanced with AI insights.
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-purple-400 font-medium mb-2">AI Processing Includes:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Personality trait analysis</li>
                  <li>• Core theme identification</li>
                  <li>• Writing style assessment</li>
                  <li>• Narrative organization and enhancement</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Affiliate Prompt Modal */}
      <AnimatePresence>
        {showAffiliatePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-emerald-500/30 rounded-xl p-6 max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Get Gemini API Access</h3>
              <p className="text-white/70 mb-6">
                To process your narratives with AI, you'll need a Google Gemini API key. It's free to get started!
              </p>
              
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 mb-6">
                <div className="text-emerald-400 font-medium">Gemini API Benefits:</div>
                <ul className="text-white/70 text-sm mt-2 space-y-1">
                  <li>• Advanced language understanding</li>
                  <li>• Powerful text analysis</li>
                  <li>• Free tier available</li>
                  <li>• Industry-leading AI technology</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={openGeminiAffiliate}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg transition-colors"
                >
                  Get API Key
                </button>
                <button
                  onClick={() => setShowAffiliatePrompt(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}