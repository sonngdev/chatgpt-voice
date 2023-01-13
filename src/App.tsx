import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import { GitHub, Settings, Plus } from 'react-feather';
import Button from './design_system/Button';

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
          parentMessageId:
            conversationRef.current.currentMessageId || undefined,
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
      <div>
        This browser doesn't support speech recognition. Please use Chrome.
      </div>
    );
  }

  return (
    <div className="px-8 py-9 flex flex-col h-screen">
      <header>
        <h1 className="font-title text-3xl text-center">
          ChatGPT
          <br />
          With Voice
          <div className="inline-block w-4 h-7 ml-2 align-middle bg-dark animate-blink" />
        </h1>
        <div className="mt-4 flex justify-center">
          <a href="https://github.com/thanhsonng/chatgpt-voice">
            <GitHub strokeWidth={1} />
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div>Transcript: {transcript}</div>
        {answer && <div>Answer: {answer}</div>}
      </main>

      <div>
        <div className="flex justify-center items-center gap-x-8">
          <Button>
            <Settings strokeWidth={1} />
          </Button>
          <button type="button" onClick={recognizeSpeech}>
            Talk
          </button>
          <Button>
            <Plus strokeWidth={1} />
          </Button>
        </div>

        {!isMicrophoneAvailable && (
          <div>Please allow microphone permission for this app to work</div>
        )}

        {isListening && <div>Listening...</div>}

        {isProcessing && <div>Processing...</div>}
      </div>
    </div>
  );
}

export default App;
