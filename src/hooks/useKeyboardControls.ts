import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Matrix4 } from 'three';

export function useKeyboardControls(speed = 0.1) {
  const { camera } = useThree();
  const moveDirection = useRef(new Vector3());
  const tempVector = useRef(new Vector3());
  const tempMatrix = useRef(new Matrix4());

  useEffect(() => {
    const keys = new Set();

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };

    const updateCamera = () => {
      moveDirection.current.set(0, 0, 0);
      
      // Get movement input
      if (keys.has('a') || keys.has('arrowleft')) moveDirection.current.x = -1;
      if (keys.has('d') || keys.has('arrowright')) moveDirection.current.x = 1;
      if (keys.has('w') || keys.has('arrowup')) moveDirection.current.z = -1;
      if (keys.has('s') || keys.has('arrowdown')) moveDirection.current.z = 1;

      if (moveDirection.current.length() > 0) {
        moveDirection.current.normalize();
        moveDirection.current.multiplyScalar(speed);

        // Get the camera's rotation matrix (but ignore vertical rotation)
        tempMatrix.current.makeRotationY(camera.rotation.y);
        
        // Transform the movement direction by the camera's rotation
        tempVector.current.copy(moveDirection.current)
          .applyMatrix4(tempMatrix.current);

        // Apply the transformed movement
        camera.position.add(tempVector.current);
      }

      requestAnimationFrame(updateCamera);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const animationFrame = requestAnimationFrame(updateCamera);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrame);
    };
  }, [camera, speed]);
}