import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

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

  const respondToUser = useCallback((response: string) => {
    setAnswer(response);
    const utterance = new SpeechSynthesisUtterance(response);
    window.speechSynthesis.speak(utterance);
  }, []);

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
          conversationRef.current.id = res.conversationId;
          conversationRef.current.currentMessageId = res.messageId;
          respondToUser(res.answer);
        })
        .catch((err: unknown) => {
          console.warn(err);
          respondToUser('Failed to get the response, please try again');
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [finalTranscript, respondToUser]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div>This browser doesn't support speech recognition. Please use Chrome.</div>
    )
  }

  return (
    <div className="p-8">
      <header>
        <h1 className="font-title text-3xl text-center">
          ChatGPT<br />
          With Voice
          <div className='inline-block w-4 h-7 ml-2 align-middle bg-dark animate-blink' />
        </h1>

      </header>

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
