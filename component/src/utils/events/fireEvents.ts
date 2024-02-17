import {FileMessageUtils} from '../../views/chat/messages/fileMessageUtils';
import {MessageContentI} from '../../types/messagesInternal';
import {ActiveChat} from '../../activeChat';

export class FireEvents {
  public static onNewMessage(deepChat: ActiveChat, message: MessageContentI, isInitial: boolean) {
    const updateBody = JSON.parse(JSON.stringify({message, isInitial}));
    FileMessageUtils.reAddFileRefToObject(message, updateBody);
    deepChat.onNewMessage?.(updateBody);
    deepChat.dispatchEvent(new CustomEvent('new-message', {detail: updateBody}));
  }

  public static onClearMessages(deepChat: ActiveChat) {
    deepChat.onClearMessages?.();
    deepChat.dispatchEvent(new CustomEvent('clear-messages'));
  }

  public static onRender(deepChat: ActiveChat) {
    deepChat.onComponentRender?.(deepChat);
    deepChat.dispatchEvent(new CustomEvent('render', {detail: deepChat}));
  }

  public static onError(deepChat: ActiveChat, error: string) {
    deepChat.onError?.(error);
    deepChat.dispatchEvent(new CustomEvent('error', {detail: error}));
  }
}
