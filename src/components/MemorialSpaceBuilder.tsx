import { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Mic, 
  Image, 
  Video, 
  FileText, 
  Box,
  Settings,
  Share,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MemorialSpaceAPI, MemorialSpace, MemoryPoint, MemorialAsset, SpaceTemplate } from '../lib/memorial-space-api';
import { Stars } from './Stars';
import * as THREE from 'three';

interface MemorialSpaceBuilderProps {
  spaceId?: string;
  onClose?: () => void;
}

interface MemoryPointMesh extends THREE.Object3D {
  userData: {
    memoryPoint: MemoryPoint;
    isInteractive: boolean;
  };
}

// Memory Point Component
function MemoryPointObject({ 
  memoryPoint, 
  isSelected, 
  isEditMode, 
  onSelect, 
  onEdit 
}: {
  memoryPoint: MemoryPoint;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (point: MemoryPoint) => void;
  onEdit: (point: MemoryPoint) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      // Add floating animation
      meshRef.current.position.y = memoryPoint.position_y + Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  const getPointColor = () => {
    switch (memoryPoint.point_type) {
      case 'text': return '#4ade80'; // green
      case 'voice': return '#3b82f6'; // blue
      case 'photo': return '#f59e0b'; // amber
      case 'video': return '#ef4444'; // red
      case 'model': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const getPointIcon = () => {
    switch (memoryPoint.point_type) {
      case 'text': return '📝';
      case 'voice': return '🎤';
      case 'photo': return '📷';
      case 'video': return '🎬';
      case 'model': return '🎭';
      default: return '💫';
    }
  };

  return (
    <group position={[memoryPoint.position_x, memoryPoint.position_y, memoryPoint.position_z]}>
      {/* Outer glow sphere */}
      <mesh scale={isSelected ? 2.5 : hovered ? 2 : 1.5}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={getPointColor()}
          transparent
          opacity={0.1}
          emissive={getPointColor()}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Inner solid sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditMode) {
            onEdit(memoryPoint);
          } else {
            onSelect(memoryPoint);
          }
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={isSelected ? 1.5 : hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={getPointColor()}
          emissive={getPointColor()}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Particle ring effect */}
      {(hovered || isSelected) && (
        <group>
          {[...Array(8)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 8) * Math.PI * 2) * 0.8,
                0,
                Math.sin((i / 8) * Math.PI * 2) * 0.8
              ]}
              scale={0.1}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial
                color={getPointColor()}
                emissive={getPointColor()}
                emissiveIntensity={0.6}
                transparent
                opacity={0.7}
              />
            </mesh>
          ))}
        </group>
      )}
      
      {(hovered || isSelected) && (
        <Html center position={[0, 0.8, 0]}>
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm pointer-events-none min-w-[120px] text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-lg">{getPointIcon()}</span>
            </div>
            <div className="font-semibold">{memoryPoint.title}</div>
            {memoryPoint.description && (
              <div className="text-xs text-white/70 mt-1">{memoryPoint.description}</div>
            )}
          </div>
        </Html>
      )}

      {isSelected && !isEditMode && (
        <Html center position={[0, -1.2, 0]}>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 max-w-sm pointer-events-auto shadow-2xl border border-white/20">
            <h3 className="font-semibold text-gray-800 mb-2 text-center">{memoryPoint.title}</h3>
            {memoryPoint.description && (
              <p className="text-gray-600 text-sm mb-3 text-center">{memoryPoint.description}</p>
            )}
            <div className="space-y-3">
              {memoryPoint.point_type === 'text' && memoryPoint.content?.text && (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {memoryPoint.content.text}
                </div>
              )}
              {memoryPoint.point_type === 'voice' && memoryPoint.content?.audio_url && (
                <audio controls className="w-full">
                  <source src={memoryPoint.content.audio_url} type="audio/mpeg" />
                </audio>
              )}
              {memoryPoint.point_type === 'photo' && memoryPoint.content?.image_url && (
                <img 
                  src={memoryPoint.content.image_url} 
                  alt={memoryPoint.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              {memoryPoint.point_type === 'video' && memoryPoint.content?.video_url && (
                <video controls className="w-full rounded-lg">
                  <source src={memoryPoint.content.video_url} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Environment Renderer - Now creates immersive 3D worlds
function EnvironmentRenderer({ template }: { template: string }) {
  const { scene } = useThree();

  useEffect(() => {
    // Clear any previous fog
    scene.fog = null;
    
    // Set up environment based on template
    switch (template) {
      case 'peaceful_garden':
        scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
        break;
      case 'memorial_hall':
        scene.fog = new THREE.Fog(0x2F2F2F, 15, 80);
        break;
      case 'starlit_void':
        // No fog for space environment
        break;
      case 'cozy_living_room':
        scene.fog = new THREE.Fog(0xFFE4B5, 12, 60);
        break;
      case 'nature_sanctuary':
        scene.fog = new THREE.Fog(0x90EE90, 25, 120);
        break;
      default:
        scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
    }
  }, [template, scene]);

  return (
    <>
      {/* Stars background - always present for immersive feel */}
      <Stars count={template === 'starlit_void' ? 8000 : 3000} />
      
      {/* Floating platform instead of ground plane */}
      <group position={[0, -5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[15, 32]} />
          <meshStandardMaterial 
            color={template === 'starlit_void' ? '#1a1a2e' : '#4ade80'} 
            transparent 
            opacity={template === 'starlit_void' ? 0.3 : 0.4}
            emissive={template === 'starlit_void' ? '#0f0f23' : '#2d7d32'}
            emissiveIntensity={0.1}
          />
        </mesh>
        
        {/* Platform rim glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[14.5, 15.5, 32]} />
          <meshStandardMaterial 
            color={template === 'starlit_void' ? '#4c1d95' : '#4ade80'} 
            transparent 
            opacity={0.6}
            emissive={template === 'starlit_void' ? '#4c1d95' : '#4ade80'}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>

      {/* Environment-specific floating elements */}
      {template === 'peaceful_garden' && (
        <group>
          <Environment preset="park" />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 5]} intensity={0.8} />
          
          {/* Floating garden elements */}
          {[...Array(5)].map((_, i) => (
            <mesh key={i} position={[
              Math.cos((i / 5) * Math.PI * 2) * 8,
              Math.sin(Date.now() * 0.001 + i) * 2,
              Math.sin((i / 5) * Math.PI * 2) * 8
            ]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      )}
      
      {template === 'memorial_hall' && (
        <group>
          <Environment preset="warehouse" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 25, 5]} intensity={1.2} />
          
          {/* Floating architectural elements */}
          {[...Array(4)].map((_, i) => (
            <mesh key={i} position={[
              (i - 1.5) * 6,
              5 + Math.sin(Date.now() * 0.001 + i) * 1,
              -10 + (i % 2) * 20
            ]}>
              <boxGeometry args={[1, 8, 1]} />
              <meshStandardMaterial color="#8b7355" emissive="#5d4e37" emissiveIntensity={0.1} />
            </mesh>
          ))}
        </group>
      )}
      
      {template === 'starlit_void' && (
        <group>
          <Environment preset="night" />
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 20, 0]} intensity={0.8} color="#8b5cf6" />
          
          {/* Floating cosmic elements */}
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[
              Math.cos((i / 6) * Math.PI * 2) * 12,
              Math.sin(Date.now() * 0.0005 + i) * 3 + 2,
              Math.sin((i / 6) * Math.PI * 2) * 12
            ]} rotation={[0, Date.now() * 0.001, 0]}>
              <octahedronGeometry args={[0.5]} />
              <meshStandardMaterial 
                color="#8b5cf6" 
                emissive="#8b5cf6" 
                emissiveIntensity={0.6}
                transparent
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      )}
      
      {template === 'cozy_living_room' && (
        <group>
          <Environment preset="apartment" />
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 15, 3]} intensity={0.8} />
          
          {/* Floating cozy elements */}
          {[...Array(3)].map((_, i) => (
            <mesh key={i} position={[
              (i - 1) * 5,
              3 + Math.sin(Date.now() * 0.0008 + i) * 1,
              -8
            ]}>
              <boxGeometry args={[2, 1, 2]} />
              <meshStandardMaterial color="#8b4513" emissive="#654321" emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      )}
      
      {template === 'nature_sanctuary' && (
        <group>
          <Environment preset="forest" />
          <ambientLight intensity={0.6} />
          <directionalLight position={[20, 30, 10]} intensity={1} />
          
          {/* Floating nature elements */}
          {[...Array(8)].map((_, i) => (
            <mesh key={i} position={[
              Math.cos((i / 8) * Math.PI * 2) * 10,
              Math.sin(Date.now() * 0.0006 + i) * 2 + 3,
              Math.sin((i / 8) * Math.PI * 2) * 10
            ]}>
              <coneGeometry args={[0.5, 3, 8]} />
              <meshStandardMaterial color="#228b22" emissive="#006400" emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

// Main Memorial Space Builder Component
export function MemorialSpaceBuilder({ spaceId, onClose }: MemorialSpaceBuilderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Core state
  const [memorialSpace, setMemorialSpace] = useState<MemorialSpace | null>(null);
  const [memoryPoints, setMemoryPoints] = useState<MemoryPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MemoryPoint | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showMemoryPointEditor, setShowMemoryPointEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data
  const [templates, setTemplates] = useState<SpaceTemplate[]>([]);
  const [userAssets, setUserAssets] = useState<MemorialAsset[]>([]);
  
  // Editor state
  const [currentTemplate, setCurrentTemplate] = useState('peaceful_garden');
  const [editingPoint, setEditingPoint] = useState<MemoryPoint | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, spaceId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load space templates
      const templatesData = await MemorialSpaceAPI.getSpaceTemplates();
      setTemplates(templatesData);
      
      // Load user assets
      const assetsData = await MemorialSpaceAPI.getUserAssets(user.id);
      setUserAssets(assetsData);
      
      if (spaceId) {
        // Load existing space
        const spaceData = await MemorialSpaceAPI.getMemorialSpace(spaceId);
        if (spaceData) {
          setMemorialSpace(spaceData);
          setCurrentTemplate(spaceData.environment_template);
        }
        
        // Load memory points
        const pointsData = await MemorialSpaceAPI.getMemoryPoints(spaceId);
        setMemoryPoints(pointsData);
      } else {
        // Create new space
        const newSpace = await MemorialSpaceAPI.createMemorialSpace({
          user_id: user.id,
          title: 'New Memorial Space',
          description: '',
          environment_template: 'peaceful_garden',
          space_data: {}
        });
        setMemorialSpace(newSpace);
        navigate(`/memorial-builder/${newSpace.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error loading memorial space data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!memorialSpace) return;
    
    try {
      setIsSaving(true);
      
      await MemorialSpaceAPI.updateMemorialSpace(memorialSpace.id, {
        environment_template: currentTemplate,
        space_data: {
          template: currentTemplate,
          lastModified: new Date().toISOString()
        }
      });
      
      console.log('Memorial space saved successfully');
    } catch (error) {
      console.error('Error saving memorial space:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMemoryPoint = (position: THREE.Vector3) => {
    if (!memorialSpace) return;
    
    const newPoint: Partial<MemoryPoint> = {
      memorial_space_id: memorialSpace.id,
      title: 'New Memory Point',
      description: '',
      position_x: position.x,
      position_y: position.y,
      position_z: position.z,
      point_type: 'text',
      content: { text: 'Click to edit this memory...' }
    };
    
    setEditingPoint(newPoint as MemoryPoint);
    setShowMemoryPointEditor(true);
  };

  const handleEditMemoryPoint = (point: MemoryPoint) => {
    setEditingPoint(point);
    setShowMemoryPointEditor(true);
  };

  const handleCanvasClick = (event: any) => {
    if (!isEditMode) return;
    
    const point = event.point;
    if (point) {
      handleAddMemoryPoint(point);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Loading Memorial Space Builder...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose || (() => navigate(-1))}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Exit Builder
            </button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {memorialSpace?.title || 'Memorial Space Builder'}
              </h1>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isEditMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                {isEditMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditMode ? 'Preview' : 'Edit'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Environment
            </button>
            
            <button
              onClick={() => setShowAssetLibrary(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Assets
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
            >
              <Share className="w-4 h-4" />
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 8, 15], fov: 75 }}>
        <EnvironmentRenderer template={currentTemplate} />
        
        {/* Memory Points */}
        {memoryPoints.map((point) => (
          <MemoryPointObject
            key={point.id}
            memoryPoint={point}
            isSelected={selectedPoint?.id === point.id}
            isEditMode={isEditMode}
            onSelect={setSelectedPoint}
            onEdit={handleEditMemoryPoint}
          />
        ))}
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
          maxDistance={80}
          minDistance={5}
          maxPolarAngle={Math.PI * 0.9}
          minPolarAngle={Math.PI * 0.1}
        />
      </Canvas>

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
          <h3 className="font-semibold mb-2 text-cyan-400">🌟 Edit Mode</h3>
          <ul className="text-sm space-y-1 text-white/80">
            <li>• Click anywhere in the space to add memory points</li>
            <li>• Click existing orbs to edit their content</li>
            <li>• Use mouse to orbit around the 3D space</li>
            <li>• Scroll to zoom in and out</li>
          </ul>
        </div>
      )}

      {/* Preview Mode Instructions */}
      {!isEditMode && (
        <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white border border-white/20">
          <h3 className="font-semibold mb-2 text-green-400">👁️ Preview Mode</h3>
          <ul className="text-sm space-y-1 text-white/80">
            <li>• Click glowing orbs to view memories</li>
            <li>• Navigate freely through the 3D space</li>
            <li>• Experience the memorial as visitors would</li>
          </ul>
        </div>
      )}

      {/* Modals and Overlays */}
      <AnimatePresence>
        {showTemplateSelector && (
          <TemplateSelector
            templates={templates}
            currentTemplate={currentTemplate}
            onSelectTemplate={(template) => {
              setCurrentTemplate(template);
              setShowTemplateSelector(false);
            }}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
        
        {showAssetLibrary && (
          <AssetLibrary
            userAssets={userAssets}
            onUploadAsset={async (file, type) => {
              // Handle asset upload
              console.log('Uploading asset:', file, type);
              setShowAssetLibrary(false);
            }}
            onClose={() => setShowAssetLibrary(false)}
          />
        )}
        
        {showMemoryPointEditor && editingPoint && (
          <MemoryPointEditor
            memoryPoint={editingPoint}
            onSave={async (point) => {
              if (point.id) {
                // Update existing point
                const updated = await MemorialSpaceAPI.updateMemoryPoint(point.id, point);
                setMemoryPoints(prev => prev.map(p => p.id === point.id ? updated : p));
              } else {
                // Create new point
                const created = await MemorialSpaceAPI.createMemoryPoint(point);
                setMemoryPoints(prev => [...prev, created]);
              }
              setShowMemoryPointEditor(false);
              setEditingPoint(null);
            }}
            onDelete={async (pointId) => {
              if (pointId) {
                await MemorialSpaceAPI.deleteMemoryPoint(pointId);
                setMemoryPoints(prev => prev.filter(p => p.id !== pointId));
              }
              setShowMemoryPointEditor(false);
              setEditingPoint(null);
            }}
            onClose={() => {
              setShowMemoryPointEditor(false);
              setEditingPoint(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Template Selector Component
function TemplateSelector({ 
  templates, 
  currentTemplate, 
  onSelectTemplate, 
  onClose 
}: {
  templates: SpaceTemplate[];
  currentTemplate: string;
  onSelectTemplate: (template: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Choose 3D Environment</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.name.toLowerCase().replace(/ /g, '_'))}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                currentTemplate === template.name.toLowerCase().replace(/ /g, '_')
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
            >
              <div className="w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded mb-3 flex items-center justify-center">
                <div className="text-4xl">
                  {template.name.includes('Garden') && '🌺'}
                  {template.name.includes('Hall') && '🏛️'}
                  {template.name.includes('Void') && '✨'}
                  {template.name.includes('Room') && '🏠'}
                  {template.name.includes('Sanctuary') && '🌲'}
                </div>
              </div>
              <h3 className="font-semibold text-white mb-2">{template.name}</h3>
              <p className="text-white/70 text-sm">{template.description}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Asset Library Component
function AssetLibrary({ 
  userAssets, 
  onUploadAsset, 
  onClose 
}: {
  userAssets: MemorialAsset[];
  onUploadAsset: (file: File, type: string) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' :
                   file.type.startsWith('audio/') ? 'audio' : 'model';
      onUploadAsset(file, type);
    }
    event.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Asset Library</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Asset
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,image/*,video/*,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userAssets.map((asset) => (
            <div key={asset.id} className="bg-white/5 rounded-lg p-3">
              <div className="w-full h-20 bg-white/10 rounded mb-2 flex items-center justify-center">
                {asset.asset_type === 'image' && <Image className="w-8 h-8 text-white/60" />}
                {asset.asset_type === 'video' && <Video className="w-8 h-8 text-white/60" />}
                {asset.asset_type === 'audio' && <Volume2 className="w-8 h-8 text-white/60" />}
                {asset.asset_type === 'model' && <Box className="w-8 h-8 text-white/60" />}
              </div>
              <h4 className="text-white text-sm font-medium truncate">{asset.asset_name}</h4>
              <p className="text-white/60 text-xs">{asset.asset_type}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Memory Point Editor Component
function MemoryPointEditor({ 
  memoryPoint, 
  onSave, 
  onDelete, 
  onClose 
}: {
  memoryPoint: MemoryPoint;
  onSave: (point: MemoryPoint) => void;
  onDelete: (pointId?: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(memoryPoint.title);
  const [description, setDescription] = useState(memoryPoint.description || '');
  const [pointType, setPointType] = useState(memoryPoint.point_type);
  const [content, setContent] = useState(memoryPoint.content || {});

  const handleSave = () => {
    onSave({
      ...memoryPoint,
      title,
      description,
      point_type: pointType,
      content
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {memoryPoint.id ? 'Edit Memory Point' : 'New Memory Point'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              placeholder="Enter title..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white h-20 resize-none"
              placeholder="Enter description..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-2">Type</label>
            <select
              value={pointType}
              onChange={(e) => setPointType(e.target.value as any)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            >
              <option value="text">📝 Text Memory</option>
              <option value="voice">🎤 Voice Recording</option>
              <option value="photo">📷 Photo</option>
              <option value="video">🎬 Video</option>
              <option value="model">🎭 3D Model</option>
            </select>
          </div>
          
          {pointType === 'text' && (
            <div>
              <label className="block text-sm text-white/70 mb-2">Memory Content</label>
              <textarea
                value={content.text || ''}
                onChange={(e) => setContent({ ...content, text: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white h-24 resize-none"
                placeholder="Share your memory, story, or message..."
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
            >
              Save Memory
            </button>
            {memoryPoint.id && (
              <button
                onClick={() => onDelete(memoryPoint.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}