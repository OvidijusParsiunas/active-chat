import {FileMessageUtils} from '../../views/chat/messages/fileMessageUtils';
import {MessageContentI} from '../../types/messagesInternal';
import {ActiveChat} from '../../activeChat';
import {Legacy} from '../legacy/legacy';

export class FireEvents {
  public static onMessage(activeChat: ActiveChat, message: MessageContentI, isHistory: boolean) {
    const updateBody = JSON.parse(JSON.stringify({message, isHistory}));
    FileMessageUtils.reAddFileRefToObject(message, updateBody);
    activeChat.onMessage?.(updateBody);
    activeChat.dispatchEvent(new CustomEvent('message', {detail: updateBody}));
    Legacy.fireOnNewMessage(activeChat, updateBody);
  }

  public static onClearMessages(activeChat: ActiveChat) {
    activeChat.onClearMessages?.();
    activeChat.dispatchEvent(new CustomEvent('clear-messages'));
  }

  public static onRender(activeChat: ActiveChat) {
    activeChat.onComponentRender?.(activeChat);
    activeChat.dispatchEvent(new CustomEvent('render', {detail: activeChat}));
  }

  public static onError(activeChat: ActiveChat, error: string) {
    activeChat.onError?.(error);
    activeChat.dispatchEvent(new CustomEvent('error', {detail: error}));
  }
}
