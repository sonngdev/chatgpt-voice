import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import { GitHub, Settings, Plus, Mic, Info } from 'react-feather';
import Button from './design_system/Button';
import Message from './Message';

interface CreateChatGPTMessageResponse {
  answer: string;
  conversationId: string;
  messageId: string;
}

interface Message {
  type: 'prompt' | 'response';
  text: string;
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
  const [messages, setMessages] = useState<Message[]>([
    { type: 'prompt', text: 'Where is the Empire State Building?' },
    {
      type: 'response',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet elementum quam. Mauris sit amet tincidunt lacus. Quisque nec commodo ante. Duis ullamcorper suscipit lacus, a feugiat mauris. Integer rhoncus erat consequat nisi cursus porttitor.',
    },
  ]);
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
    <div className="px-8 py-9 flex flex-col h-screen gap-y-4">
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

      <main className="flex-1 flex flex-col gap-y-4 overflow-y-auto">
        {messages.map(({ type, text }) => (
          <Message type={type} text={text} />
        ))}
        {isListening && <Message type="prompt" text={transcript} />}
        {answer && <div>Answer: {answer}</div>}
      </main>

      <div>
        <div className="flex gap-x-3 mb-6">
          <div className="shrink-0">
            <Info strokeWidth={1} />
          </div>
          <div>
            Run a local server on Desktop to see this works.{' '}
            <a className="underline">It's easy</a>.
          </div>
        </div>

        <div className="flex justify-center items-center gap-x-8">
          <Button>
            <Settings strokeWidth={1} />
          </Button>

          <button
            type="button"
            className="w-16 h-16 bg-dark text-light flex justify-center items-center rounded-full"
            onClick={recognizeSpeech}
          >
            <Mic strokeWidth={1} size={32} />
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
