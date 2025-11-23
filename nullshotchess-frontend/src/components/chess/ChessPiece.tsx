import { useRef } from 'react';
import { Group } from 'three';

interface ChessPieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  position: [number, number, number];
}

const ChessPiece = ({ type, color, position }: ChessPieceProps) => {
  const groupRef = useRef<Group>(null);
  const pieceColor = color === 'w' ? '#E8D5B7' : '#1A1A1A';
  
  // Simplified piece geometries (in production, load GLTF models)
  const renderPiece = () => {
    switch (type) {
      case 'p': // Pawn
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.2, 0.25, 0.8, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.4} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.4} roughness={0.6} />
            </mesh>
          </group>
        );
      
      case 'n': // Knight
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.25, 0.3, 1, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
              <boxGeometry args={[0.3, 0.5, 0.3]} />
              <meshStandardMaterial color={pieceColor} metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
        );
      
      case 'b': // Bishop
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.25, 0.3, 1.2, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 1, 0]} castShadow>
              <coneGeometry args={[0.1, 0.3, 8]} />
              <meshStandardMaterial color={pieceColor} metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
        );
      
      case 'r': // Rook
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 1, 4]} />
              <meshStandardMaterial color={pieceColor} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow>
              <boxGeometry args={[0.5, 0.3, 0.5]} />
              <meshStandardMaterial color={pieceColor} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        );
      
      case 'q': // Queen
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 1.3, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow>
              <coneGeometry args={[0.35, 0.6, 8]} />
              <meshStandardMaterial color={pieceColor} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.3, 0]} castShadow>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );
      
      case 'k': // King
        return (
          <group>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 1.4, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1, 0]} castShadow>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={pieceColor} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[0.1, 0.5, 0.1]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.1, 0.3, 0.1]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} position={position}>
      {renderPiece()}
    </group>
  );
};

export default ChessPiece;
