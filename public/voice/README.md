# Custom Voice for Hemix AI

Place your voice sample file here as `voice-sample.mp3` (or `.wav`).

This file can be used with a custom TTS provider (like ElevenLabs) to clone
the voice and use it for Hemix's speech output.

Currently, Hemix uses the browser's built-in SpeechSynthesis with the best
available natural voice. To enable custom voice cloning, you would need to:

1. Sign up for a TTS service that supports voice cloning (e.g., ElevenLabs)
2. Add the API key to your environment variables
3. Upload this voice sample to the TTS service
4. Configure the voice ID in the Hemix settings

Without a custom TTS API configured, Hemix will automatically use the best
available system voice (preferring Google US English, then natural voices).
