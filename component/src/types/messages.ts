import {InterfacesUnion} from './utilityTypes';
import {MessageFile} from './messageFile';
import {CustomStyle} from './styles';

export interface LoadingHistoryStyles {
  full?: {styles?: MessageElementsStyles; html?: string};
  small?: {styles?: MessageElementsStyles; html?: string};
}

export interface MessageElementsStyles {
  outerContainer?: CustomStyle;
  innerContainer?: CustomStyle;
  bubble?: CustomStyle;
  media?: CustomStyle;
}

export interface LoadingStyles {
  message?: MessageElementsStyles;
  history?: LoadingHistoryStyles;
}

export type MessageRoleStyles = {
  shared?: MessageElementsStyles;
  user?: MessageElementsStyles;
  ai?: MessageElementsStyles;
} & {[role: string]: MessageElementsStyles};

export interface MessageStyles {
  default?: MessageRoleStyles;
  image?: MessageRoleStyles;
  audio?: MessageRoleStyles;
  file?: MessageRoleStyles;
  html?: MessageRoleStyles;
  intro?: MessageElementsStyles;
  error?: MessageElementsStyles;
  loading?: LoadingStyles;
}

export type MessageContent = {role?: string; text?: string; files?: MessageFile[]; html?: string; _sessionId?: string};

export type OnMessage = (newMessage: {message: MessageContent; isHistory: boolean}) => void;

export type IntroMessage = InterfacesUnion<{text: string} | {html: string}>;

export type UserContent = {text?: string; files?: File[] | FileList};
