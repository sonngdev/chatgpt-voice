import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

function App() {
  const {
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    transcript,
    listening,
  } = useSpeechRecognition();

  const recognizeSpeech = () => {
    SpeechRecognition.startListening();
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div>This browser doesn't support speech recognition. Please use Chrome.</div>
    )
  }

  return (
    <div>
      {!isMicrophoneAvailable && (
        <div>Please allow microphone permission for this app to work</div>
      )}

      <button type="button" onClick={recognizeSpeech}>Talk</button>

      {listening && (
        <div>Listening...</div>
      )}

      <div>Transcript: {transcript}</div>
    </div>
  );
}

export default App
