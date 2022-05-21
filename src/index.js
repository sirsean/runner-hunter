import { ethers } from 'ethers';
import gameABI from './game_abi.js';
import cryptorunnerNFTABI from './cryptorunner_nft_abi.js';

let _polygon;
function polygon(env) {
    _polygon ||= new ethers.providers.StaticJsonRpcProvider({
        url: env.POLYGON_ENDPOINT,
        skipFetchSetup: true,
    });
    return _polygon;
}

let _mainnet;
function mainnet(env) {
    _mainnet ||= new ethers.providers.StaticJsonRpcProvider({
        url: env.MAINNET_ENDPOINT,
        skipFetchSetup: true,
    });
    return _mainnet;
}

const GAME_ADDR = '0x9d0c114Ac1C3cD1276B0366160B3354ca0f9377E';
let _gameContract;
function gameContract(env) {
    _gameContract ||= new ethers.Contract(GAME_ADDR, gameABI, polygon(env));
    return _gameContract;
}

const RUNNER_ADDR = '0xD05f71067876A68336c836aE602981728034a84c';
let _runnerContract;
function runnerContract(env) {
    _runnerContract ||= new ethers.Contract(RUNNER_ADDR, cryptorunnerNFTABI, mainnet(env));
    return _runnerContract;
}

function runnerTitle(id, runner) {
    const talent = runner.attributes.Talent;
    const faction = runner.attributes.Faction.replace(/The /, '').replace(/s$/, '');
    return `${id} &gt;&gt; T${talent} ${faction}`;
}

function htmlHead(title, runner, run) {
    let metadata = '';
    if (run) {
        metadata = `
        <meta property="og:title" content="${title}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runner-hunter.sirsean.workers.dev" />
        <meta property="og:description" content="NP: ${run.notorietyPoints}\nDATA: ${parseInt(ethers.utils.formatUnits(run.data, 18))}" />
        `;
    } else if (runner) {
        metadata = `
        <meta property="og:title" content="${title}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runner-hunter.sirsean.workers.dev" />
        <meta property="og:image" content="${runner.image}" />
        <meta property="og:description" content="NP: ${runner.attributes['Notoriety Points']}" />
        <meta name="twitter:card" content="summary_large_image">
        `;
    }
    return `
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        ${metadata}
        <link rel="stylesheet" href="/style.css" />
        <title>${title}</title>
    </head>
    `;
}

async function notFound(request) {
    return new Response(`
    <!html>
    ${htmlHead('not found')}
    <body>
        <h1>// runner not found //<h1>
    </body>
    `, {
        status: 404,
        statusText: 'Not Found',
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
        },
    });
}

async function favicon(request) {
    return Response.redirect('https://www.2112.run/assets/favicons/favicon.ico', 301);
}

async function stylesheet(request) {
    return new Response(`
    @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
    body {
        width: 600px;
        margin: 0 auto;
        font-family: 'VT323', monospace;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: black;
        color: white;
    }
    h1 {
        text-align: center;
        padding: 0;
        margin: 0.2em;
        font-size: 3.5em;
        color: #FF6700;
    }
    h2 {
        text-align: center;
        padding: 0;
        margin: 0.2em;
        font-size: 2.5em;
        color: #FF6700;
    }
    img.runner {
        width: 100%;
        border-radius: 10px;
    }
    table {
        margin: 0 auto;
        font-size: 2em;
    }
    table th {
        text-align: right;
        padding-right: 0.4em;
        font-weight: normal;
    }
    table td {
        color: #FBF665;
    }
    table td.opensea {
        text-align: center;
    }
    table td.opensea a {
        color: #FF6700;
        font-size: 1.6em;
    }
    form {
        margin: 2em;
        text-align: center;
    }
    input {
        border: none;
        border-bottom: 1px solid #FF6700;
        background-color: black;
        color: #FBF665;
        outline: none;
        font-family: 'VT323', monospace;
        font-size: 2.4em;
        width: 3em;
        text-align: center;
    }
    button {
        background-color: black;
        border: 1px solid #FF6700;
        border-radius: 3px;
        font-family: 'VT323', monospace;
        color: #FBF665;
        font-size: 1.8em;
        padding: 0.15em 0.3em;
    }
    ol.run-list {
        margin-left: 4em;
        font-size: 1.5em;
    }
    ol.run-list a {
        color: #FBF665;
    }
    `);
}

async function home(request) {
    return new Response(`
    <!html>
    ${htmlHead('2112 Runner Hunter')}
    <body>
        <h1>$&gt; find a runner</h1>
        <form action="/search">
            <input type="text" name="id" />
            <button>Hunt &gt;</button>
        </form>
    </body>
    `, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
        },
    });
}

async function fetchRunner(env, id) {
    return Promise.all([
        fetch(`https://mint.2112.run/tokens721/${id}.json`).then(r => r.json()),
        gameContract(env).cryptoRunners(id),
        runnerContract(env).ownerOf(id),
    ]).then(([runner, chain, owner]) => {
        runner.attributes['Notoriety Points'] = chain.notorietyPoints.toNumber();
        runner.owner = owner;
        return runner;
    });
}

async function fetchRunnerRuns(env, id) {
    return gameContract(env).getRunsByRunner(id).then(runIds => {
        return runIds.slice().reverse();
    });
}

async function fetchRun(env, id) {
    return gameContract(env).runsById(id);
}

function attrRow(name, value) {
    return `
    <tr>
        <th>${name}</th>
        <td>${value}</td>
    </tr>
    `;
}

async function runner(request, env) {
    const url = new URL(request.url);
    const re = /^\/(\d+)$/;
    const [_, id] = re.exec(url.pathname);
    return fetchRunner(env, id).then(r => {
        const title = runnerTitle(id, r);
        const image = r.image;
        const attrs = Object.assign({}, r.attributes);
        const notoriety = attrs['Notoriety Points'];
        ['Faction', 'Talent', 'Notoriety Points'].forEach(k => delete attrs[k]);
        return new Response(`
        <!html>
        ${htmlHead(title, r)}
        <body>
            <h1>${title}</h1>
            <img class="runner" src="${image}" />
            <table>
                <tbody>
                    ${attrRow('Notoriety Points', notoriety)}
                    ${Object.keys(attrs).map(k => attrRow(k, attrs[k])).join('')}
                </tbody>
            </table>
            <table>
                <tbody>
                    ${attrRow('Owner', r.owner)}
                    <tr>
                        <td class="opensea" colspan="2">
                            <a href="/${id}/runs">Runs</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="opensea" colspan="2">
                            <a target="_blank" href="https://opensea.io/assets/0xd05f71067876a68336c836ae602981728034a84c/${id}">Opensea</a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </body>
        `, {
            headers: {
                'Content-Type': 'text/html;charset=UTF-8',
            },
        });
    }).catch(e => {
        console.error(e);
        return notFound(request);
    });
}

async function search(request, env) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    url.pathname = id;
    url.search = '';
    return Response.redirect(url.href, 301);
}

function linkToRun(runId) {
    return `
    <li><a href="/run/${runId}">${runId}</a></li>
    `;
}

async function runs(request, env) {
    const url = new URL(request.url);
    const re = /^\/(\d+)\/runs$/;
    const [_, id] = re.exec(url.pathname);
    return Promise.all([
        fetchRunner(env, id),
        fetchRunnerRuns(env, id),
    ]).then(([runner, runIds]) => {
        const title = runnerTitle(id, runner);
        return new Response(`
        <!html>
        ${htmlHead(title, runner)}
        <body>
            <h1>${title}</h1>
            <ol class="run-list" reversed>
                ${runIds.map(runId => linkToRun(runId)).join('')}
            </ol>
        </body>
        `, {
            headers: {
                'Content-Type': 'text/html;charset=UTF-8',
            },
        });
    }).catch(e => {
        console.error(e);
        return notFound(request);
    });
}

async function viewRun(request, env) {
    const url = new URL(request.url);
    const re = /^\/run\/(.+)$/;
    const [_, runId] = re.exec(url.pathname);
    return fetchRun(env, runId).then(run => {
        return Promise.all([
            run,
            fetchRunner(env, run.tokenId),
        ]);
    }).then(([run, runner]) => {
        const title = runnerTitle(run.tokenId, runner);
        return new Response(`
        <!html>
        ${htmlHead(title, runner, run)}
        <body>
            <h1>${title}</h1>
            <h2>${runId}</h1>
            <table>
                <tbody>
                    <tr>
                        <th>NP</th>
                        <td>${run.notorietyPoints}</td>
                    </tr>
                    <tr>
                        <th>$DATA</th>
                        <td>${parseInt(ethers.utils.formatUnits(run.data, 18))}</td>
                    </tr>
                    <tr>
                        <th>runtime</th>
                        <td>${parseInt((run.endTime - run.startTime)/60)}m</td>
                    </tr>
                </tbody>
            </table>
        </body>
        `, {
            headers: {
                'Content-Type': 'text/html;charset=UTF-8',
            },
        });
    }).catch(e => {
        console.error(e);
        return notFound(request);
    });
}

function handler(pathname) {
    const routes = [
        [/^\/$/, home],
        [/^\/favicon.ico$/, favicon],
        [/^\/style.css$/, stylesheet],
        [/^\/search$/, search],
        [/^\/run\/.+$/, viewRun],
        [/^\/\d+\/runs$/, runs],
        [/^\/\d+/, runner],
    ];

    for (let i=0; i < routes.length; i++) {
        const [re, handler] = routes[i];
        if (re.test(pathname)) {
            return handler;
        }
    }
    console.log(pathname, 'not found');

    return notFound;
}

export default {
  async fetch(request, env, context) {
      const url = new URL(request.url);
      return handler(url.pathname)(request, env);
  },
};
