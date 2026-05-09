export type ElevenLabsVoice = {
  id: string;
  name: string;
  description?: string;
};

export type ElevenLabsSpeechResult = {
  requestId: string;
  audioUrl: string;
};

export type ElevenLabsTranscriptionResult = {
  requestId: string;
  text: string;
  language?: string;
};

export type ElevenLabsSoundEffectResult = {
  requestId: string;
  audioUrl: string;
  durationSeconds?: number;
};

export type ElevenLabsMusicResult = {
  requestId: string;
  audioUrl: string;
  style?: string;
};

export type ElevenLabsDubResult = {
  requestId: string;
  audioUrl: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export type ElevenLabsAgentDeployment = {
  requestId: string;
  agentId: string;
  status: 'queued' | 'deployed';
};

const DUMMY_AUDIO_URL = 'https://example.com/dummy-audio.mp3';

/**
 * Dummy ElevenLabs integration placeholder.
 * This service is intentionally not wired into any routes or runtime code.
 */
export class ElevenLabsService {
  async generateSpeech(prompt: string, voiceId?: string): Promise<ElevenLabsSpeechResult> {
    return {
      requestId: `dummy-speech-${Date.now()}`,
      audioUrl: DUMMY_AUDIO_URL,
    };
  }

  async transcribeSpeech(audioUrl: string): Promise<ElevenLabsTranscriptionResult> {
    return {
      requestId: `dummy-transcribe-${Date.now()}`,
      text: `Transcription placeholder for ${audioUrl}`,
      language: 'en',
    };
  }

  async composeMusic(prompt: string): Promise<ElevenLabsMusicResult> {
    return {
      requestId: `dummy-music-${Date.now()}`,
      audioUrl: DUMMY_AUDIO_URL,
      style: 'ambient',
    };
  }

  async createSoundEffects(prompt: string): Promise<ElevenLabsSoundEffectResult> {
    return {
      requestId: `dummy-sfx-${Date.now()}`,
      audioUrl: DUMMY_AUDIO_URL,
      durationSeconds: 2,
    };
  }

  async dubAudio(audioUrl: string, targetLanguage: string): Promise<ElevenLabsDubResult> {
    return {
      requestId: `dummy-dub-${Date.now()}`,
      audioUrl: DUMMY_AUDIO_URL,
      sourceLanguage: 'en',
      targetLanguage,
    };
  }

  async createVoice(name: string, description?: string): Promise<ElevenLabsVoice> {
    const voice: ElevenLabsVoice = {
      id: `dummy-voice-${Date.now()}`,
      name,
    };

    if (description) {
      voice.description = description;
    }

    return voice;
  }

  async deployAgent(agentName: string): Promise<ElevenLabsAgentDeployment> {
    return {
      requestId: `dummy-agent-${Date.now()}`,
      agentId: `agent-${agentName.toLowerCase().replace(/\s+/g, '-')}`,
      status: 'queued',
    };
  }
}
