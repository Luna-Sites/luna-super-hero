import { serializeNodes } from '@plone/volto-slate/editor/render';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import { isInternalURL, flattenToAppURL } from '@plone/volto/helpers';

export const getFieldURL = (data) => {
  if (isArray(data)) {
    return data.map((item) => getFieldURL(item));
  }

  if (isObject(data)) {
    if (data.encoding === 'base64' && data.data) {
      return `data:${data['content-type']};base64,${data.data}`;
    }
  }

  let url = data;
  console.log({ data });
  if (!data) return '';

  const backgroundVideo = url.includes('@@download')
    ? url
    : `${flattenToAppURL(url)}/@@download/file`;

  return backgroundVideo;
  // If data is an object but doesn't contain a URL, return undefined.
  return undefined;
};

const createEmptyHeader = () => {
  return {
    type: 'h2',
    children: [{ text: '' }],
  };
};

export const createSlateHeader = (text) => {
  return isArray(text) ? text : [createEmptyHeader()];
};

export const serializeText = (text) => {
  return isArray(text) ? serializeNodes(text) : text;
};

export const isImageGif = (image) => {
  return image?.endsWith?.('.gif');
};
