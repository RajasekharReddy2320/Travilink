import { useEffect, useState } from 'react';
import { Plane, Luggage, MapPin, Compass, Camera, Globe, Ticket, Map } from 'lucide-react';

interface Particle {
  id: number;
  Icon: React.ElementType;
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  direction: 'left' | 'right';
  opacity: number;
  rotation: number;
  color: string;
}

const icons = [Plane, Luggage, MapPin, Compass, Camera, Globe, Ticket, Map];
const colors = [
  'text-pink-400',
  'text-cyan-400',
  'text-purple-400',
  'text-amber-400',
  'text-emerald-400',
  'text-blue-400',
  'text-rose-400',
  'text-indigo-400',
];

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          Icon: icons[Math.floor(Math.random() * icons.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 16 + Math.random() * 24,
          speed: 15 + Math.random() * 25,
          delay: Math.random() * 10,
          direction: Math.random() > 0.5 ? 'left' : 'right',
          opacity: 0.15 + Math.random() * 0.25,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${particle.color}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animation: `float-${particle.direction} ${particle.speed}s linear infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          <particle.Icon
            size={particle.size}
            style={{
              transform: `rotate(${particle.rotation}deg)`,
              filter: 'drop-shadow(0 0 10px currentColor)',
            }}
          />
        </div>
      ))}
      
      <style>{`
        @keyframes float-left {
          0% {
            transform: translateX(100vw) translateY(0) rotate(0deg);
          }
          100% {
            transform: translateX(-100px) translateY(-50px) rotate(360deg);
          }
        }
        
        @keyframes float-right {
          0% {
            transform: translateX(-100px) translateY(0) rotate(0deg);
          }
          100% {
            transform: translateX(100vw) translateY(50px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingParticles;
