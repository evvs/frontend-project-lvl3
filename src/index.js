import axios from 'axios';
import i18next from 'i18next';
import watch from './watchers';
import parseXml from './parser';
import resources from './locales';
import { validate, generateId } from './utils';

export default () => {
  const state = {
    status: 'loaded',
    rssInputForm: {
      userInput: null,
      valid: null,
      errors: {},
    },
    feeds: {
      activeFeeds: [],
      lastAddedFeed: null,
    },
    loadingErrors: {},
    outputMessage: '',
  };

  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const urlInputField = document.getElementById('urlInput');
  const rssForm = document.querySelector('form');

  urlInputField.addEventListener('input', (e) => {
    state.rssInputForm.userInput = e.target.value;
    const validationErrors = validate(state.rssInputForm);
    if (validationErrors.length) {
      state.rssInputForm.valid = false;
      state.rssInputForm.errors = validationErrors;
      const { type } = validationErrors.find(({ name }) => name === 'ValidationError');
      state.outputMessage = i18next.t(`ValidationError.${type}`);
      return;
    }
    state.rssInputForm.valid = true;
  });

  rssForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const duplicate = state.feeds.activeFeeds
      .find(({ id }) => id === generateId(state.rssInputForm.userInput));

    if (duplicate) {
      state.rssInputForm.valid = false;
      state.rssInputForm.errors = {
        type: 'duplicatedUrl',
      };
      state.outputMessage = i18next.t('ValidationError.duplicatedUrl');
      throw new Error('Rss already exists');
    }
    state.status = 'loading';

    const proxy = 'https://cors-anywhere.herokuapp.com';
    axios.get(`${proxy}/${state.rssInputForm.userInput}`)
      .then((response) => {
        const { data } = response;
        const feed = parseXml(data);
        feed.id = generateId(state.rssInputForm.userInput);
        state.feeds.lastAddedFeed = feed;
        state.feeds.activeFeeds.push(feed);
        state.status = 'loaded';
      })
      .catch((err) => {
        state.status = 'errorWhileLoading';
        if (err.request) {
          state.loadingErrors = err.request;
          state.loadingErrors.type = 'requestError';
          state.outputMessage = i18next.t('requestError', { code: `${state.loadingErrors.status}` });
          return;
        }
        state.loadingErrors = err;
        state.loadingErrors.type = 'parsingError';
        state.outputMessage = i18next.t('parsingError');
      });
  });

  watch(state);
};
