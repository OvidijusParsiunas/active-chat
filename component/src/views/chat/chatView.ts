import {UPWARDS_MODE_CLASS, DOWNWARDS_MODE_CLASS} from '../../utils/consts/classConstants';
import {ElementUtils} from '../../utils/element/elementUtils';
import {Websocket} from '../../utils/HTTP/websocket';
import {ServiceIO} from '../../services/serviceIO';
import {Messages} from './messages/messages';
import {ActiveChat} from '../../activeChat';
import {Input} from './input/input';

export class ChatView {
  private static createElements(activeChat: ActiveChat, serviceIO: ServiceIO, panel?: HTMLElement) {
    const containerEl = document.createElement('div');
    containerEl.id = 'chat-view';
    containerEl.classList.add(!activeChat.focusMode && activeChat.upwardsMode ? UPWARDS_MODE_CLASS : DOWNWARDS_MODE_CLASS);
    const messages = new Messages(activeChat, serviceIO, panel);
    if (serviceIO.websocket) Websocket.createConnection(serviceIO, messages);
    const userInput = new Input(activeChat, messages, serviceIO, containerEl);
    ElementUtils.addElements(containerEl, messages.elementRef, userInput.elementRef);
    return containerEl;
  }

  public static render(activeChat: ActiveChat, containerRef: HTMLElement, serviceIO: ServiceIO, panel?: HTMLElement) {
    const containerElement = ChatView.createElements(activeChat, serviceIO, panel);
    containerRef.replaceChildren(containerElement);
  }
}
