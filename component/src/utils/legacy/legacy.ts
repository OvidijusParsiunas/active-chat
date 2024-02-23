import {MessageContent, OnMessage} from '../../types/messages';
import {ValidateInput} from '../../types/validateInput';
import {MessageFile} from '../../types/messageFile';
import {CustomStyle} from '../../types/styles';
import {Connect} from '../../types/connect';
import {ActiveChat} from '../../activeChat';
import {Stream} from '../../types/stream';

interface LegacyActiveChat {
  request?: Connect;
  stream?: Stream;
  initialMessages?: MessageContent[];
  containerStyle?: CustomStyle;
  validateMessageBeforeSending?: ValidateInput;
  onNewMessage?: OnMessage;
}

export class Legacy {
  public static checkForContainerStyles(activeChat: ActiveChat, containerRef: HTMLElement) {
    const containerStyle = (activeChat as unknown as LegacyActiveChat).containerStyle;
    if (containerStyle) {
      Object.assign(containerRef.style, containerStyle);
      console.error('The containerStyle property is deprecated.');
      console.error('Please change to using the style property instead: https://deepchat.dev/docs/styles#style');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static handleResponseProperty(result: any | Response) {
    console.error('The {result: ....} response object type is deprecated.');
    console.error('Please change to using the new response object: https://deepchat.dev/docs/connect#Response');
    return result.result;
  }

  public static processHistory(activeChat: ActiveChat) {
    const initialMessages = (activeChat as unknown as LegacyActiveChat).initialMessages;
    if (initialMessages) {
      console.error('The initialMessages property is deprecated.');
      console.error('Please change to using the history property instead: https://deepchat.dev/docs/messages/#history');
      return initialMessages;
    }
    return undefined;
  }

  public static processHistoryFile(message: MessageContent) {
    const file = (message as MessageContent & {file?: MessageFile}).file;
    if (file) {
      console.error('The file property in MessageContent is deprecated.');
      console.error('Please change to using the files array property: https://deepchat.dev/docs/messages/#MessageContent');
      message.files = [file];
    }
  }

  public static processValidateInput(activeChat: ActiveChat) {
    const validate = (activeChat as ActiveChat & LegacyActiveChat).validateMessageBeforeSending;
    if (validate) {
      console.error('The validateMessageBeforeSending property is deprecated.');
      console.error('Please change to using validateInput: https://deepchat.dev/docs/interceptors#validateInput');
      return validate;
    }
    return undefined;
  }

  public static processSubmitUserMessage(content: string) {
    console.error('The submitUserMessage(text: string) argument string type is deprecated.');
    console.error('Please change to using the new argument type: https://deepchat.dev/docs/methods#submitUserMessage');
    return {text: content};
  }

  public static flagHTMLUpdateClass(bubbleElement: HTMLElement) {
    if (bubbleElement.children[0]?.classList.contains('deep-chat-update-message')) {
      console.error('The "deep-chat-update-message" html class is deprecated.');
      console.error('Please change to using {..., overwrite: true} object: https://deepchat.dev/docs/connect#Response');
    }
  }

  public static processConnect(activeChat: ActiveChat) {
    const legacyActiveChat = activeChat as unknown as ActiveChat & LegacyActiveChat;
    if (legacyActiveChat.request) {
      if (legacyActiveChat.connect) {
        Object.assign(legacyActiveChat.connect, legacyActiveChat.request);
      } else {
        // this will cause the component to render twice but it is needed
        legacyActiveChat.connect = legacyActiveChat.request;
      }
      console.error('The request property is deprecated.');
      console.error('Please see the connect object: https://deepchat.dev/docs/connect#connect-1');
    }
  }

  public static checkForStream(activeChat: ActiveChat) {
    const stream = (activeChat as unknown as LegacyActiveChat).stream;
    if (stream) {
      console.error('The stream property has been moved to the connect object.');
      console.error('Please see the connect object: https://deepchat.dev/docs/connect#connect-1');
      return stream;
    }
    return undefined;
  }

  public static fireOnNewMessage(activeChat: ActiveChat, updateBody: {message: MessageContent; isHistory: boolean}) {
    const legacyActiveChat = activeChat as unknown as ActiveChat & LegacyActiveChat;
    if (legacyActiveChat.onNewMessage) {
      console.error('The onNewMessage event has deprecated.');
      console.error('Please see the onMessage event: https://deepchat.dev/docs/events#onMessage');
      legacyActiveChat.onNewMessage?.(updateBody);
    }
    activeChat.dispatchEvent(new CustomEvent('new-message', {detail: updateBody}));
  }
}
