import React, { useEffect, useState } from 'react';
import styles from './typing.module.css';

const Typewriter = ({ text = "", typingDelay = 100, blinkingCursor = true }) => {
  const [typewriterText, setTypewriterText] = useState("");
  const [index, setIndex] = useState(0);
  const words = text.replace(/\n/g, '<br/>').split(' ');

  useEffect(() => {
    setTypewriterText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < words.length) {
      const timerId = setInterval(() => {
        setTypewriterText((prevText) => prevText + (index > 0 ? ' ' : '') + words[index]);
        setIndex((prevIndex) => prevIndex + 1);
      }, typingDelay);

      return () => clearInterval(timerId);
    }
  }, [index, words, typingDelay]);

  return (
    <span className={blinkingCursor ? styles.blinkingCursor : ''} dangerouslySetInnerHTML={{ __html: typewriterText }}></span>
  );
};

export default Typewriter;
