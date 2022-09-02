// import { request as HttpRequest } from 'urllib';
import { load as LoadHtml } from 'cheerio';
import { Logger } from '../logger';
// import { AiSEG2Controller } from '../controller';
import { AiSEG2UIScraper } from '../uiscraper';


// Error: /page/devices/device/323
// Lighting device list: /page/devices/device/32i

export interface DeviceIdentity {
  displayName: string;
  nodeId: string;
  eoj: string;
  type: string;
  nodeIdentNum: string;
  deviceId: string;
}

export interface DeviceProperties {
  disable: string;
  state: string;
  dimmable: boolean;
  brightness: number;
}

// enum CheckResult {
//   OK = '0',
//   InProgress = '1',
//   Invalid = '2',
// }

// enum LightState {
//   On = '0x30',
//   Off = '0x31',
// }

/**
 * Fetches all lighting devices from the AiSEG2 controller.
 * @public
 *
 * @param uiscraper - A UI scraper object to use for lighting discovery.
 * @param log - A logger object for writing logs.
 * @returns An array of lighting device objects.
 */
export async function discoverLighting(uiscraper: AiSEG2UIScraper, log: Logger) : Promise<DeviceIdentity[]> {
  const url = '/page/devices/device/32i1?page=1';
  const devices = new Array<DeviceIdentity>();

  await uiscraper.httpGet(url)
    .then( html => {
      const $ = LoadHtml(html);

      $('.panel').each((index, element) => {
        const deviceData: DeviceIdentity = {
          displayName:  $($(element).find('.lighting_title')[0]).text() || '',
          nodeId:       $(element).attr('nodeid') || '',
          eoj:          $(element).attr('eoj') || '',
          type:         $(element).attr('type') || '',
          nodeIdentNum: $(element).attr('nodeidentnum') || '',
          deviceId:     $(element).attr('deviceid') || '',
        };

        log.info(`Discovered lighting device '${deviceData.displayName}'`);
        log.debug(JSON.stringify(deviceData));

        devices.push(deviceData);
      });
    });

  return devices;
}

/**
 * Fetches the current properites of a given lighting device.
 * #public
 *
 * @param uiscraper - A UI scraper object to use for lighting discovery.
 * @param log - A logger object for writing logs.
 * @param deviceData - A DeviceIdentity object for the device being fetched
 * @returns A DeviceProperties object with the current property values
 */
export async function updateLightState(uiscraper: AiSEG2UIScraper, log: Logger, deviceData: DeviceIdentity) : Promise<DeviceProperties> {
  const url = '/data/devices/device/32i1/auto_update';
  const payload = `data={"page":"1","list":[${JSON.stringify(deviceData)}]}`;
  const properties = {} as DeviceProperties;

  await uiscraper.httpPost(url, payload)
    .then( data => {
      const deviceInfo = JSON.parse(data);
      log.debug(`Device info: ${data}`);
      properties.state = deviceInfo.panelData[0].state;
      if (deviceInfo.panelData[0].modulate_hidden === 'hidden') {
        properties.dimmable = false;
      } else {
        properties.dimmable = true;
        properties.brightness = deviceInfo.panelData[0].modulate_level;
      }

      log.debug(`Device data: ${JSON.stringify(properties)}`);
    });

  return properties;
}
