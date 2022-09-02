
/**
 * Scrapes data from an AiSEG2 controller web UI
 */

import { Logger } from './logger';
import { request as HttpRequest, RequestOptions } from 'urllib';
import { load as LoadHtml } from 'cheerio';

import { deviceInstance } from './device';

/**
 * Interface implemented by UIScraper objects
 */
export interface UIScraperOptions {
    host: string;
    port: number;
    password: string;
    logger: Logger;
}

/**
 * ??
 */
export class AiSEG2UIScraper {
    host: string;

    port: number;

    private readonly password: string;

    private token!: string;

    private log: Logger;

    constructor(options: UIScraperOptions) {
      this.log = options.logger;

      this.token = 'unset';

      this.password = options.password;

      this.host = options.host || 'auto';

      this.port = options.port || 80;

      // Refresh the control token every 15 seconds
      setInterval(() => {
        if (this.token !== 'unset') {
          this.updateControlToken();
        }
      }, 60000);
    }

    async init() {
      await this.updateControlToken();
    }

    /**
     * Sends a HTTP GET request to the given URL
     *
     * @param url - The URL to send the POST request to.
     * @returns A string containing the HTTP response body.
    */
    async httpGet(url: string) : Promise<string> {
      this.log.debug(`Submitting HTTP GET to http://${this.host}:${this.port}${url}`);
      const options : RequestOptions = {
        method: 'GET',
        rejectUnauthorized: false,
        digestAuth: `aiseg:${this.password}`,
      };

      return new Promise((resolve, reject) => {
        HttpRequest(`http://${this.host}:${this.port}${url}`, options, (err, data, res) => {
          if (err) {
            reject(err);
          }
          if (res.statusCode !== 200) {
            reject(`Invalid status code <${res.statusCode}>: ${res.statusMessage}`);
          }
          this.log.debug(`${res.statusCode}`);
          this.log.debug(data);
          resolve(data.toString());
        });
      });
    }

    /**
     * Sends a HTTP POST request to the provided URL and containign the provided payload.
     *
     * @param url - The URL to send the POST request to.
     * @param payload - The POST request data.
     * @returns A string containing the HTTP response body.
     */
    httpPost(url: string, payload: string) : Promise<string> {
      this.log.debug(`Submitting HTTP POST to ${url}`);
      const options : RequestOptions = {
        method: 'POST',
        rejectUnauthorized: false,
        digestAuth: `aiseg:${this.password}`,
        data: payload,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      return new Promise((resolve, reject) => {
        HttpRequest(`http://${this.host}${url}`, options, (err, data, res) => {
          if (err) {
            reject(err);
          }
          if (res.statusCode !== 200) {
            reject(`Invalid status code <${res.statusCode}>: ${res.statusMessage}`);
          }
          resolve(data.toString());
        });
      });
    }

    /**
     * Update the AiSEG2 control token used for device action requests
     */
    updateControlToken() {
      this.httpGet('/page/devices/device/32')
        .then( response => {
          const $ = LoadHtml(response);
          this.token = $('.setting_value').html() || '';
          this.log.debug(`Updated control token to '${this.token}'`);
        })
        .catch( err => {
          this.log.error(err);
        });
    }

    /**
     * Extracts JSON data loaded from inline Javascript within an AiSEG2 HTML document
     *
     * @returns an array of device objects
     */
    extractJsonData( html: string ): deviceInstance[] {
      const $ = LoadHtml(html);

      let devices: deviceInstance[] = [];

      $('script').each((index, element) => {
        const content = $(element).html() || '';

        const pattern = /window.onload = function\(\){ init\((.*), \d\); };/;

        const match = content.match(pattern);

        if (match) {
          this.log.debug(`Found Wireless device data at script index ${index}: ${content}`);

          devices = JSON.parse(match[1]) || [];
        }
      });

      return devices;
    }

}