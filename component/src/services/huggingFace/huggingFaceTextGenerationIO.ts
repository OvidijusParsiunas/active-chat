import {HuggingFaceTextGenerationResult} from '../../types/huggingFaceResult';
import {HuggingFace} from '../../types/huggingFace';
import {HuggingFaceIO} from './huggingFaceIO';
import {Response} from '../../types/response';
import {ActiveChat} from '../../activeChat';

export class HuggingFaceTextGenerationIO extends HuggingFaceIO {
  constructor(deepChat: ActiveChat) {
    const config = deepChat.directConnection?.huggingFace?.textGeneration as NonNullable<HuggingFace['textGeneration']>;
    const apiKey = deepChat.directConnection?.huggingFace;
    super(deepChat, 'Once upon a time', 'gpt2', config, apiKey);
  }

  override async extractResultData(result: HuggingFaceTextGenerationResult): Promise<Response> {
    if (result.error) throw result.error;
    return {text: result[0].generated_text || ''};
  }
}
