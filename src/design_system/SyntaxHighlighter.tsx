import {
  Prism as SH,
  SyntaxHighlighterProps as SHProps,
} from 'react-syntax-highlighter';

/**
 * Based on Atom Dark stylesheet
 * @see https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/699056430175e7a09668f85b8ccad9f18b186066/src/styles/prism/atom-dark.js
 */
const defaultStyle = {
  'code[class*="language-"]': {
    color: '#191308', // Dark
    fontFamily: '"DM Mono", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#191308', // Dark
    fontFamily: '"DM Mono", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '0.5em',
    margin: '.5em 0',
    overflow: 'auto',
    borderRadius: '0.375em',
    background: 'transparent',
    border: 'solid 1px #191308', // Dark
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#191308', // Dark
    padding: '.1em',
    borderRadius: '.3em',
  },
  comment: {
    color: '#7C7C7C',
  },
  prolog: {
    color: '#7C7C7C',
  },
  doctype: {
    color: '#7C7C7C',
  },
  cdata: {
    color: '#7C7C7C',
  },
  punctuation: {
    color: '#191308', // Dark
  },
  '.namespace': {
    Opacity: '.7',
  },
  property: {
    color: '#96CBFE',
  },
  keyword: {
    color: '#96CBFE',
  },
  tag: {
    color: '#96CBFE',
  },
  'class-name': {
    color: '#FFFFB6',
    textDecoration: 'underline',
  },
  boolean: {
    color: '#99CC99',
  },
  constant: {
    color: '#99CC99',
  },
  symbol: {
    color: '#f92672',
  },
  deleted: {
    color: '#f92672',
  },
  number: {
    color: '#C64191', // Accent 2
  },
  selector: {
    color: '#028090', // Accent 1
  },
  'attr-name': {
    color: '#028090', // Accent 1
  },
  string: {
    color: '#028090', // Accent 1
  },
  char: {
    color: '#028090', // Accent 1
  },
  builtin: {
    color: '#028090', // Accent 1
  },
  inserted: {
    color: '#028090', // Accent 1
  },
  variable: {
    color: '#191308', // Dark
  },
  operator: {
    color: '#191308', // Dark
  },
  entity: {
    color: '#FFFFB6',
    cursor: 'help',
  },
  url: {
    color: '#96CBFE',
  },
  '.language-css .token.string': {
    color: '#87C38A',
  },
  '.style .token.string': {
    color: '#87C38A',
  },
  atrule: {
    color: '#F9EE98',
  },
  'attr-value': {
    color: '#F9EE98',
  },
  function: {
    color: '#191308', // Dark
  },
  regex: {
    color: '#E9C062',
  },
  important: {
    color: '#fd971f',
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
};

export default function SyntaxHighlighter(props: SHProps) {
  const { style = defaultStyle, ...rest } = props;
  // @ts-ignore
  return <SH style={style} {...rest} />;
}
