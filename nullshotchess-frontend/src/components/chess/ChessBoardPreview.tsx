import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

const ChessBoardPreview = () => {
  const boardRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (boardRef.current) {
      // Gentle floating animation
      boardRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Chessboard base */}
      <mesh ref={boardRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[8, 8, 0.5]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>

      {/* Chess squares */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const isLight = (row + col) % 2 === 0;
          return (
            <mesh
              key={`${row}-${col}`}
              position={[col - 3.5, 0.26, row - 3.5]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.95, 0.95]} />
              <meshStandardMaterial 
                color={isLight ? "#E8D5B7" : "#8B4513"} 
                metalness={0.2}
                roughness={0.8}
              />
            </mesh>
          );
        })
      )}

      {/* Sample chess pieces (simplified for preview) */}
      {/* King */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1.5, 16]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Queen */}
      <mesh position={[1.5, 1, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1.3, 16]} />
        <meshStandardMaterial color="#E8D5B7" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[1.5, 1.7, 0]}>
        <coneGeometry args={[0.3, 0.5, 8]} />
        <meshStandardMaterial color="#E8D5B7" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Rook */}
      <mesh position={[-1.5, 0.8, 1]}>
        <cylinderGeometry args={[0.35, 0.35, 1.2, 4]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Bishop */}
      <mesh position={[2.5, 0.9, -1]}>
        <cylinderGeometry args={[0.25, 0.35, 1.4, 16]} />
        <meshStandardMaterial color="#E8D5B7" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[2.5, 1.5, -1]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#E8D5B7" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Pawns */}
      {[-3, -2, 2, 3].map((x) => (
        <mesh key={`pawn-${x}`} position={[x, 0.5, 2]}>
          <cylinderGeometry args={[0.2, 0.25, 0.8, 16]} />
          <meshStandardMaterial color={x < 0 ? "#1A1A1A" : "#E8D5B7"} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Ambient glow effect */}
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#50C878" distance={15} />
    </group>
  );
};

export default ChessBoardPreview;
