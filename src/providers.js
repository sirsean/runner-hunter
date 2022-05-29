import { ethers } from 'ethers';

let _polygon;
export function polygon(env) {
    _polygon ||= new ethers.providers.StaticJsonRpcProvider({
        url: env.POLYGON_ENDPOINT,
        skipFetchSetup: true,
    });
    return _polygon;
}

let _mainnet;
export function mainnet(env) {
    _mainnet ||= new ethers.providers.StaticJsonRpcProvider({
        url: env.MAINNET_ENDPOINT,
        skipFetchSetup: true,
    });
    return _mainnet;
}
