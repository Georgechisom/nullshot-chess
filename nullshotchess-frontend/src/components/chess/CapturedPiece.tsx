import { useRef, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import ChessPiece from './ChessPiece';

interface CapturedPieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  position: [number, number, number];
  index: number;
}

const CapturedPiece = ({ type, color, position, index }: CapturedPieceProps) => {
  const groupRef = useRef<Group>(null);
  const animationRef = useRef({ startY: 10, currentY: 10, falling: true, time: 0 });

  useEffect(() => {
    // Reset animation when index changes (new capture)
    animationRef.current = { startY: 10, currentY: 10, falling: true, time: 0 };
  }, [index]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const anim = animationRef.current;
    
    if (anim.falling) {
      anim.time += delta;
      
      // Falling animation with bounce
      const fallSpeed = 8;
      const gravity = 0.5;
      anim.currentY -= fallSpeed * delta + gravity * anim.time * delta;
      
      // Bounce when hitting target position
      if (anim.currentY <= position[1]) {
        anim.currentY = position[1];
        anim.falling = false;
        
        // Small bounce effect
        groupRef.current.position.y = position[1] + 0.2;
        setTimeout(() => {
          if (groupRef.current) {
            groupRef.current.position.y = position[1];
          }
        }, 100);
      } else {
        groupRef.current.position.y = anim.currentY;
      }
      
      // Add rotation during fall
      groupRef.current.rotation.x = anim.time * 2;
      groupRef.current.rotation.z = anim.time * 1.5;
    } else {
      // Idle subtle animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <ChessPiece
        type={type}
        color={color}
        position={[0, 0, 0]}
      />
    </group>
  );
};

export default CapturedPiece;
