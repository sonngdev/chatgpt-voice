import { useCallback, useEffect, useRef, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import {
  GitHub,
  Settings,
  FilePlus,
  Mic,
  Activity,
  Loader,
  AlertTriangle,
  X,
} from 'react-feather';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { isDesktop, isMobile } from 'react-device-detect';

import Button from './design_system/Button';
import SyntaxHighlighter from './design_system/SyntaxHighlighter';
import Message from './Message';
import * as Storage from './storage';

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

const savedData = Storage.load();
const defaultSettings = {
  host: 'http://localhost',
  port: 8000,
};
const initialSettings = {
  host: (savedData?.host as string) || defaultSettings.host,
  port: (savedData?.port as number) || defaultSettings.port,
};

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
  const [settings, setSettings] = useState(initialSettings);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);
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

      abortRef.current = new AbortController();
      fetch(`${settings.host}:${settings.port}/chatgpt/messages`, {
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
            setIsTooltipVisible(true);
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
  }, [finalTranscript, settings, speak]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div>
        This browser doesn't support speech recognition. Please use Chrome.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-9 flex flex-col h-screen gap-y-4 lg:px-28 lg:py-12 lg:relative">
      <header className="flex flex-col items-center lg:flex-row lg:justify-between lg:mb-4">
        {/* w-64 so text will break after ChatGPT */}
        <h1 className="font-title text-3xl text-center w-64 lg:w-auto">
          ChatGPT With Voice
          <div className="inline-block w-4 h-7 ml-2 align-middle bg-dark/40 animate-blink" />
        </h1>
        <div className="mt-4 flex justify-center lg:px-2">
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
          {!isMicrophoneAvailable && (
            <div className="flex gap-x-3 mb-6 text-red-700">
              <div className="shrink-0">
                <AlertTriangle strokeWidth={1} />
              </div>
              <div>
                Please allow microphone permission for this app to work
                properly.
              </div>
            </div>
          )}
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
                    className="rounded-md px-4 py-3 max-w-xs bg-light border border-dark shadow-solid select-none animate-fade-in"
                    sideOffset={isMobile ? 15 : 10}
                    align={isMobile ? 'start' : 'end'}
                    alignOffset={isMobile ? -50 : 0}
                  >
                    {isMobile
                      ? 'Run a local server on Desktop to see this works.'
                      : 'Set up local server first.'}
                    <Tooltip.Arrow className="fill-light relative -top-px" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            <Button
              aria-label="Settings"
              onClick={() => setIsModalVisible(true)}
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
            } text-light flex justify-center items-center rounded-full transition-all hover:opacity-80 focus:opacity-80`}
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
      <Dialog.Root open={isModalVisible} onOpenChange={setIsModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-dark/75 fixed inset-0 animate-fade-in" />
          <Dialog.Content className="bg-light border border-dark rounded-lg shadow-solid fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5/6 max-w-md max-h-screen p-6 animate-rise-up focus:outline-none overflow-y-auto lg:max-w-5xl">
            <Dialog.Title className="font-medium text-xl mb-4">
              Help
            </Dialog.Title>
            <Dialog.Description>
              Set up local server on Desktop in 3 easy steps.
            </Dialog.Description>

            <main className="lg:flex lg:gap-x-12">
              <div>
                <h3 className="text-lg font-medium mt-3">Step 1</h3>
                <p>
                  Clone <code>chatgpt-server</code> repo.
                </p>
                <SyntaxHighlighter language="bash">
                  git clone https://github.com/thanhsonng/chatgpt-server.git
                </SyntaxHighlighter>

                <h3 className="text-lg font-medium mt-3">Step 2</h3>
                <p>
                  Create <code>.env</code> file in the project's root. You need
                  an{' '}
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

                <h3 className="text-lg font-medium mt-3">Step 3</h3>
                <p>
                  Start the server - done! Make sure you are using Node 18 or
                  higher.
                </p>
                <SyntaxHighlighter language="bash">
                  {['npm install', 'npm run build', 'npm run start'].join('\n')}
                </SyntaxHighlighter>
              </div>

              {isDesktop && (
                <div className="lg:w-full">
                  <h3 className="text-lg font-medium mt-3">Settings</h3>

                  <fieldset className="flex flex-col mt-2">
                    <label htmlFor="host">Host</label>
                    <input
                      id="host"
                      value={settings.host}
                      onChange={(e) =>
                        setSettings({ ...settings, host: e.target.value })
                      }
                      onBlur={() => {
                        Storage.save(settings);
                      }}
                      className="border border-dark rounded-md bg-transparent px-3 py-2"
                    />
                  </fieldset>
                  <fieldset className="flex flex-col mt-4">
                    <label htmlFor="port">Port</label>
                    <input
                      id="port"
                      type="number"
                      value={settings.port}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          port: Number(e.target.value),
                        })
                      }
                      onBlur={() => {
                        Storage.save(settings);
                      }}
                      className="border border-dark rounded-md bg-transparent px-3 py-2"
                    />
                  </fieldset>

                  <small className="block mt-4">
                    This app will find the server at{' '}
                    {`${settings.host}:${settings.port}`}
                  </small>

                  <Button
                    type="reset"
                    className="mt-4 text-red-700 border-red-700"
                    iconOnly={false}
                    onClick={() => setSettings(defaultSettings)}
                  >
                    Reset to defaults
                  </Button>
                </div>
              )}
            </main>

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
