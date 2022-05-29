import { ethers } from 'ethers';
import gameABI from './abi/game_abi.js';
import cryptorunnerNFTABI from './abi/cryptorunner_nft_abi.js';
import RunnerNarrativeABI from './abi/RunnerNarrative.js';
import { polygon, mainnet } from './providers.js';

const GAME_ADDR = '0x9d0c114Ac1C3cD1276B0366160B3354ca0f9377E';
let _gameContract;
export function gameContract(env) {
    _gameContract ||= new ethers.Contract(GAME_ADDR, gameABI, polygon(env));
    return _gameContract;
}

const NARRATIVE_ADDR = '0x40632f44E5CF7F7A229F4b0c018282fad8534ede';
let _narrativeContract;
export function narrativeContract(env) {
    _narrativeContract ||= new ethers.Contract(NARRATIVE_ADDR, RunnerNarrativeABI, polygon(env));
    return _narrativeContract;
}

const RUNNER_ADDR = '0xD05f71067876A68336c836aE602981728034a84c';
let _runnerContract;
export function runnerContract(env) {
    _runnerContract ||= new ethers.Contract(RUNNER_ADDR, cryptorunnerNFTABI, mainnet(env));
    return _runnerContract;
}
