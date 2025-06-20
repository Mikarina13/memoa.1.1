import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Video, Play, Pause, ExternalLink, CheckCircle, AlertCircle, ImageIcon, Trash2 } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface MediaFile {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  type: 'image' | 'video';
  timestamp: Date;
}

interface TavusAvatarInterfaceProps {
  onAvatarCreated?: (avatarId: string) => void;
  onClose?: () => void;
}

export function TavusAvatarInterface({ onAvatarCreated, onClose }: TavusAvatarInterfaceProps) {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [showAffiliatePrompt, setShowAffiliatePrompt] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    return () => {
      // Cleanup media URLs
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.url);
        if (videoRefs.current[file.id]) {
          videoRefs.current[file.id].pause();
          delete videoRefs.current[file.id];
        }
      });
    };
  }, [uploadedFiles]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const newFile: MediaFile = {
          id: `upload-${Date.now()}-${index}`,
          name: file.name,
          blob: file,
          url,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          timestamp: new Date()
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
      }
    });
    
    event.target.value = ''; // Reset input
  };

  const playVideo = (file: MediaFile) => {
    if (file.type !== 'video') return;

    // Stop any currently playing video
    Object.values(videoRefs.current).forEach(video => video.pause());
    
    if (currentlyPlaying === file.id) {
      setCurrentlyPlaying(null);
      return;
    }

    const video = document.createElement('video');
    video.src = file.url;
    video.controls = true;
    videoRefs.current[file.id] = video;
    
    video.onended = () => {
      setCurrentlyPlaying(null);
      delete videoRefs.current[file.id];
    };

    video.play();
    setCurrentlyPlaying(file.id);
  };

  const deleteFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url);
      if (videoRefs.current[fileId]) {
        videoRefs.current[fileId].pause();
        delete videoRefs.current[fileId];
      }
      if (currentlyPlaying === fileId) {
        setCurrentlyPlaying(null);
      }
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const openTavusAffiliate = () => {
    window.open('https://tavus.io/?ref=memoa', '_blank');
    setShowAffiliatePrompt(false);
  };

  const createAvatarWithTavus = async () => {
    if (!user || uploadedFiles.length === 0) return;

    const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!apiKey) {
      setShowAffiliatePrompt(true);
      return;
    }

    setCreateStatus('uploading');
    setCreateError(null);

    try {
      // Update integration status to in_progress
      await MemoirIntegrations.updateIntegrationStatus(user.id, 'tavus', {
        status: 'in_progress'
      });

      setCreateStatus('processing');

      // Mock Tavus API call since we don't have a real integration yet
      // In a real implementation, this would upload the files to Tavus API
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing

      // Generate a mock avatar ID
      const newAvatarId = `tavus_avatar_${Date.now()}_${user.id.slice(0, 8)}`;

      // Store avatar ID in our database
      await MemoirIntegrations.storeTavusAvatarId(user.id, newAvatarId);
      
      setAvatarId(newAvatarId);
      setCreateStatus('success');
      onAvatarCreated?.(newAvatarId);

    } catch (error) {
      console.error('Error creating avatar:', error);
      setCreateStatus('error');
      
      // Set user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          setCreateError('Invalid Tavus API key. Please check your configuration.');
        } else if (error.message.includes('insufficient credits') || error.message.includes('quota')) {
          setCreateError('Insufficient Tavus credits. Please upgrade your plan.');
        } else if (error.message.includes('file size') || error.message.includes('format')) {
          setCreateError('Invalid file format or size. Please use high-quality images or videos.');
        } else {
          setCreateError(error.message);
        }
      } else {
        setCreateError('An unexpected error occurred. Please try again.');
      }

      // Update integration status to error
      if (user) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'tavus', {
            status: 'error'
          });
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">Avatar Creation Studio</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Upload Controls */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Photos & Videos</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                Upload Media
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">Upload Tips:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Use high-resolution photos (minimum 512x512px)</li>
                <li>• Include multiple angles of your face</li>
                <li>• Videos should be 15-60 seconds long</li>
                <li>• Ensure good lighting and clear visibility</li>
                <li>• Avoid sunglasses or face coverings</li>
              </ul>
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Uploaded Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {file.type === 'video' ? (
                          <Video className="w-5 h-5 text-purple-400" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-blue-400" />
                        )}
                        <span className="text-white font-medium truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="relative">
                      {file.type === 'video' ? (
                        <div className="bg-black/50 rounded-lg p-4 text-center">
                          <button
                            onClick={() => playVideo(file)}
                            className="flex items-center justify-center w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-full transition-colors mx-auto"
                          >
                            {currentlyPlaying === file.id ? (
                              <Pause className="w-6 h-6 text-white" />
                            ) : (
                              <Play className="w-6 h-6 text-white" />
                            )}
                          </button>
                          <p className="text-white/60 text-sm mt-2">Click to preview</p>
                        </div>
                      ) : (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                    </div>
                    
                    <div className="text-white/60 text-xs mt-2">
                      {file.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tavus Integration */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Tavus Avatar Creation</h3>
            </div>
            
            <p className="text-white/70 mb-4">
              Create a lifelike digital avatar using advanced AI technology. Perfect for preserving your visual presence in your digital legacy.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {createError}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={createAvatarWithTavus}
                disabled={uploadedFiles.length === 0 || createStatus === 'uploading' || createStatus === 'processing'}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {createStatus === 'uploading' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : createStatus === 'processing' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Avatar...
                  </>
                ) : createStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Avatar Created!
                  </>
                ) : createStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    Try Again
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Create Avatar
                  </>
                )}
              </button>

              <button
                onClick={openTavusAffiliate}
                className="flex items-center gap-2 px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Get Tavus Pro
              </button>
            </div>

            {createStatus === 'success' && avatarId && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Avatar successfully created!</span>
                </div>
                <p className="text-white/70 text-sm mt-1">
                  Avatar ID: {avatarId}
                </p>
              </div>
            )}

            <div className="mt-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
              <h4 className="text-pink-400 font-medium mb-2">Tavus Benefits:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Industry-leading avatar quality</li>
                <li>• Real-time conversational AI</li>
                <li>• Multiple output formats</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>
          </div>
        </div>
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
              className="bg-black/90 border border-purple-500/30 rounded-xl p-6 max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Get Tavus Pro Access</h3>
              <p className="text-white/70 mb-6">
                To create avatars, you'll need a Tavus account. Get $150 in free credits to start building your digital presence!
              </p>
              
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
                <div className="text-purple-400 font-medium">Free Credits Include:</div>
                <ul className="text-white/70 text-sm mt-2 space-y-1">
                  <li>• 250 conversational video minutes</li>
                  <li>• 3 concurrent CVI streams</li>
                  <li>• 3 free replica generations</li>
                  <li>• Professional avatar quality</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={openTavusAffiliate}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors"
                >
                  Get Free Credits
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