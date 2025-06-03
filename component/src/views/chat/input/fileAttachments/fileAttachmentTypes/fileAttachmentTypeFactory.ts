import {ServiceFileTypes, ServiceIO} from '../../../../../services/serviceIO';
import {FileAttachments} from '../../../../../types/fileAttachments';
import {AudioFileAttachmentType} from './audioFileAttachmentType';
import {FileAttachmentsType} from './fileAttachmentsType';
import {ActiveChat} from '../../../../../activeChat';

export class FileAttachmentTypeFactory {
  // prettier-ignore
  public static create(activeChat: ActiveChat, serviceIO: ServiceIO, files: FileAttachments,
      toggleContainer: (display: boolean) => void, container: HTMLElement, type: keyof ServiceFileTypes) {
    if (type === 'audio') {
      return new AudioFileAttachmentType(activeChat, serviceIO, files, toggleContainer, container);
    }
    return new FileAttachmentsType(activeChat, serviceIO, files, toggleContainer, container);
  }
}
