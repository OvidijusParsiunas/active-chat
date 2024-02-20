import {ElementUtils} from '../../utils/element/elementUtils';
import {Websocket} from '../../utils/HTTP/websocket';
import {ServiceIO} from '../../services/serviceIO';
import {Messages} from './messages/messages';
import {ActiveChat} from '../../activeChat';
import {Input} from './input/input';

export class ChatView {
  private static createElements(activeChat: ActiveChat, serviceIO: ServiceIO, panel?: HTMLElement) {
    const containerElement = document.createElement('div');
    containerElement.id = 'chat-view';
    const messages = new Messages(activeChat, serviceIO, panel);
    if (serviceIO.websocket) Websocket.createConnection(serviceIO, messages);
    const userInput = new Input(activeChat, messages, serviceIO, containerElement);
    ElementUtils.addElements(containerElement, messages.elementRef, userInput.elementRef);
    return containerElement;
  }

  public static render(activeChat: ActiveChat, containerRef: HTMLElement, serviceIO: ServiceIO, panel?: HTMLElement) {
    const containerElement = ChatView.createElements(activeChat, serviceIO, panel);
    containerRef.replaceChildren(containerElement);
  }
}
