import { DollarSign, Terminal } from 'react-feather';

interface MessageProps {
  type: 'prompt' | 'response';
  text: string;
  isActive: boolean;
  onClick?(text: string): void;
}

export default function Message({
  type,
  text,
  isActive,
  onClick,
}: MessageProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(text);
    }
  };

  return (
    <div
      className={`${
        isActive ? 'opacity-100' : 'opacity-20'
      } flex gap-x-4 transition-opacity`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleClick}
    >
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
