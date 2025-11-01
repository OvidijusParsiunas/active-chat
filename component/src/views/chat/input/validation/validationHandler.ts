import {BrowserStorage} from '../../messages/browserStorage/browserStorage';
import {FileAttachments} from '../fileAttachments/fileAttachments';
import {UserContentI} from '../../../../types/messagesInternal';
import {SubmitButton} from '../buttons/submit/submitButton';
import {Websocket} from '../../../../utils/HTTP/websocket';
import {ServiceIO} from '../../../../services/serviceIO';
import {Legacy} from '../../../../utils/legacy/legacy';
import {TextInputEl} from '../textInput/textInput';
import {ActiveChat} from '../../../../activeChat';
import {Demo} from '../../../../utils/demo/demo';

type ValidateFunc = (text?: string, files?: File[], isProgrammatic?: boolean) => boolean;

export class ValidationHandler {
  // prettier-ignore
  private static validate(validation: ValidateFunc, submitButton: SubmitButton,
      text?: string, files?: File[], browserStorage?: BrowserStorage, isProgrammatic?: boolean) {
    const isValid = validation(text as string, files, isProgrammatic);
    if (isValid) {
      submitButton.changeToSubmitIcon();
    } else {
      submitButton.changeToDisabledIcon();
    }
    browserStorage?.addInputText(text || '');
    return isValid;
  }

  // prettier-ignore
  private static async useValidationFunc(validation: ValidateFunc, textInput: TextInputEl,
      fileAttachments: FileAttachments, submitButton: SubmitButton, browserStorage?: BrowserStorage) {
    const text = textInput.isTextInputEmpty() ? '' : textInput.inputElementRef.textContent;
    await fileAttachments.completePlaceholders();
    const uploadedFilesData = fileAttachments.getAllFileData();
    const fileData = uploadedFilesData?.map((fileData) => fileData.file);
    return ValidationHandler.validate(validation, submitButton, text as string, fileData, browserStorage);
  }

  // prettier-ignore
  private static async useValidationFuncProgrammatic(validation: ValidateFunc,
      programmatic: UserContentI, submitButton: SubmitButton, browserStorage?: BrowserStorage) {
    const files = programmatic.files?.map((file) => file.file);
    return ValidationHandler.validate(validation, submitButton, programmatic.text, files, browserStorage, true);
  }

  private static validateWebsocket(serviceIO: ServiceIO, submitButton: SubmitButton) {
    const {websocket, connectSettings} = serviceIO;
    if (websocket && connectSettings.url !== Demo.URL && !Websocket.canSendMessage(websocket)) {
      submitButton.changeToDisabledIcon();
      return false;
    }
    return true;
  }

  // prettier-ignore
  public static attach(activeChat: ActiveChat, serviceIO: ServiceIO, textInput: TextInputEl,
      fileAttachments: FileAttachments, submitButton: SubmitButton, browserStorage?: BrowserStorage) {
    const validateInput = activeChat.validateInput || Legacy.processValidateInput(activeChat);
    activeChat._validationHandler = async (programmatic?: UserContentI) => {
      if (submitButton.status.loadingActive || submitButton.status.requestInProgress) return false;
      if (serviceIO.isSubmitProgrammaticallyDisabled === true) return false;
      if (!ValidationHandler.validateWebsocket(serviceIO, submitButton)) return false;
      const validation = validateInput || serviceIO.canSendMessage;
      if (validation) {
        if (programmatic) {
          return ValidationHandler.useValidationFuncProgrammatic(validation, programmatic, submitButton, browserStorage);
        }
        return ValidationHandler.useValidationFunc(validation, textInput, fileAttachments, submitButton, browserStorage);
      }
      return null;
    };
  }
}
