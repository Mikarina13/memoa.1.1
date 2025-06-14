import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Share, 
  Eye, 
  Calendar,
  Image,
  Clock,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MemorialSpaceAPI, MemorialSpace } from '../lib/memorial-space-api';

export function MemorialSpaceManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [memorialSpaces, setMemorialSpaces] = useState<MemorialSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<MemorialSpace | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMemorialSpaces();
    }
  }, [user]);

  const loadMemorialSpaces = async () => {
    try {
      setIsLoading(true);
      const spaces = await MemorialSpaceAPI.getUserMemorialSpaces(user.id);
      setMemorialSpaces(spaces);
    } catch (error) {
      console.error('Error loading memorial spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/memorial-builder');
  };

  const handleEdit = (space: MemorialSpace) => {
    navigate(`/memorial-builder/${space.id}`);
  };

  const handleDelete = async (spaceId: string) => {
    try {
      await MemorialSpaceAPI.deleteMemorialSpace(spaceId);
      setMemorialSpaces(prev => prev.filter(s => s.id !== spaceId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting memorial space:', error);
    }
  };

  const handleTogglePublish = async (space: MemorialSpace) => {
    try {
      const updatedSpace = await MemorialSpaceAPI.updateMemorialSpace(space.id, {
        is_published: !space.is_published,
        published_at: !space.is_published ? new Date().toISOString() : null
      });
      setMemorialSpaces(prev => prev.map(s => s.id === space.id ? updatedSpace : s));
    } catch (error) {
      console.error('Error updating memorial space:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading memorial spaces...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">Memorial Spaces</h2>
          <p className="text-white/70 mt-1">Create and manage your 3D memorial spaces</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Space
        </button>
      </div>

      {/* Memorial Spaces Grid */}
      {memorialSpaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-white/60" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Memorial Spaces Yet</h3>
          <p className="text-white/60 mb-6">Create your first 3D memorial space to preserve memories</p>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Your First Space
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memorialSpaces.map((space) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Image className="w-8 h-8 text-white/60" />
                    </div>
                    <p className="text-white/60 text-sm capitalize">
                      {space.environment_template.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    space.is_published 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {space.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 truncate">
                  {space.title}
                </h3>
                
                {space.description && (
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {space.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-white/60 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(space.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{space.view_count} views</span>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center gap-1 text-xs text-white/50 mb-4">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatDate(space.updated_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(space)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Edit Space"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleTogglePublish(space)}
                      className={`p-2 rounded-lg transition-colors ${
                        space.is_published
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                      title={space.is_published ? 'Unpublish' : 'Publish'}
                    >
                      <Share className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteConfirm(space.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete Space"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {space.is_published && (
                    <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <Users className="w-3 h-3" />
                      Share
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-red-500/30 rounded-xl p-6 max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Delete Memorial Space</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete this memorial space? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}