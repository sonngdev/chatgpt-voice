import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

interface CreateChatGPTMessageResponse {
  answer: string;
}

function App() {
  const {
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    transcript,
    listening,
    finalTranscript,
  } = useSpeechRecognition();
  const [answer, setAnswer] = useState('');

  const recognizeSpeech = () => {
    SpeechRecognition.startListening();
  };

  useEffect(() => {
    if (finalTranscript) {
      fetch('http://localhost:8000/chatgpt/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: finalTranscript }),
      })
        .then((res) => res.json())
        .then((res: CreateChatGPTMessageResponse) => {
          setAnswer(res.answer);
          const utterance = new SpeechSynthesisUtterance(res.answer);
          window.speechSynthesis.speak(utterance);
        });
    }
  }, [finalTranscript]);

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

      {answer && (
        <div>Answer: {answer}</div>
      )}
    </div>
  );
}

export default App
