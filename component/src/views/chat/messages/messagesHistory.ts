import {HistoryMessage, LoadHistory} from '../../../types/history';
import {ElementUtils} from '../../../utils/element/elementUtils';
import {MessageContent} from '../../../types/messages';
import {ServiceIO} from '../../../services/serviceIO';
import {Legacy} from '../../../utils/legacy/legacy';
import {ActiveChat} from '../../../activeChat';
import {Messages} from './messages';

export class MessagesHistory {
  private readonly _messages: Messages;
  private _isLoading = false;
  private _isComplete = false;

  constructor(activeChat: ActiveChat, messages: Messages, serviceIO: ServiceIO) {
    this._messages = messages;
    this.populateHistory(activeChat);
    if (serviceIO.fetchHistory) this.fetchHistory(serviceIO.fetchHistory); // direct service
    if (activeChat.loadHistory) this.setupLoadHistory(activeChat, activeChat.loadHistory); // custom service
  }

  private async loadInitialHistory(activeChat: ActiveChat, loadHistory: LoadHistory) {
    const messages = await loadHistory(0);
    this._isComplete = !messages.find((message) => !message);
    const messageContent = messages.filter((message) => !!message);
    this.populateHistory(activeChat, messageContent);
  }

  private processLoadedHistory(historyMessages: HistoryMessage[]) {
    this._isLoading = true;
    const firstMessageEl = this._messages.messageElementRefs[0]?.outerContainer;
    const currentScrollTop = this._messages.elementRef.scrollTop;
    historyMessages
      ?.reverse()
      .map((message) => {
        if (message) {
          const messageContent = this._messages.addAnyMessage({...message, sendUpdate: true}, true, true);
          if (messageContent) this._messages.messages.unshift(messageContent);
          return messageContent;
        } else {
          this._isComplete = true;
        }
      })
      .filter((message) => !!message)
      .reverse()
      .forEach((messageContent) => this._messages.sendClientUpdate(messageContent, true));
    if (firstMessageEl) this._messages.elementRef.scrollTop = currentScrollTop + firstMessageEl.offsetTop;
    this._isLoading = false;
  }

  private async setupLoadHistory(activeChat: ActiveChat, loadHistory: LoadHistory) {
    this._messages.elementRef.onscroll = async () => {
      if (!this._isLoading && !this._isComplete && this._messages.elementRef.scrollTop === 0) {
        const messages = await loadHistory(0);
        this.processLoadedHistory(messages);
      }
    };
    const history = activeChat.history || Legacy.processHistory(activeChat);
    if (!history) this.loadInitialHistory(activeChat, loadHistory);
  }

  private populateHistory(activeChat: ActiveChat, historyArg?: MessageContent[]) {
    const history = activeChat.history || Legacy.processHistory(activeChat) || historyArg;
    if (!history) return;
    history.forEach((message) => {
      Legacy.processHistoryFile(message);
      this._messages.addNewMessage(message, true);
    });
    // attempt to wait for the font file to be downloaded as otherwise text dimensions change after scroll
    // the timeout is sometimes not long enough - see the following on how users can fix it:
    // https://github.com/OvidijusParsiunas/deep-chat/issues/84
    setTimeout(() => ElementUtils.scrollToBottom(this._messages.elementRef), 0);
  }

  private async fetchHistory(ioFetchHistory: Required<ServiceIO>['fetchHistory']) {
    const history = await ioFetchHistory();
    history.forEach((message) => this._messages.addAnyMessage(message, true));
    // https://github.com/OvidijusParsiunas/deep-chat/issues/84
    setTimeout(() => ElementUtils.scrollToBottom(this._messages.elementRef), 0);
  }
}
