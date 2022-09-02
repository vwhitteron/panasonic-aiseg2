# panasonic-aiseg2
A Node.js library for interacting with Panasonic AiSEG2 HEMS controllers.

## Example usage

```
import { AiSEG2Controller } from './controller';

async function main(): Promise<void> {

  const ctlr = new AiSEG2Controller({
    host: '10.0.0.14',
    port: 8190,
    password: 'aiseg2',
    debug: true,
  });

  await ctlr.connect();

  ctlr.getProperties()
    .then(result => {
      console.log(result);
    });

  const deviceList = await ctlr.getDevices();

  console.log(JSON.stringify(deviceList, null, 2));

}

main();
```