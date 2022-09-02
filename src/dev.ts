/* eslint-disable no-console */
import { AiSEG2Controller, ControllerOptions } from './controller';
//import { DeviceIdentity } from './devices/lighting';
import Server = require('./test/fixtures/server');

const config: ControllerOptions = {
  // host: 'auto',
  host: '127.0.0.1',
  // port: 8190,
  password: 'aiseg2',
  debug: false,
};

async function main(): Promise<void> {
  // Stand up a local web server for localhost targets
  if (config['host'] === '127.0.0.1') {
    Server.listen(config['port'] || 80);

    setTimeout(() => {
      Server.close();
    }, 1000);
  }

  const ctlr = new AiSEG2Controller(config);
  await ctlr.connect();

  ctlr.getProperties()
    .then(result => {
      console.log(result);
    });

  const deviceList = await ctlr.getDevices();
  //const deviceList = await ctlr.getWirelessDevices();
  console.log(JSON.stringify(deviceList, null, 2));

  //   let deviceList =Array<DeviceIdentity>();

  //   ctlr.getDevices()
  //     .then( devices => {
  //       deviceList = devices;
  //       console.log(JSON.stringify(deviceList, null, 2));
  //     });

  // for (const device of deviceList) {
  //   console.log(`Fetching state for device ${device.displayName}`);
  //   ctlr.getDeviceProperties(device)
  //     .then( properties => {
  //       console.log(JSON.stringify(properties, null, 2));
  //     });
  // }

  // setInterval(() => {
  //   console.log(JSON.stringify(deviceList, null, 2));
  // }, 1000);
}

main();
