import { useState, useRef, useCallback, useEffect } from 'react';

type SoundType = 'hoe' | 'plant' | 'water' | 'success';

interface UseAudioReturn {
  playMusic: () => void;
  stopMusic: () => void;
  playSound: (sound: SoundType) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useAudio(): UseAudioReturn {
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    musicRef.current = new Audio('/farm-assets/audio/music.mp3');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;
    
    return () => {
      musicRef.current?.pause();
      musicRef.current = null;
    };
  }, []);

  const playMusic = useCallback(() => {
    if (!isMuted && musicRef.current) {
      musicRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, []);

  const playSound = useCallback((sound: SoundType) => {
    if (isMuted) return;
    
    const extension = sound === 'water' ? 'mp3' : 'wav';
    const audio = new Audio(`/farm-assets/audio/${sound}.${extension}`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted && musicRef.current) {
        musicRef.current.pause();
      } else if (!newMuted && musicRef.current) {
        musicRef.current.play().catch(() => {});
      }
      return newMuted;
    });
  }, []);

  return { playMusic, stopMusic, playSound, isMuted, toggleMute };
}
