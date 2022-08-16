// @flow
import matchAll from 'string.prototype.matchall';
import json5 from 'json5';
import { getVersionInfo } from '../versionInfo';

import { IProvider, IVersionAndStoreUrl } from './types';

export type PlayStoreGetVersionOption = {
  packageName?: string,
  fetchOptions?: any,
  ignoreErrors?: boolean,
};

export interface IPlayStoreProvider extends IProvider {
  getVersion: PlayStoreGetVersionOption => Promise<IVersionAndStoreUrl>;
}

function error(text: string) {
  return {
    message:
      'Parse Error. Your app\'s play store page doesn\'t seem to have latest app version info.',
    text,
  };
}

class PlayStoreProvider implements IProvider {
  getVersion(option: PlayStoreGetVersionOption): Promise<IVersionAndStoreUrl> {
    const opt = option || {};
    try {
      if (!opt.packageName) {
        opt.packageName = getVersionInfo().getPackageName();
      }

      const countryCode = opt.country || 'en';
      const dateNow = new Date().getTime();

      const storeUrl = `https://play.google.com/store/apps/details?id=${opt.packageName}&hl=${countryCode}&date=${dateNow}`;

      return fetch(storeUrl, opt.fetchOptions)
        .then(res => res.text())
        .then(text => {
          const matches = matchAll(text, /<script nonce=\"\S+\">AF_initDataCallback\((.*?)\);/g);

          for (const match of matches) {
            const data = json5.parse(match[1]);
            try {
              return Promise.resolve({ version: data['data'][1][2][140][0][0][0], storeUrl });
            } catch {
            }
          }

          return Promise.reject(error(text));
        });
    } catch (e) {
      if (opt.ignoreErrors) {
        console.warn(e); // eslint-disable-line no-console
      } else {
        throw e;
      }
    }
  }
}

export default new PlayStoreProvider();
