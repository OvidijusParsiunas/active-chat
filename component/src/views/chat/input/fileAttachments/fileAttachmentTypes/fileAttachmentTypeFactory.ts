import {FileAttachments} from '../../../../../types/fileAttachments';
import {ServiceFileTypes} from '../../../../../services/serviceIO';
import {AudioFileAttachmentType} from './audioFileAttachmentType';
import {FileAttachmentsType} from './fileAttachmentsType';
import {ActiveChat} from '../../../../../activeChat';

export class FileAttachmentTypeFactory {
  // prettier-ignore
  public static create(activeChat: ActiveChat, files: FileAttachments, toggleContainer: (display: boolean) => void,
      container: HTMLElement, type: keyof ServiceFileTypes) {
    if (type === 'audio') {
      return new AudioFileAttachmentType(activeChat, files, toggleContainer, container);
    }
    return new FileAttachmentsType(activeChat, files, toggleContainer, container);
  }
}
