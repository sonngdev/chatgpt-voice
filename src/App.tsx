import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  ChevronDown,
  ChevronUp,
  Check,
  Headphones,
  Info,
} from 'react-feather';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import { isDesktop, isMobile, isSafari } from 'react-device-detect';

import Button from './design_system/Button';
import SyntaxHighlighter from './design_system/SyntaxHighlighter';
import Message from './Message';
import * as Storage from './storage';
import usePrevious from './hooks/usePrevious';

interface CreateChatGPTMessageResponse {
  answer: string;
  messageId: string;
}

interface Message {
  type: 'prompt' | 'response';
  text: string;
}

interface VoiceMappings {
  [group: string]: SpeechSynthesisVoice[];
}

// Disable local server setup instruction because we have a
// backend server running. This might change in the future.
const IS_LOCAL_SETUP_REQUIRED = false;

const savedData = Storage.load();

function App() {
  const {
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    transcript,
    listening: isListening,
    finalTranscript,
  } = useSpeechRecognition();
  const prevFinalTranscript = usePrevious(finalTranscript);

  const initialMessages: Message[] = [
    { type: 'response', text: 'Try speaking to the microphone.' },
  ];
  const defaultSettingsRef = useRef({
    host: 'http://localhost',
    port: 8000,
    voiceURI: '',
    voiceSpeed: 1,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [settings, setSettings] = useState({
    host: (savedData?.host as string) ?? defaultSettingsRef.current.host,
    port: (savedData?.port as number) ?? defaultSettingsRef.current.port,
    voiceURI:
      (savedData?.voiceURI as string) ?? defaultSettingsRef.current.voiceURI,
    voiceSpeed:
      (savedData?.voiceSpeed as number) ??
      defaultSettingsRef.current.voiceSpeed,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(
    IS_LOCAL_SETUP_REQUIRED,
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const conversationRef = useRef({ currentMessageId: '' });
  const bottomDivRef = useRef<HTMLDivElement>(null);

  const availableVoices = useMemo(() => {
    const englishTypes = new Map();
    englishTypes.set('en-AU', 'English (Australia)');
    englishTypes.set('en-CA', 'English (Canada)');
    englishTypes.set('en-GB', 'English (United Kingdom)');
    englishTypes.set('en-IE', 'English (Ireland)');
    englishTypes.set('en-IN', 'English (India)');
    englishTypes.set('en-NZ', 'English (New Zealand)');
    englishTypes.set('en-US', 'English (United State)');

    const localEnglishVoices = voices.filter(
      (voice) => voice.localService && voice.lang.startsWith('en-'),
    );

    const result: VoiceMappings = {};
    for (let voice of localEnglishVoices) {
      const label = englishTypes.get(voice.lang);
      if (typeof label !== 'string') {
        continue;
      }
      if (!result[label]) {
        result[label] = [];
      }
      result[label].push(voice);
    }
    return result;
  }, [voices]);

  const selectedVoice = useMemo(() => {
    return voices.find((voice) => voice.voiceURI === settings.voiceURI);
  }, [voices, settings.voiceURI]);

  const recognizeSpeech = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      window.speechSynthesis.cancel();
      SpeechRecognition.startListening();
    }
  };

  const speak = useCallback(
    (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = settings.voiceSpeed;
      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice, settings.voiceSpeed],
  );

  const resetConversation = () => {
    setIsProcessing(false);
    setMessages(initialMessages);
    conversationRef.current = { currentMessageId: '' };

    window.speechSynthesis.cancel();
    SpeechRecognition.abortListening();
    abortRef.current?.abort();
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalVisible(isOpen);
    Storage.save(settings);
  };

  const resetSetting = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: defaultSettingsRef.current[setting],
    });
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

  // Display voices when they become available
  useEffect(() => {
    const updateVoiceSettings = () => {
      const newVoices = window.speechSynthesis.getVoices();
      const defaultVoice = newVoices.find(
        (voice) => voice.default && voice.lang.startsWith('en-'),
      );
      setVoices(newVoices);
      setSettings((oldSettings) => {
        // If a preferred voice is already set, keep it
        if (oldSettings.voiceURI) {
          return oldSettings;
        }
        return {
          ...oldSettings,
          voiceURI: defaultVoice ? defaultVoice.voiceURI : '',
        };
      });
      if (defaultVoice) {
        defaultSettingsRef.current.voiceURI = defaultVoice.voiceURI;
      }
    };

    // Safari doesn't support `voiceschanged` event, so we have to
    // periodically check if voices are loaded.
    // So is any mobile browser on iOS.
    if (isSafari || isMobile) {
      let interval = setInterval(() => {
        const newVoices = window.speechSynthesis.getVoices();
        if (newVoices.length > 0) {
          clearInterval(interval);
          updateVoiceSettings();
        }
      }, 100);
      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(interval), 10_000);

      return () => clearInterval(interval);
    }

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      updateVoiceSettings,
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        updateVoiceSettings,
      );
    };
  }, []);

  useEffect(() => {
    // Only run effect if finalTranscript change from undefined or ''
    // to a non-empty string.
    if (prevFinalTranscript || !finalTranscript) {
      return;
    }

    setMessages((oldMessages) => [
      ...oldMessages,
      { type: 'prompt', text: finalTranscript },
    ]);
    setIsProcessing(true);

    abortRef.current = new AbortController();
    const host = IS_LOCAL_SETUP_REQUIRED
      ? `${settings.host}:${settings.port}`
      : 'https://sonng-chatgpt.uksouth.cloudapp.azure.com';
    fetch(`${host}/chatgpt/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: finalTranscript,
        parentMessageId: conversationRef.current.currentMessageId || undefined,
      }),
      signal: abortRef.current.signal,
    })
      .then((res) => res.json())
      .then((res: CreateChatGPTMessageResponse) => {
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
        if (err instanceof TypeError && IS_LOCAL_SETUP_REQUIRED) {
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
  }, [prevFinalTranscript, finalTranscript, settings, speak]);

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
            <div className="flex gap-x-3 mb-6 text-danger">
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
      <Dialog.Root open={isModalVisible} onOpenChange={handleModalOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-dark/75 fixed inset-0 animate-fade-in" />
          <Dialog.Content
            className={`bg-light border border-dark rounded-lg shadow-solid fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5/6 max-w-md max-h-screen p-6 animate-rise-up focus:outline-none overflow-y-auto ${
              IS_LOCAL_SETUP_REQUIRED ? 'lg:max-w-5xl' : ''
            }`}
          >
            <Dialog.Title className="font-medium text-xl mb-4">
              Settings
            </Dialog.Title>

            {IS_LOCAL_SETUP_REQUIRED && (
              <Dialog.Description>
                Set up local server on Desktop in 3 easy steps.
              </Dialog.Description>
            )}

            <main className="lg:flex lg:gap-x-12">
              {IS_LOCAL_SETUP_REQUIRED && (
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
                    Create <code>.env</code> file in the project's root. You
                    need an{' '}
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
                    {['npm install', 'npm run build', 'npm run start'].join(
                      '\n',
                    )}
                  </SyntaxHighlighter>
                </div>
              )}

              <div className="lg:w-full">
                {IS_LOCAL_SETUP_REQUIRED && isDesktop && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mt-3">Server</h3>

                    <fieldset className="flex flex-col mt-2">
                      <label htmlFor="host">Host</label>
                      <div className="flex">
                        <input
                          id="host"
                          value={settings.host}
                          onChange={(e) => {
                            setSettings({ ...settings, host: e.target.value });
                          }}
                          className="border border-dark border-r-0 rounded-l-md bg-transparent p-2 flex-1"
                        />
                        <Button
                          iconOnly={false}
                          className="rounded-l-none"
                          onClick={() => resetSetting('host')}
                        >
                          Reset
                        </Button>
                      </div>
                    </fieldset>
                    <fieldset className="flex flex-col mt-2">
                      <label htmlFor="port">Port</label>
                      <div className="flex">
                        <input
                          id="port"
                          type="number"
                          value={settings.port}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              port: Number(e.target.value),
                            });
                          }}
                          className="border border-dark border-r-0 rounded-l-md bg-transparent p-2 flex-1"
                        />
                        <Button
                          iconOnly={false}
                          className="rounded-l-none"
                          onClick={() => resetSetting('port')}
                        >
                          Reset
                        </Button>
                      </div>
                    </fieldset>

                    <small className="mt-2 flex items-center gap-x-1">
                      <Info strokeWidth={1} size={16} />
                      This app will find the server at{' '}
                      {`${settings.host}:${settings.port}`}
                    </small>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium">Voice</h3>

                  <fieldset className="flex flex-col mt-2">
                    <label htmlFor="voice-name">Name</label>
                    <div className="flex">
                      <Select.Root
                        value={settings.voiceURI}
                        onValueChange={(value) => {
                          setSettings({
                            ...settings,
                            voiceURI: value,
                          });
                        }}
                      >
                        <Select.Trigger
                          id="voice-name"
                          className="inline-flex items-center justify-between border border-dark border-r-0 rounded-md rounded-r-none p-2 text-sm gap-1 bg-transparent flex-1"
                          aria-label="Voice name"
                        >
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDown strokeWidth={1} />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="overflow-hidden bg-light rounded-md border border-dark">
                            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-light cursor-default">
                              <ChevronUp strokeWidth={1} />
                            </Select.ScrollUpButton>
                            <Select.Viewport className="p-2">
                              {Object.entries(availableVoices).map(
                                ([group, voicesInGroup], index) => (
                                  <Fragment key={group}>
                                    {index > 0 && (
                                      <Select.Separator className="h-px bg-dark m-1" />
                                    )}

                                    <Select.Group>
                                      <Select.Label className="px-6 py-0 text-xs text-dark/50">
                                        {group}
                                      </Select.Label>
                                      {voicesInGroup.map((voice) => (
                                        <Select.Item
                                          key={voice.voiceURI}
                                          className="text-sm rounded flex items-center h-6 py-0 pl-6 pr-9 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-dark data-[highlighted]:text-light data-[disabled]:text-dark/50 data-[disabled]:pointer-events-none"
                                          value={voice.voiceURI}
                                        >
                                          <Select.ItemText>
                                            {voice.name}
                                          </Select.ItemText>
                                          <Select.ItemIndicator className="absolute left-0 w-6 inline-flex items-center justify-center">
                                            <Check strokeWidth={1} />
                                          </Select.ItemIndicator>
                                        </Select.Item>
                                      ))}
                                    </Select.Group>
                                  </Fragment>
                                ),
                              )}
                            </Select.Viewport>
                            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-light cursor-default">
                              <ChevronDown strokeWidth={1} />
                            </Select.ScrollDownButton>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                      <Button
                        iconOnly={false}
                        className="rounded-l-none"
                        onClick={() => resetSetting('voiceURI')}
                      >
                        Reset
                      </Button>
                    </div>
                  </fieldset>

                  <fieldset className="flex flex-col mt-4">
                    <label htmlFor="voice-speed">Speed</label>
                    <div className="flex gap-x-4 items-center">
                      <Slider.Root
                        id="voice-speed"
                        className="relative flex items-center select-none touch-none h-5 flex-1"
                        value={[settings.voiceSpeed]}
                        onValueChange={([newSpeed]) => {
                          setSettings({ ...settings, voiceSpeed: newSpeed });
                        }}
                        max={2}
                        min={0.5}
                        step={0.1}
                        aria-label="Voice speed"
                      >
                        <Slider.Track className="bg-dark relative flex-1 rounded-full h-1">
                          <Slider.Range className="absolute bg-dark rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-5 h-5 bg-light border border-dark rounded-full" />
                      </Slider.Root>
                      <div className="text-right">
                        {`${settings.voiceSpeed.toFixed(2)}x`}
                      </div>
                      <Button
                        iconOnly={false}
                        onClick={() => resetSetting('voiceSpeed')}
                      >
                        Reset
                      </Button>
                    </div>
                  </fieldset>

                  <Button
                    iconOnly={false}
                    className="mt-2"
                    onClick={() => speak('It was a dark and stormy night')}
                  >
                    <Headphones strokeWidth={1} />
                    <span className="ml-1">Try speaking</span>
                  </Button>
                </div>
              </div>
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
