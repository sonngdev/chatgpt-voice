import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import {
  GitHub,
  Settings,
  FilePlus,
  Mic,
  Info,
  Activity,
  Loader,
  AlertTriangle,
  X,
} from 'react-feather';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { isDesktop } from 'react-device-detect';

import Button from './design_system/Button';
import SyntaxHighlighter from './design_system/SyntaxHighlighter';
import Message from './Message';
import './App.css';

interface CreateChatGPTMessageResponse {
  answer: string;
  conversationId: string;
  messageId: string;
}

interface Message {
  type: 'prompt' | 'response';
  text: string;
}

const initialMessages: Message[] = [
  { type: 'response', text: 'Try speaking to the microphone.' },
];

function App() {
  const {
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    transcript,
    listening: isListening,
    finalTranscript,
  } = useSpeechRecognition();
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [areSettingsOpen, setAreSettingsOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(isDesktop);
  const [isServerSetUp, setIsServerSetUp] = useState(isDesktop);
  const abortRef = useRef<AbortController | null>(null);
  const conversationRef = useRef({ id: '', currentMessageId: '' });
  const bottomDivRef = useRef<HTMLDivElement>(null);

  const recognizeSpeech = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      window.speechSynthesis.cancel();
      SpeechRecognition.startListening();
    }
  };

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  const resetConversation = () => {
    setIsProcessing(false);
    setMessages(initialMessages);
    conversationRef.current = { id: '', currentMessageId: '' };

    window.speechSynthesis.cancel();
    SpeechRecognition.abortListening();
    abortRef.current?.abort();
  };

  // Scroll to bottom when user is speaking a prompt
  useEffect(() => {
    if (isListening) {
      bottomDivRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isListening]);

  // Scroll to bottom when there is a new response
  useEffect(() => {
    bottomDivRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (finalTranscript) {
      setMessages((oldMessages) => [
        ...oldMessages,
        { type: 'prompt', text: finalTranscript },
      ]);
      setIsProcessing(true);
      setIsServerSetUp(true);

      abortRef.current = new AbortController();
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
        signal: abortRef.current.signal,
      })
        .then((res) => res.json())
        .then((res: CreateChatGPTMessageResponse) => {
          conversationRef.current.id = res.conversationId;
          conversationRef.current.currentMessageId = res.messageId;
          setMessages((oldMessages) => [
            ...oldMessages,
            { type: 'response', text: res.answer },
          ]);
          speak(res.answer);
        })
        .catch((err: unknown) => {
          console.warn(err);
          let response: string;

          // Connection refused
          if (err instanceof TypeError) {
            response =
              'Local server needs to be set up first. Click on the Settings button to see how.';
            setIsServerSetUp(false);
          } else {
            response = 'Failed to get the response, please try again.';
          }
          setMessages((oldMessages) => [
            ...oldMessages,
            { type: 'response', text: response },
          ]);
          speak(response);
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [finalTranscript, speak]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div>
        This browser doesn't support speech recognition. Please use Chrome.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-9 flex flex-col h-screen gap-y-4 lg:px-28 lg:py-12 lg:relative">
      <header className="flex flex-col items-center lg:flex-row lg:justify-between">
        {/* w-64 so text will break after ChatGPT */}
        <h1 className="font-title text-3xl text-center w-64 lg:w-auto">
          ChatGPT With Voice
          <div className="inline-block w-4 h-7 ml-2 align-middle bg-dark/40 animate-blink" />
        </h1>
        <div className="mt-4 flex justify-center">
          <a href="https://github.com/thanhsonng/chatgpt-voice" target="_blank">
            <GitHub strokeWidth={1} />
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-y-4 overflow-y-auto lg:mr-80 lg:gap-y-8">
        {messages.map(({ type, text }, index) => {
          const getIsActive = () => {
            if (isListening) {
              return false;
            }
            if (type === 'prompt') {
              return (
                index === messages.length - 1 || index === messages.length - 2
              );
            }
            if (type === 'response') {
              return index === messages.length - 1;
            }
            return false;
          };
          return (
            <Message
              key={text}
              type={type}
              text={text}
              isActive={getIsActive()}
              onClick={speak}
            />
          );
        })}
        {isListening && <Message type="prompt" text={transcript} isActive />}
        <div ref={bottomDivRef} />
      </main>

      <div>
        <div className="lg:absolute lg:right-28 lg:bottom-12 lg:w-72">
          {!isMicrophoneAvailable ? (
            <div className="flex gap-x-3 mb-6 text-red-700">
              <div className="shrink-0">
                <AlertTriangle strokeWidth={1} />
              </div>
              <div>
                Please allow microphone permission for this app to work
                properly.
              </div>
            </div>
          ) : !isServerSetUp ? (
            <div className="flex gap-x-3 mb-6">
              <div className="shrink-0">
                <Info strokeWidth={1} />
              </div>
              <div>
                Run a local server on Desktop to see this works.{' '}
                <a onClick={() => setAreSettingsOpen(true)}>It's easy</a>.
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-center items-center gap-x-8 lg:flex-col lg:gap-y-8 lg:absolute lg:top-1/2 lg:right-28 lg:-translate-y-1/2">
          <div>
            {/**
             * We want a tooltip that positions itself against the Settings button.
             * However, we don't want the tooltip to display each time we hover on it.
             * So, an invisible div that is right on top of the Settings button is
             * used here as the tooltip's target.
             */}
            <Tooltip.Provider delayDuration={0}>
              <Tooltip.Root
                open={isTooltipVisible}
                onOpenChange={setIsTooltipVisible}
              >
                <Tooltip.Trigger asChild>
                  <div />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="rounded-md px-4 py-3 bg-light border border-dark shadow-solid select-none animate-fade-in"
                    sideOffset={5}
                    align="end"
                  >
                    Set up local server first.
                    <Tooltip.Arrow className="fill-light relative -top-px" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            <Button
              aria-label="Settings"
              onClick={() => setAreSettingsOpen(true)}
            >
              <Settings strokeWidth={1} />
            </Button>
          </div>

          <button
            type="button"
            className={`w-16 h-16 ${
              isListening
                ? 'bg-accent1'
                : isProcessing
                ? 'bg-accent2'
                : 'bg-dark'
            } text-light flex justify-center items-center rounded-full transition-all hover:opacity-80`}
            onClick={recognizeSpeech}
            disabled={isProcessing}
            aria-label={
              isListening
                ? 'Listening'
                : isProcessing
                ? 'Processing'
                : 'Start speaking'
            }
          >
            {isListening ? (
              <div className="animate-blink">
                <Activity strokeWidth={1} size={32} />
              </div>
            ) : isProcessing ? (
              <div className="animate-spin-2">
                <Loader strokeWidth={1} size={32} />
              </div>
            ) : (
              <Mic strokeWidth={1} size={32} />
            )}
          </button>

          <Button aria-label="New conversation" onClick={resetConversation}>
            <FilePlus strokeWidth={1} />
          </Button>
        </div>
      </div>

      {/* Settings modal */}
      <Dialog.Root open={areSettingsOpen} onOpenChange={setAreSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-dark/75 fixed inset-0 animate-fade-in" />
          <Dialog.Content className="bg-light border border-dark rounded-lg shadow-solid fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5/6 max-w-md max-h-screen p-6 animate-rise-up focus:outline-none overflow-y-auto">
            <Dialog.Title className="font-medium text-xl mb-4">
              Settings
            </Dialog.Title>
            <main>
              <h2 className="text-lg font-medium mt-3">Step 1</h2>
              <p>
                Clone <code>chatgpt-server</code> repo.
              </p>
              <SyntaxHighlighter language="bash">
                git clone https://github.com/thanhsonng/chatgpt-server.git
              </SyntaxHighlighter>

              <h2 className="text-lg font-medium mt-3">Step 2</h2>
              <p>
                Create <code>.env</code> file in the project's root. You need an{' '}
                <a href="https://openai.com/api/" target="_blank">
                  OpenAI account
                </a>
                .
              </p>
              <SyntaxHighlighter language="bash">
                {[
                  'PORT=8000 # Or whichever port available',
                  'OPENAI_EMAIL="<your-openai-email>"',
                  'OPENAI_PASSWORD="<your-openai-password>"',
                ].join('\n')}
              </SyntaxHighlighter>

              <h2 className="text-lg font-medium mt-3">Step 3</h2>
              <p>
                Start the server - done! Make sure you are using Node 18 or
                higher.
              </p>
              <SyntaxHighlighter language="bash">
                {['npm install', 'npm run build', 'npm run start'].join('\n')}
              </SyntaxHighlighter>
            </main>
            {/* <Dialog.Description className="DialogDescription">
              Make changes to your profile here. Click save when you're done.
            </Dialog.Description>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="name">
                Name
              </label>
              <input className="Input" id="name" defaultValue="Pedro Duarte" />
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="username">
                Username
              </label>
              <input className="Input" id="username" defaultValue="@peduarte" />
            </fieldset>
            <div
              style={{
                display: 'flex',
                marginTop: 25,
                justifyContent: 'flex-end',
              }}
            >
              <Dialog.Close asChild>
                <button className="Button green">Save changes</button>
              </Dialog.Close>
            </div> */}
            <Dialog.Close asChild>
              <Button
                className="absolute top-6 right-6"
                aria-label="Close"
                size="small"
              >
                <X strokeWidth={1} size={16} />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default App;
