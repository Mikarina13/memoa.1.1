import { useEffect, useState, FormEvent, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModelViewer } from '../components/ModelViewer';
import { Stars } from '../components/Stars';
import { supabase } from '../lib/supabase';
import { Vector3 } from 'three';
import { Model } from '../App';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from '../components/AuthForm';
import { Footer } from '../components/Footer';
import { 
  ANIMATION_DURATION_VERY_LONG, 
  CAMERA_POSITION_MEMENTO,
  CAMERA_FOV_DEFAULT,
  easeOutQuart 
} from '../utils/constants';

function MementoCameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    const startPosition = new Vector3(0, 0, 25);
    const endPosition = new Vector3(...CAMERA_POSITION_MEMENTO);
    const startTime = Date.now();
    const duration = ANIMATION_DURATION_VERY_LONG;

    camera.position.copy(startPosition);

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quart for smoother animation
      const easeProgress = easeOutQuart(progress);
      
      camera.position.lerpVectors(startPosition, endPosition, easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }, [camera]);

  return null;
}

export function MementoPage() {
  const navigate = useNavigate();
  const { user, loading, initialized, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth form state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    document.title = 'MEMENTO';
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setFormLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Please check your email to confirm your account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  // Show loading while checking authentication
  if (loading || !initialized) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
        <span className="ml-2 text-white">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-screen bg-black relative"
      >
        <div className="fixed top-8 left-8 z-50 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-[Orbitron]"
          >
            <ArrowLeft className="w-6 h-6" />
            Return
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-[Orbitron]"
          >
            <LogOut className="w-6 h-6" />
            Logout
          </button>
        </div>

        <Canvas camera={{ position: CAMERA_POSITION_MEMENTO, fov: CAMERA_FOV_DEFAULT }}>
          <MementoCameraController />
          <motion.group
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <Model 
              position={[-4, -1, 0]}
              modelPath="/models/Celestial Starburst 0604191449 texture.glb"
              text="Explore"
              description="Discover other Profile"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Celestial Starburst 0604191449 texture.glb",
                  modelText: "Explore"
                }
              })}
              initialRotation={[0, Math.PI / 2, 0]}
            />
            <Model 
              position={[0, -1, 0]}
              modelPath="/models/Stellar Heart Glow 0604140148 texture (1).glb"
              text="Favorite"
              description="Saved for easy access"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Stellar Heart Glow 0604140148 texture (1).glb",
                  modelText: "Favorite"
                }
              })}
              initialRotation={[0, 0, 0]}
            />
            <Model 
              position={[4, -1, 0]}
              modelPath="/models/Woven Reflections 0609195756 texture.glb"
              text="Self"
              description="View your personal space"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Woven Reflections 0609195756 texture.glb",
                  modelText: "Self"
                }
              })}
              initialRotation={[0, 0, 0]}
            />
          </motion.group>
          <Stars />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            target={[0, 0, 0]}
            minDistance={8}
            maxDistance={25}
          />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
        </Canvas>
        
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-black relative"
    >
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-50 font-[Orbitron]"
      >
        <ArrowLeft className="w-6 h-6" />
        Return
      </button>

      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <AuthForm
          isLogin={isLogin}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmit}
          onGoogleSignIn={handleGoogleSignIn}
          loading={formLoading}
          error={error}
          onToggleLogin={setIsLogin}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onShowPasswordToggle={() => setShowPassword(!showPassword)}
          onShowConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </div>

      <Canvas camera={{ position: CAMERA_POSITION_MEMENTO, fov: CAMERA_FOV_DEFAULT }}>
        <Suspense fallback={null}>
          <MementoCameraController />
          <motion.group
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <Model 
              position={[-4, -1, 0]}
              modelPath="/models/Celestial Starburst 0604191449 texture.glb"
              text="Explore"
              description="Discover other Profile"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Celestial Starburst 0604191449 texture.glb",
                  modelText: "Explore"
                }
              })}
              initialRotation={[0, Math.PI / 2, 0]}
            />
            <Model 
              position={[0, -1, 0]}
              modelPath="/models/Stellar Heart Glow 0604140148 texture (1).glb"
              text="Favorite"
              description="Saved for easy access"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Stellar Heart Glow 0604140148 texture (1).glb",
                  modelText: "Favorite"
                }
              })}
              initialRotation={[0, 0, 0]}
            />
            <Model 
              position={[4, -1, 0]}
              modelPath="/models/Woven Reflections 0609195756 texture.glb"
              text="Self"
              description="View your personal space"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Woven Reflections 0609195756 texture.glb",
                  modelText: "Self"
                }
              })}
              initialRotation={[0, 0, 0]}
            />
          </motion.group>
          <Stars />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            target={[0, 0, 0]}
            minDistance={8}
            maxDistance={25}
          />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
        </Suspense>
      </Canvas>
      
      <Footer />
    </motion.div>
  );
}