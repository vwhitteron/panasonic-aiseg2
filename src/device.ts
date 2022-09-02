export interface deviceIdentity {
    nodeId: string;
    eoj: string;
    type: string;
    nodeIdentNum: string;
    deviceId: string;
}

export interface deviceInstance {
    devMode: string;
    devName: string;
    devType: string;
    devMaker: string;
    uniqueNo: string;
    node_uniqueNo: string;
    productCode: string;
    makerCode: string;
    powerStatus: string;
    eoj: string;
    nodeId: string;
    deviceId: string;
    supported: string;
    objNum?: string;
    productCodeAscII?: string;
}