import {InterfacesUnion} from './utilityTypes';

// https://platform.openai.com/docs/api-reference/audio/createSpeech
export type OpenAITextToSpeech = {
  model?: string;
  voice?: string;
  speed?: number;
};

// https://platform.openai.com/docs/guides/speech-to-text
// https://platform.openai.com/docs/api-reference/audio/createTranscription
// https://platform.openai.com/docs/api-reference/audio/create
export type OpenAISpeechToText = {
  model?: string;
  temperature?: number;
  language?: string; // https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes - 639-1 format
  type?: 'transcription' | 'translation';
};

// https://platform.openai.com/docs/api-reference/images
export interface OpenAIImages {
  model?: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024';
  response_format?: 'url' | 'b64_json';
  user?: string;
}

export type FunctionsDetails = {name: string; arguments: string}[];

export type AssistantFunctionHandlerResponse = string[] | Promise<string[]>;

export type AssistantFunctionHandler = (functionsDetails: FunctionsDetails) => AssistantFunctionHandlerResponse;

// https://platform.openai.com/docs/api-reference/assistants/createAssistant
export interface OpenAINewAssistant {
  model?: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: {
    type: 'code_interpreter' | 'retrieval' | 'function';
    function?: {name: string; description?: string; parameters?: object};
  }[];
  file_ids?: string[];
}

// https://platform.openai.com/docs/api-reference/assistants
export interface OpenAIAssistant {
  assistant_id?: string;
  thread_id?: string;
  load_thread_history?: boolean;
  new_assistant?: OpenAINewAssistant;
  function_handler?: AssistantFunctionHandler;
}

export type ChatFunctionHandlerResponse = InterfacesUnion<{response: string}[] | {text: string}>;

export type ChatFunctionHandler = (
  functionsDetails: FunctionsDetails
) => ChatFunctionHandlerResponse | Promise<ChatFunctionHandlerResponse>;

export interface OpenAIChatFunctions {
  // parameters use the JSON Schema type
  tools?: {type: 'function' | 'object'; function: {name: string; description?: string; parameters: object}}[];
  tool_choice?: 'auto' | {type: 'function'; function: {name: string}};
  function_handler?: ChatFunctionHandler;
}

// https://platform.openai.com/docs/api-reference/chat
export type OpenAIChat = {
  system_prompt?: string;
  model?: string;
  max_tokens?: number; // number of tokens to reply - recommended to be set by the client
  temperature?: number;
  top_p?: number;
} & OpenAIChatFunctions;

export interface OpenAI {
  chat?: true | OpenAIChat;
  assistant?: true | OpenAIAssistant;
  images?: true | OpenAIImages;
  textToSpeech?: true | OpenAITextToSpeech;
  speechToText?: true | OpenAISpeechToText;
}
