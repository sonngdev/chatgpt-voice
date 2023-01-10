import { useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

interface CreateChatGPTMessageResponse {
  answer: string;
  conversationId: string;
  messageId: string;
}

function App() {
  const {
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    transcript,
    listening: isListening,
    finalTranscript,
  } = useSpeechRecognition();
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const conversationRef = useRef({ id: '', currentMessageId: '' });

  const recognizeSpeech = () => {
    SpeechRecognition.startListening();
  };

  useEffect(() => {
    if (finalTranscript) {
      setIsProcessing(true);

      fetch('http://localhost:8000/chatgpt/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: finalTranscript,
          conversationId: conversationRef.current.id || undefined,
          parentMessageId: conversationRef.current.currentMessageId || undefined,
        }),
      })
        .then((res) => res.json())
        .then((res: CreateChatGPTMessageResponse) => {
          setAnswer(res.answer);
          conversationRef.current.id = res.conversationId;
          conversationRef.current.currentMessageId = res.messageId;

          const utterance = new SpeechSynthesisUtterance(res.answer);
          window.speechSynthesis.speak(utterance);
        })
        .finally(() => {
          setIsProcessing(false);
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

      {isListening && (
        <div>Listening...</div>
      )}

      <div>Transcript: {transcript}</div>

      {isProcessing && (
        <div>Processing...</div>
      )}

      {answer && (
        <div>Answer: {answer}</div>
      )}
    </div>
  );
}

export default App
