import { ethers } from 'ethers';
import { mainnet } from './providers.js';
import { gameContract, narrativeContract, runnerContract } from './contracts.js';

async function lookupEns(env, addr) {
    return mainnet(env).lookupAddress(addr).then(name => {
        return { addr, name };
    });
}

export async function fetchRunner(env, id) {
    return Promise.all([
        fetch(`https://mint.2112.run/tokens721/${id}.json`).then(r => r.json()),
        gameContract(env).cryptoRunners(id),
        runnerContract(env).ownerOf(id).then(addr => lookupEns(env, addr)),
        narrativeContract(env).narrative(id),
    ]).then(([runner, chain, owner, narrative]) => {
        runner.attributes['Notoriety Points'] = chain.notorietyPoints.toNumber();
        runner.owner = owner;
        runner.narrative = narrative;
        return runner;
    });
}

export async function fetchRunnerRuns(env, id) {
    return gameContract(env).getRunsByRunner(id).then(runIds => {
        return runIds.slice().reverse();
    });
}

export async function fetchRun(env, id) {
    return gameContract(env).runsById(id);
}

function isWinningRun({ notorietyPoints }) {
    return (notorietyPoints.eq(ethers.BigNumber.from(10)) || notorietyPoints.eq(ethers.BigNumber.from(13)));
}

export async function fetchCurrentStreak(env, id) {
    return fetchRunnerRuns(env, id)
        .then(async (runIds) => {
            let streak = 0;
            for (let i=0; i < runIds.length; i++) {
                const run = await fetchRun(env, runIds[i]);
                if (isWinningRun(run)) {
                    streak++;
                } else {
                    break;
                }
            }
            return streak;
        });
}
