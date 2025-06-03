import {FileMessageUtils} from '../../views/chat/messages/utils/fileMessageUtils';
import {MessageContentI} from '../../types/messagesInternal';
import {ActiveChat} from '../../activeChat';
import {Legacy} from '../legacy/legacy';

export class FireEvents {
  public static onMessage(activeChat: ActiveChat, message: MessageContentI, isHistory: boolean) {
    const updateBody = JSON.parse(JSON.stringify({message, isHistory, isInitial: isHistory}));
    FileMessageUtils.reAddFileRefToObject(message, updateBody.message);
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

  public static onInput(activeChat: ActiveChat, content: {text?: string; files?: File[]}, isUser: boolean) {
    const updateBody = JSON.parse(JSON.stringify({content, isUser}));
    if (content.files) {
      FileMessageUtils.reAddFileRefToObject({files: content.files?.map((file) => ({ref: file}))}, updateBody);
    }
    activeChat.onInput?.(updateBody);
    activeChat.dispatchEvent(new CustomEvent('input', {detail: updateBody}));
  }

  public static onError(activeChat: ActiveChat, error: string) {
    activeChat.onError?.(error);
    activeChat.dispatchEvent(new CustomEvent('error', {detail: error}));
  }
}
