import {MessageBody, MessageContentI, Overwrite} from '../../../types/messagesInternal';
import {MessageFile, MessageFileType} from '../../../types/messageFile';
import {HTMLActiveChatElements} from './html/htmlActiveChatElements';
import {CustomErrors, ServiceIO} from '../../../services/serviceIO';
import {LoadingStyle} from '../../../utils/loading/loadingStyle';
import {ElementUtils} from '../../../utils/element/elementUtils';
import {FireEvents} from '../../../utils/events/fireEvents';
import {MessageStyleUtils} from './utils/messageStyleUtils';
import {ErrorMessageOverrides} from '../../../types/error';
import {ResponseI} from '../../../types/responseInternal';
import {FileMessageUtils} from './utils/fileMessageUtils';
import {TextToSpeech} from './textToSpeech/textToSpeech';
import {LoadingHistory} from './history/loadingHistory';
import {Demo, DemoResponse} from '../../../types/demo';
import {ErrorResp} from '../../../types/errorInternal';
import {IntroMessage} from '../../../types/messages';
import {MessageStream} from './stream/messageStream';
import {UpdateMessage} from './utils/updateMessage';
import {IntroPanel} from '../introPanel/introPanel';
import {CustomStyle} from '../../../types/styles';
import {MessageUtils} from './utils/messageUtils';
import {HTMLMessages} from './html/htmlMessages';
import {ActiveChat} from '../../../activeChat';
import {FileMessages} from './fileMessages';
import {MessagesBase} from './messagesBase';
import {HTMLUtils} from './html/htmlUtils';
import {History} from './history/history';

export interface MessageElements {
  outerContainer: HTMLElement;
  innerContainer: HTMLElement;
  bubbleElement: HTMLElement;
}

export class Messages extends MessagesBase {
  private readonly _errorMessageOverrides?: ErrorMessageOverrides;
  private readonly _onClearMessages?: () => void;
  private readonly _onError?: (error: string) => void;
  private readonly _displayLoadingMessage?: boolean;
  private readonly _permittedErrorPrefixes?: CustomErrors;
  private readonly _displayServiceErrorMessages?: boolean;
  private _introMessage?: IntroMessage | IntroMessage[];
  customDemoResponse?: DemoResponse;

  constructor(activeChat: ActiveChat, serviceIO: ServiceIO, panel?: HTMLElement) {
    super(activeChat);
    const {permittedErrorPrefixes, introPanelMarkUp, demo} = serviceIO;
    this._errorMessageOverrides = activeChat.errorMessages?.overrides;
    this._onClearMessages = FireEvents.onClearMessages.bind(this, activeChat);
    this._onError = FireEvents.onError.bind(this, activeChat);
    this._displayLoadingMessage = Messages.getDisplayLoadingMessage(activeChat, serviceIO);
    this._permittedErrorPrefixes = permittedErrorPrefixes;
    if (!this.addSetupMessageIfNeeded(activeChat)) {
      this.populateIntroPanel(panel, introPanelMarkUp, activeChat.introPanelStyle);
    }
    this.addIntroductoryMessages(activeChat, serviceIO);
    new History(activeChat, this, serviceIO);
    this._displayServiceErrorMessages = activeChat.errorMessages?.displayServiceErrorMessages;
    activeChat.getMessages = () => JSON.parse(JSON.stringify(this.messageToElements.map(([msg]) => msg)));
    activeChat.clearMessages = this.clearMessages.bind(this, serviceIO);
    activeChat.refreshMessages = this.refreshTextMessages.bind(this);
    activeChat.scrollToBottom = ElementUtils.scrollToBottom.bind(this, this.elementRef);
    activeChat.addMessage = (message: ResponseI, isUpdate?: boolean) => {
      this.addAnyMessage({...message, sendUpdate: !!isUpdate}, !isUpdate);
    };
    activeChat.updateMessage = (index: number, messageBody: MessageBody) => UpdateMessage.update(this, index, messageBody);
    serviceIO.setUpMessagesForService?.(this);
    if (demo) this.prepareDemo(demo);
    if (activeChat.textToSpeech) {
      TextToSpeech.processConfig(activeChat.textToSpeech, (processedConfig) => {
        this.textToSpeech = processedConfig;
      });
    }
  }

  private static getDisplayLoadingMessage(activeChat: ActiveChat, serviceIO: ServiceIO) {
    if (serviceIO.websocket) return false;
    return activeChat.displayLoadingBubble ?? true;
  }

  private prepareDemo(demo: Demo) {
    if (typeof demo === 'object') {
      if (demo.response) this.customDemoResponse = demo.response;
      if (demo.displayErrors) {
        if (demo.displayErrors.default) this.addNewErrorMessage('' as 'service', '');
        if (demo.displayErrors.service) this.addNewErrorMessage('service', '');
        if (demo.displayErrors.speechToText) this.addNewErrorMessage('speechToText', '');
      }
      if (demo.displayLoadingBubble) {
        this.addLoadingMessage();
      }
    }
  }

  private addSetupMessageIfNeeded(activeChat: ActiveChat) {
    const text = activeChat._getSetUpMessage(activeChat);
    if (text) {
      const elements = this.createAndAppendNewMessageElement(text, MessageUtils.AI_ROLE);
      this.applyCustomStyles(elements, MessageUtils.AI_ROLE, false);
    }
    return !!text;
  }

  // WORK - const file for active chat classes
  private addIntroductoryMessages(activeChat?: ActiveChat, serviceIO?: ServiceIO) {
    if (activeChat?.shadowRoot) this._introMessage = activeChat.introMessage;
    let introMessage = this._introMessage;
    if (serviceIO?.getServiceIntroMessage) introMessage ??= serviceIO.getServiceIntroMessage(introMessage);
    if (introMessage) {
      if (Array.isArray(introMessage)) {
        introMessage.forEach((intro, index) => {
          if (index !== 0) MessageUtils.hideRoleElements(this.messageElementRefs, !!this._avatars, !!this._names);
          this.addIntroductoryMessage(intro);
        });
      } else {
        this.addIntroductoryMessage(introMessage);
      }
    }
  }

  private addIntroductoryMessage(introMessage: IntroMessage) {
    let elements;
    if (introMessage?.text) {
      elements = this.createAndAppendNewMessageElement(introMessage.text, MessageUtils.AI_ROLE);
    } else if (introMessage?.html) {
      elements = HTMLMessages.add(this, introMessage.html, MessageUtils.AI_ROLE, this.messageElementRefs);
    }
    if (elements) {
      this.applyCustomStyles(elements, MessageUtils.AI_ROLE, false, this.messageStyles?.intro);
      elements.outerContainer.classList.add('active-chat-intro');
    }
  }

  public removeIntroductoryMessage() {
    const introMessage = this.messageElementRefs[0];
    if (introMessage.outerContainer.classList.contains('active-chat-intro')) {
      introMessage.outerContainer.remove();
      this.messageElementRefs.shift();
    }
  }

  public addAnyMessage(message: ResponseI, isHistory = false, isTop = false) {
    if (message.error) {
      return this.addNewErrorMessage('service', message.error);
    }
    return this.addNewMessage(message, isHistory, isTop);
  }

  // this should not be activated by streamed messages
  public addNewMessage(data: ResponseI, isHistory = false, isTop = false) {
    const message = Messages.createMessageContent(data);
    const overwrite: Overwrite = {status: data.overwrite}; // if did not overwrite, create a new message
    if (!data.ignoreText && message.text !== undefined && data.text !== null) {
      this.addNewTextMessage(message.text, message.role, overwrite, isTop);
      if (!isHistory && this.textToSpeech && message.role !== MessageUtils.USER_ROLE) {
        TextToSpeech.speak(message.text, this.textToSpeech);
      }
    }
    if (message.files && Array.isArray(message.files)) {
      FileMessages.addMessages(this, message.files, message.role, isTop);
    }
    if (message.html !== undefined && message.html !== null) {
      const elements = HTMLMessages.add(this, message.html, message.role, this.messageElementRefs, overwrite, isTop);
      if (HTMLActiveChatElements.isElementTemporary(elements)) delete message.html;
    }
    if (this.isValidMessageContent(message) && !isTop) {
      this.updateStateOnMessage(message, data.overwrite, data.sendUpdate, isHistory);
    }
    return message;
  }

  private isValidMessageContent(messageContent: MessageContentI) {
    return messageContent.text || messageContent.html || (messageContent.files && messageContent.files.length > 0);
  }

  private updateStateOnMessage(messageContent: MessageContentI, overwritten?: boolean, update = true, isHistory = false) {
    if (!overwritten) {
      const messageBody = MessageUtils.generateMessageBody(messageContent, this.messageElementRefs);
      this.messageToElements.push([messageContent, messageBody]);
    }
    if (update) this.sendClientUpdate(messageContent, isHistory);
  }

  // prettier-ignore
  private removeMessageOnError() {
    const lastMessage = this.messageElementRefs[this.messageElementRefs.length - 1];
    const lastMessageBubble = lastMessage?.bubbleElement;
    if ((lastMessageBubble?.classList.contains(MessageStream.MESSAGE_CLASS) && lastMessageBubble.textContent === '') ||
        Messages.isTemporaryElement(lastMessage)) {
      this.removeLastMessage();
    }
  }

  // prettier-ignore
  public addNewErrorMessage(type: keyof Omit<ErrorMessageOverrides, 'default'>, message?: ErrorResp, isTop = false) {
    this.removeMessageOnError();
    const text = this.getPermittedMessage(message) || this._errorMessageOverrides?.[type]
      || this._errorMessageOverrides?.default || 'Error, please try again.';
    const messageElements = this.createMessageElementsOnOrientation(text, 'error', isTop);
    MessageUtils.hideRoleElements(this.messageElementRefs, !!this._avatars, !!this._names);
    const {bubbleElement, outerContainer} = messageElements;
    bubbleElement.classList.add('error-message-text');
    this.renderText(bubbleElement, text);
    const fontElementStyles = MessageStyleUtils.extractParticularSharedStyles(['fontSize', 'fontFamily'],
      this.messageStyles?.default);
    MessageStyleUtils.applyCustomStylesToElements(messageElements, false, fontElementStyles);
    MessageStyleUtils.applyCustomStylesToElements(messageElements, false, this.messageStyles?.error);
    if (!isTop) this.elementRef.appendChild(outerContainer);
    if (this.textToSpeech) TextToSpeech.speak(text, this.textToSpeech);
    this._onError?.(text);
  }

  private static checkPermittedErrorPrefixes(errorPrefixes: string[], message: string): string | undefined {
    for (let i = 0; i < errorPrefixes.length; i += 1) {
      if (message.startsWith(errorPrefixes[i])) return message;
    }
    return undefined;
  }

  private static extractErrorMessages(message: ErrorResp): string[] {
    if (Array.isArray(message)) {
      return message;
    }
    if (message instanceof Error) {
      return [message.message];
    }
    if (typeof message === 'string') {
      return [message];
    }
    if (typeof message === 'object' && message.error) {
      return [message.error];
    }
    return [];
  }

  private getPermittedMessage(message?: ErrorResp): string | undefined {
    if (message) {
      const messages = Messages.extractErrorMessages(message); // turning all into array for convenience
      for (let i = 0; i < messages.length; i += 1) {
        const messageStr = messages[i];
        if (typeof messageStr === 'string') {
          if (this._displayServiceErrorMessages) return messageStr;
          if (this._permittedErrorPrefixes) {
            const result = Messages.checkPermittedErrorPrefixes(this._permittedErrorPrefixes, messageStr);
            if (result) return result;
          }
        }
      }
    }
    return undefined;
  }

  public removeError() {
    if (this.isLastMessageError()) MessageUtils.getLastMessageElement(this.elementRef).remove();
  }

  private addDefaultLoadingMessage() {
    const messageElements = this.createMessageElements('', MessageUtils.AI_ROLE);
    const {bubbleElement} = messageElements;
    messageElements.bubbleElement.classList.add(LoadingStyle.DOTS_CONTAINER_CLASS);
    const dotsElement = document.createElement('div');
    dotsElement.classList.add('loading-message-dots');
    bubbleElement.appendChild(dotsElement);
    LoadingStyle.setDots(bubbleElement, this.messageStyles);
    return messageElements;
  }

  public addLoadingMessage() {
    if (!this._displayLoadingMessage) return;
    const html = this.messageStyles?.loading?.message?.html;
    const messageElements = html
      ? HTMLMessages.createElements(this, html, MessageUtils.AI_ROLE, false)
      : this.addDefaultLoadingMessage();
    this.elementRef.appendChild(messageElements.outerContainer);
    messageElements.bubbleElement.classList.add(LoadingStyle.BUBBLE_CLASS);
    this.applyCustomStyles(messageElements, MessageUtils.AI_ROLE, false, this.messageStyles?.loading?.message?.styles);
    ElementUtils.scrollToBottom(this.elementRef);
  }

  private populateIntroPanel(childElement?: HTMLElement, introPanelMarkUp?: string, introPanelStyle?: CustomStyle) {
    if (childElement || introPanelMarkUp) {
      this._introPanel = new IntroPanel(childElement, introPanelMarkUp, introPanelStyle);
      if (this._introPanel._elementRef) {
        HTMLUtils.apply(this, this._introPanel._elementRef);
        this.elementRef.appendChild(this._introPanel._elementRef);
      }
    }
  }

  public async addMultipleFiles(filesData: {file: File; type: MessageFileType}[]) {
    return Promise.all<MessageFile>(
      (filesData || []).map((fileData) => {
        return new Promise((resolve) => {
          if (!fileData.type || fileData.type === 'any') {
            const fileName = fileData.file.name || FileMessageUtils.DEFAULT_FILE_NAME;
            resolve({name: fileName, type: 'any', ref: fileData.file});
          } else {
            const reader = new FileReader();
            reader.readAsDataURL(fileData.file);
            reader.onload = () => {
              resolve({src: reader.result as string, type: fileData.type, ref: fileData.file});
            };
          }
        });
      })
    );
  }

  public static isActiveElement(bubbleClasslist?: DOMTokenList) {
    if (!bubbleClasslist) return false;
    return (
      bubbleClasslist.contains(LoadingStyle.BUBBLE_CLASS) ||
      bubbleClasslist.contains(LoadingHistory.CLASS) ||
      bubbleClasslist.contains(MessageStream.MESSAGE_CLASS)
    );
  }

  // WORK - update all message classes to use active-chat prefix
  private clearMessages(serviceIO: ServiceIO, isReset?: boolean) {
    const retainedElements: MessageElements[] = [];
    this.messageElementRefs.forEach((message) => {
      if (Messages.isActiveElement(message.bubbleElement.classList)) {
        retainedElements.push(message);
      } else {
        message.outerContainer.remove();
      }
    });
    // this is a form of cleanup as this.messageElementRefs does not contain error messages
    // and can only be deleted by direct search
    Array.from(this.elementRef.children).forEach((messageElement) => {
      const bubbleClasslist = messageElement.children[0]?.children[0];
      if (bubbleClasslist?.classList.contains('error-message-text')) {
        messageElement.remove();
      }
    });
    this.messageElementRefs = retainedElements;
    const retainedMessageToElements = this.messageToElements.filter((msgToEls) => {
      // safe because streamed messages can't contain multiple props (text, html)
      return (
        (msgToEls[1].text && Messages.isActiveElement(msgToEls[1].text.bubbleElement.classList)) ||
        (msgToEls[1].html && Messages.isActiveElement(msgToEls[1].html.bubbleElement.classList))
      );
    });
    this.messageToElements.splice(0, this.messageToElements.length, ...retainedMessageToElements);
    if (isReset !== false) {
      if (this._introPanel?._elementRef) this._introPanel.display();
      this.addIntroductoryMessages();
    }
    this._onClearMessages?.();
    delete serviceIO.sessionId;
  }
}
