import SpeechRecognition from 'react-speech-recognition';

interface SpeakOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
}

class VoiceManager {
  private isAutoplayEnabled = false;

  enableAutoplay() {
    if (!this.isAutoplayEnabled) {
      this.speak('');
      this.isAutoplayEnabled = true;
    }
  }

  startListening() {
    window.speechSynthesis.cancel();
    SpeechRecognition.startListening();
  }

  stopListening() {
    SpeechRecognition.stopListening();
  }

  speak(text: string, options: SpeakOptions | undefined = undefined) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (options?.voice) {
      utterance.voice = options.voice;
    }
    if (options?.rate) {
      utterance.rate = options.rate;
    }
    window.speechSynthesis.speak(utterance);
  }

  idle() {
    window.speechSynthesis.cancel();
    SpeechRecognition.abortListening();
  }
}

const Voice = new VoiceManager();

export default Voice;
