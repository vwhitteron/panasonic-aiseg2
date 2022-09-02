import { Logger } from './logger';
import { AiSEG2UIScraper } from './uiscraper';
import { deviceInstance } from './device';
import { updateLightState, DeviceIdentity } from './devices/lighting';

import { load as LoadHtml } from 'cheerio';
import { Client as SsdpClient } from 'node-ssdp';

const log = Logger.internal;

export interface ControllerOptions {
    host?: string;
    port?: number;
    password: string;
    debug?: boolean;
}

interface ControllerProperties {
    name: string;
    firmwareMain: string;
    firmwareOutput: string;
    supportCode: string;
    macAddress: string;
}

export class AiSEG2Controller {
    config: ControllerOptions;

    uiscraper!: AiSEG2UIScraper;

    properties: ControllerProperties;

    private log: Logger;

    devices: DeviceIdentity[];

    constructor(options: ControllerOptions) {
      this.config = {
        host: options.host || 'auto',
        port: options.port || 80,
        password: options.password,
      };

      if (options.debug && options.debug === true) {
        Logger.setDebugEnabled(true);
      }
      this.log = log;

      this.properties = {
        name: '',
        firmwareMain: '',
        firmwareOutput: '',
        supportCode: '',
        macAddress: '',
      };

      this.devices = new Array<DeviceIdentity>();
    }

    // Connect to the AiSEG2 controller and initialise basic info
    async connect() {
      if (this.config.host === 'auto') {
        try {
          await this.discoverControllers();
        } catch (err) {
          this.log.error(err as string);
          return;
        }
      }
      this.log.debug('Connecting to AiSEG2 controller');

      if (this.config.host === undefined || this.config.host === 'auto') {
        throw('Failed to discover any AiSEG2 controllers');
      }

      if (this.config.port === undefined) {
        throw('AiSEG2 port is not defined');
      }

      this.uiscraper = new AiSEG2UIScraper({
        host: this.config.host!,
        port: this.config.port!,
        password: this.config.password,
        logger: this.log,
      });

      await this.uiscraper.init();

      await this.getProperties();

      this.log.info(`Connected to controller ${this.properties.name}`);
    }

    /**
     * Discover AiSEG2 controllers on the local network using SSDP.
     * Currently only the first controller found will be used.
     * @internal
     *
     * @returns An string containing the IP address of a discovered AiSEG2 controller
     */
    discoverControllers() : Promise<string> {
      this.log.debug('Auto discovering AiSEG2 controllers');
      const _ssdp = new SsdpClient();

      return new Promise((resolve, reject) => {
        _ssdp.on('response', (headers, statusCode, rinfo) => {
          this.log.debug('Got a response to an m-search.');

          // Only process responses for the AiSEG2 URN
          if (headers.ST && headers.ST === 'urn:panasonic-com:service:p60AiSeg2DataService:1') {
            this.config.host = rinfo.address;
            //this.log.debug(headers);
            this.log.info(`Discovered controller at address ${this.config.host}`);
            resolve(this.config.host!);
            _ssdp.stop();
          } else {
            this.log.debug(`Ignoring SSDP response from search target ${headers.ST}`);
          }
        });

        _ssdp.search('urn:panasonic-com:service:p60AiSeg2DataService:1');

        setTimeout(() => {
          _ssdp.stop();
          reject('No AiSEG2 controllers discovered within the time limit');
        }, 5000);
      });
    }

    /**
     * Collects controller name, firmware and identity properties.
     *
     * @returns a dictonary containing controller properties.
     */
    async getProperties() {
      const response = await this.uiscraper.httpGet('/page/setting/etc/743');
      const $ = LoadHtml(response);

      $('#table_wrapper1 > table > tbody > tr').each((index, element) => {
        const header = $($(element).find('th')[0]).text();
        switch(header) {
          case '機器名称': {
            this.properties.name = $($(element).find('td')[0]).text();
            this.log.debug(`Controller name: ${this.properties.name}`);
            break;
          }
          case 'ファームウェア（本体）': {
            this.properties.firmwareMain = $($(element).find('td')[0]).text();
            this.log.debug(`Controller main firmware: ${this.properties.firmwareMain}`);
            break;
          }
          case 'ファームウェア（出力制御）': {
            this.properties.firmwareOutput = $($(element).find('td')[0]).text();
            this.log.debug(`Controller output firmware: ${this.properties.firmwareOutput}`);
            break;
          }
          case 'サポートコード': {
            this.properties.supportCode = $($(element).find('td')[0]).text();
            this.log.debug(`Controller support code: ${this.properties.supportCode}`);
            break;
          }
          case 'MACアドレス': {
            this.properties.macAddress = $($(element).find('td')[0]).text();
            this.log.debug(`Controller MAC address: ${this.properties.macAddress}`);
            break;
          }
        }
      });
    }

    /**
     * Enumerates all devices managed by the AiSEG2 controller.
     *
     * @returns an array of device objects
     */
    async getDevices() {
      const wirelessDevices = await this.getWirelessDevices();

      const networkDevices = await this.getNetworkDevices();

      return wirelessDevices.concat(networkDevices);
    }

    /**
     * Enumerates all wireless devices managed by the AiSEG2 controller.
     *
     * @returns an array of device objects
     */
    async getWirelessDevices(): Promise<deviceInstance[]> {
      let json: deviceInstance[] = [];

      await this.uiscraper.httpGet('/page/setting/installation/7314')
        .then( html => {
          json = this.uiscraper.extractJsonData(html);
        });

      return json;
    }

    /**
     * Enumerates all network devices managed by the AiSEG2 controller.
     *
     * @returns an array of device objects
     */
    async getNetworkDevices(): Promise<deviceInstance[]> {
      let json: deviceInstance[] = [];

      await this.uiscraper.httpGet('/page/setting/installation/7322')
        .then( html => {
          json = this.uiscraper.extractJsonData(html);
        });

      return json;
    }

    /**
     * FIXME
     *
     * @returns FIXME
     */
    async getDeviceProperties(device) {
      const properties = await updateLightState(this.uiscraper, this.log, device);

      this.log.info(`Device state: ${properties}`);

      return properties;
    }
}

export default AiSEG2Controller;