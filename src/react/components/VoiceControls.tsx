"use client";

import React from "react";
import { Mic, StopCircle, Volume2, VolumeX } from "lucide-react";

interface VoiceControlsProps {
  isRecording: boolean;
  isPlaybackActive: boolean;
  onToggleRecording: () => void;
  onTogglePlayback: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isRecording,
  isPlaybackActive,
  onToggleRecording,
  onTogglePlayback,
}) => {
  return (
    <div className="voice-controls flex gap-2">
      <button className="btn mic" onClick={onToggleRecording}>
        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
      </button>
      <button className="btn playback" onClick={onTogglePlayback}>
        {isPlaybackActive ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};
