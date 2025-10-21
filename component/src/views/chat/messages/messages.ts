import {MessageBody, MessageContentI, Overwrite} from '../../../types/messagesInternal';
import {HiddenFileAttachments} from '../input/fileAttachments/fileAttachments';
import {MessageFile, MessageFileType} from '../../../types/messageFile';
import {HTMLActiveChatElements} from './html/htmlActiveChatElements';
import {CustomErrors, ServiceIO} from '../../../services/serviceIO';
import {IntroMessage, LoadingStyles} from '../../../types/messages';
import {LoadingStyle} from '../../../utils/loading/loadingStyle';
import {ElementUtils} from '../../../utils/element/elementUtils';
import {FireEvents} from '../../../utils/events/fireEvents';
import {MessageStyleUtils} from './utils/messageStyleUtils';
import {ErrorMessageOverrides} from '../../../types/error';
import {LoadingToggleConfig} from '../../../types/loading';
import {ResponseI} from '../../../types/responseInternal';
import {FileMessageUtils} from './utils/fileMessageUtils';
import {TextToSpeech} from './textToSpeech/textToSpeech';
import {LoadingHistory} from './history/loadingHistory';
import {Demo, DemoResponse} from '../../../types/demo';
import {ErrorResp} from '../../../types/errorInternal';
import {MessageStream} from './stream/messageStream';
import {UpdateMessage} from './utils/updateMessage';
import {Legacy} from '../../../utils/legacy/legacy';
import {IntroPanel} from '../introPanel/introPanel';
import {LoadHistory} from '../../../types/history';
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
  private readonly _isLoadingMessageAllowed?: boolean;
  private readonly _permittedErrorPrefixes?: CustomErrors;
  private readonly _displayServiceErrorMessages?: boolean;
  private _introMessage?: IntroMessage | IntroMessage[];
  private _hiddenAttachments?: HiddenFileAttachments;
  private _activeLoadingConfig?: LoadingToggleConfig;
  customDemoResponse?: DemoResponse;

  constructor(activeChat: ActiveChat, serviceIO: ServiceIO, panel?: HTMLElement) {
    super(activeChat);
    const {permittedErrorPrefixes, demo} = serviceIO;
    this._errorMessageOverrides = activeChat.errorMessages?.overrides;
    this._onClearMessages = FireEvents.onClearMessages.bind(this, activeChat);
    this._onError = FireEvents.onError.bind(this, activeChat);
    this._isLoadingMessageAllowed = Messages.getDefaultDisplayLoadingMessage(activeChat, serviceIO);
    if (typeof activeChat.displayLoadingBubble === 'object' && !!activeChat.displayLoadingBubble.toggle) {
      activeChat.displayLoadingBubble.toggle = this.setLoadingToggle.bind(this);
    }
    this._permittedErrorPrefixes = permittedErrorPrefixes;
    this.populateIntroPanel(panel);
    this.addSetupMessageIfNeeded(activeChat);
    if (demo) this.prepareDemo(Legacy.processDemo(demo), activeChat.loadHistory); // before intro/history for load spinner
    this.addIntroductoryMessages(activeChat, serviceIO);
    new History(activeChat, this, serviceIO);
    this._displayServiceErrorMessages = activeChat.errorMessages?.displayServiceErrorMessages;
    activeChat.getMessages = () => JSON.parse(JSON.stringify(this.messageToElements.map(([msg]) => msg)));
    activeChat.clearMessages = this.clearMessages.bind(this, serviceIO);
    activeChat.refreshMessages = this.refreshTextMessages.bind(this, activeChat.remarkable);
    activeChat.getMessages = () =>
      MessageUtils.deepCloneMessagesWithReferences(this.messageToElements.map(([msg]) => msg));
    activeChat.addMessage = (message: ResponseI, isUpdate?: boolean) => {
      this.addAnyMessage({...message, sendUpdate: !!isUpdate}, !isUpdate);
    };
    activeChat.updateMessage = (messageBody: MessageBody, index: number) => UpdateMessage.update(this, messageBody, index);
    serviceIO.setUpMessagesForService?.(this);
    if (activeChat.textToSpeech) {
      TextToSpeech.processConfig(activeChat.textToSpeech, (processedConfig) => {
        this.textToSpeech = processedConfig;
      });
    }
  }

  private static getDefaultDisplayLoadingMessage(activeChat: ActiveChat, serviceIO: ServiceIO) {
    if (typeof activeChat.displayLoadingBubble === 'object' && !!activeChat.displayLoadingBubble.toggle) {
      return false;
    }
    if (serviceIO.websocket) {
      return typeof activeChat.displayLoadingBubble === 'object' ? false : !!activeChat.displayLoadingBubble;
    }
    // if displayLoadingBubble is {} then treat it as true.
    return (typeof activeChat.displayLoadingBubble === 'object' || activeChat.displayLoadingBubble) ?? true;
  }

  private setLoadingToggle(config?: LoadingToggleConfig) {
    const lastMessageEls = this.messageElementRefs[this.messageElementRefs.length - 1];
    if (!config && MessagesBase.isLoadingMessage(lastMessageEls)) {
      this.removeLastMessage();
      delete this._activeLoadingConfig;
    } else {
      if (this._activeLoadingConfig) this.removeLastMessage();
      this._activeLoadingConfig = config || {};
      this.addLoadingMessage(true);
    }
  }

  private prepareDemo(demo: Demo, loadHistory?: LoadHistory): void {
    if (typeof demo === 'object') {
      if (!loadHistory && demo.displayLoading) {
        const {history} = demo.displayLoading;
        if (history?.small) LoadingHistory.addMessage(this, false);
        if (history?.full) LoadingHistory.addMessage(this);
      }
      if (demo.displayErrors) {
        if (demo.displayErrors.default) this.addNewErrorMessage('' as 'service', '');
        if (demo.displayErrors.service) this.addNewErrorMessage('service', '');
        if (demo.displayErrors.speechToText) this.addNewErrorMessage('speechToText', '');
      }
      // needs to be here for message loading bubble to not disappear after error
      if (demo.displayLoading?.message) this.addLoadingMessage();
      if (demo.response) this.customDemoResponse = demo.response;
    }
  }

  private addSetupMessageIfNeeded(activeChat: ActiveChat) {
    const text = activeChat._getSetUpMessage(activeChat);
    if (text) {
      const elements = this.createAndAppendNewMessageElement(text, MessageUtils.AI_ROLE);
      this.applyCustomStyles(elements, MessageUtils.AI_ROLE, false);
    }
  }

  // WORK - const file for active chat classes
  private addIntroductoryMessages(activeChat?: ActiveChat, serviceIO?: ServiceIO) {
    if (activeChat?.shadowRoot) this._introMessage = activeChat.introMessage;
    const shouldHide = !activeChat?.history && !!(activeChat?.loadHistory || serviceIO?.fetchHistory);
    if (this._introMessage) {
      if (Array.isArray(this._introMessage)) {
        this._introMessage.forEach((intro, index) => {
          if (index !== 0) {
            const innerContainer = this.messageElementRefs[this.messageElementRefs.length - 1].innerContainer;
            MessageUtils.hideRoleElements(innerContainer, this.avatar, this.name);
          }
          this.addIntroductoryMessage(intro, shouldHide);
        });
      } else {
        this.addIntroductoryMessage(this._introMessage, shouldHide);
      }
    }
  }

  private addIntroductoryMessage(introMessage: IntroMessage, shouldHide: boolean) {
    let elements;
    if (introMessage?.text) {
      elements = this.createAndAppendNewMessageElement(introMessage.text, MessageUtils.AI_ROLE);
    } else if (introMessage?.html) {
      elements = HTMLMessages.add(this, introMessage.html, MessageUtils.AI_ROLE, false);
    }
    if (elements) {
      this.applyCustomStyles(elements, MessageUtils.AI_ROLE, false, this.messageStyles?.intro);
      elements.outerContainer.classList.add(MessagesBase.INTRO_CLASS);
      if (shouldHide) elements.outerContainer.style.display = 'none';
    }
    return elements;
  }

  public removeIntroductoryMessage() {
    const introMessage = this.messageElementRefs[0];
    if (introMessage.outerContainer.classList.contains(MessagesBase.INTRO_CLASS)) {
      introMessage.outerContainer.remove();
      this.messageElementRefs.shift();
    }
  }

  public addAnyMessage(message: ResponseI, isHistory = false, isTop = false) {
    if (message.error) {
      return this.addNewErrorMessage('service', message.error, isTop);
    }
    return this.addNewMessage(message, isHistory, isTop);
  }

  private tryAddTextMessage(msg: MessageContentI, overwrite: Overwrite, data: ResponseI, history = false, isTop = false) {
    if (msg.text !== undefined && data.text !== null) {
      this.addNewTextMessage(msg.text, msg.role, overwrite, isTop);
      if (!history && this.textToSpeech && msg.role !== MessageUtils.USER_ROLE) {
        TextToSpeech.speak(msg.text, this.textToSpeech);
      }
    }
  }

  private tryAddFileMessages(message: MessageContentI, isTop = false) {
    if (message.files && Array.isArray(message.files)) {
      FileMessages.addMessages(this, message.files, message.role, !!message.text, isTop);
    }
  }

  private tryAddHTMLMessage(message: MessageContentI, overwrite: Overwrite, isTop = false) {
    if (message.html !== undefined && message.html !== null) {
      const scroll = !message.text && (!message.files || message.files.length === 0);
      const elements = HTMLMessages.add(this, message.html, message.role, scroll, overwrite, isTop);
      if (!isTop && HTMLActiveChatElements.isElementTemporary(elements)) delete message.html;
    }
  }

  // this should not be activated by streamed messages
  public addNewMessage(data: ResponseI, isHistory = false, isTop = false) {
    if (data.role !== MessageUtils.USER_ROLE) this._hiddenAttachments?.removeHiddenFiles();
    const message = Messages.createMessageContent(data);
    const displayText = this.textToSpeech?.audio?.displayText;
    if (typeof displayText === 'boolean' && !displayText) delete message.text;
    const overwrite: Overwrite = {status: data.overwrite}; // if did not overwrite, create a new message
    if (isTop) {
      this.tryAddHTMLMessage(message, overwrite, isTop);
      this.tryAddFileMessages(message, isTop);
      this.tryAddTextMessage(message, overwrite, data, isHistory, isTop);
    } else {
      this.tryAddTextMessage(message, overwrite, data, isHistory, isTop);
      this.tryAddFileMessages(message, isTop);
      this.tryAddHTMLMessage(message, overwrite, isTop);
    }
    if (this.isValidMessageContent(message) && !isTop) {
      this.updateStateOnMessage(message, data.overwrite, data.sendUpdate, isHistory);
    }
    if (!isHistory) this.browserStorage?.addMessages(this.messageToElements.map(([msg]) => msg));
    if (this._activeLoadingConfig) this.addLoadingMessage(false);
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
    this._hiddenAttachments?.readdHiddenFiles();
    this.removeMessageOnError();
    const text = this.getPermittedMessage(message) || this._errorMessageOverrides?.[type]
      || this._errorMessageOverrides?.default || 'Error, please try again.';
    const messageElements = this.createMessageElementsOnOrientation(text, 'error', isTop);
    MessageUtils.hideRoleElements(messageElements.innerContainer, this.avatar, this.name);
    const {bubbleElement, outerContainer} = messageElements;
    bubbleElement.classList.add(MessageUtils.ERROR_MESSAGE_TEXT_CLASS);
    this.renderText(bubbleElement, text);
    const fontElementStyles = MessageStyleUtils.extractParticularSharedStyles(['fontSize', 'fontFamily'],
      this.messageStyles?.default);
    MessageStyleUtils.applyCustomStylesToElements(messageElements, false, fontElementStyles);
    MessageStyleUtils.applyCustomStylesToElements(messageElements, false, this.messageStyles?.error);
    if (!isTop) this.appendOuterContainerElemet(outerContainer);
    if (this.textToSpeech) TextToSpeech.speak(text, this.textToSpeech);
    this._onError?.(text);
    setTimeout(() => ElementUtils.scrollToBottom(this.elementRef)); // timeout neeed when bubble font is large
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

  private addDefaultLoadingMessage(styles?: LoadingStyles, role = MessageUtils.AI_ROLE) {
    const messageElements = this.createMessageElements('', role);
    const {bubbleElement} = messageElements;
    messageElements.bubbleElement.classList.add(LoadingStyle.DOTS_CONTAINER_CLASS);
    const dotsElement = document.createElement('div');
    dotsElement.classList.add('loading-message-dots');
    bubbleElement.appendChild(dotsElement);
    LoadingStyle.setDots(bubbleElement, styles);
    return messageElements;
  }

  // prettier-ignore
  public addLoadingMessage(override = false) {
    if (MessagesBase.isLoadingMessage(this.messageElementRefs[this.messageElementRefs.length - 1]) ||
      (!this._activeLoadingConfig && !override && !this._isLoadingMessageAllowed)) return;
    const role = this._activeLoadingConfig?.role || MessageUtils.AI_ROLE;
    const style = this._activeLoadingConfig?.style || this.messageStyles?.loading?.message;
    const html = style?.html;
    const messageElements = html
      ? HTMLMessages.createElements(this, html, role, false)
      : this.addDefaultLoadingMessage(style, role);
    this.appendOuterContainerElemet(messageElements.outerContainer);
    messageElements.bubbleElement.classList.add(LoadingStyle.BUBBLE_CLASS);
    this.applyCustomStyles(messageElements, role, false, style?.styles);
    this.avatar?.getAvatarContainer(messageElements.innerContainer)?.classList.add('loading-avatar-container');
    const allowScroll = !this.focusMode && ElementUtils.isScrollbarAtBottomOfElement(this.elementRef);
    if (allowScroll) ElementUtils.scrollToBottom(this.elementRef);
  }

  private populateIntroPanel(childElement?: HTMLElement) {
    if (childElement) {
      this._introPanel = new IntroPanel(childElement);
      HTMLUtils.apply(this, this._introPanel._elementRef);
      this.elementRef.appendChild(this._introPanel._elementRef);
    }
  }

  public async addMultipleFiles(filesData: {file: File; type: MessageFileType}[], hiddenAtts: HiddenFileAttachments) {
    this._hiddenAttachments = hiddenAtts;
    return Promise.all<MessageFile>(
      (filesData || []).map((fileData) => {
        return new Promise((resolve) => {
          if (!fileData.type || fileData.type === 'any') {
            const name = fileData.file.name || FileMessageUtils.DEFAULT_FILE_NAME;
            resolve({name, type: 'any', ref: fileData.file});
          } else {
            const reader = new FileReader();
            reader.readAsDataURL(fileData.file);
            reader.onload = () => {
              const name = fileData.file.name;
              resolve({src: reader.result as string, name, type: fileData.type, ref: fileData.file});
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
      if (bubbleClasslist?.classList.contains(MessageUtils.ERROR_MESSAGE_TEXT_CLASS)) {
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
    this.browserStorage?.clear();
    this._onClearMessages?.();
    delete serviceIO.sessionId;
  }
}
