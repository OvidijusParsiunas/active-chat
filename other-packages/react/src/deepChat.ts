import {DeepChat as DeepChatCore} from 'deep-chat-dev';
import {createComponent} from '@lit-labs/react';
import * as React from 'react';

export const DeepChat = createComponent({
  tagName: 'deep-chat',
  elementClass: DeepChatCore,
  react: React,
  events: {
    onactivate: 'activate',
    onchange: 'change',
  },
});
