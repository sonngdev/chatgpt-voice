import { DollarSign, Terminal } from 'react-feather';

interface MessageProps {
  type: 'prompt' | 'response';
  text: string;
}

export default function Message({ type, text }: MessageProps) {
  return (
    <div className="flex gap-x-4">
      <div className="shrink-0 mt-1">
        {type === 'prompt' ? (
          <span className="text-accent1">
            <DollarSign strokeWidth={3} />
          </span>
        ) : (
          <span className="text-accent2">
            <Terminal strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="font-medium text-2xl">{text}</div>
    </div>
  );
}
