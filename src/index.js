import { ethers } from 'ethers';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import stylesheet from './stylesheet.js';
import { fetchRunner, fetchRunnerRuns, fetchRun, fetchCurrentStreak } from './interact.js';

function runnerTitle(id, runner) {
    const talent = runner.attributes.Talent;
    const faction = runner.attributes.Faction.replace(/The /, '').replace(/s$/, '');
    return `${id} :: T${talent} ${faction}`;
}

function htmlHead(title, runner, run, currentStreak) {
    let metadata = '';
    if (run) {
        metadata = `
        <meta property="og:title" content="${title}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runner-hunter.sirsean.workers.dev" />
        <meta property="og:description" content="NP: ${run.notorietyPoints}\nDATA: ${parseInt(ethers.utils.formatUnits(run.data, 18))}" />
        `;
    } else if (currentStreak) {
        let description = `Current Streak: ${currentStreak}`;
        metadata = `
        <meta property="og:title" content="${title}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runner-hunter.sirsean.workers.dev" />
        <meta property="og:image" content="${runner.image}" />
        <meta property="og:description" content="${description}" />
        <meta name="twitter:card" content="summary_large_image">
        `;
    } else if (runner) {
        let description = `NP: ${runner.attributes['Notoriety Points']}`;
        if (runner.narrative) {
            description += `\n\n${sanitizeHtml(runner.narrative)}`;
        }
        metadata = `
        <meta property="og:title" content="${title}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runner-hunter.sirsean.workers.dev" />
        <meta property="og:image" content="${runner.image}" />
        <meta property="og:description" content="${description}" />
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

async function home(request) {
    return new Response(`
    <!html>
    ${htmlHead('2112 Runner Hunter')}
    <body>
        <h1>runner hunter</h1>
        <form action="/search">
            <input type="text" name="id" autofocus />
            <button>Hunt &gt;</button>
        </form>
    </body>
    `, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
        },
    });
}

function attrRow(name, value) {
    return `
    <div class="attr">
        <span class="name">${name}::</span>
        <span class="value">${value}</span>
    </div>
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
        const narrativeElement = (r.narrative) ? `<div class="narrative">${sanitizeHtml(marked.parse(r.narrative))}</div>` : '';
        return new Response(`
        <!html>
        ${htmlHead(title, r)}
        <body>
            <div class="runner">
                <h1><a href="/">${title}</a></h1>
                <div class="row">
                    <div class="owner">
                        OWNER:: ${r.owner.name || r.owner.addr}
                    </div>
                </div>
                <div class="row">
                    <div class="left">
                        <div class="imgWrapper">
                            <img class="runner" src="${image}" />
                        </div>
                    </div>
                    <div class="right">
                        ${attrRow('Notoriety Points', notoriety)}
                        ${Object.keys(attrs).map(k => attrRow(k, attrs[k])).join('')}
                        <div class="links">
                            <a href="/${id}/runs">Runs</a>
                            <a href="/${id}/streak">Streak</a>
                            <a target="_blank" href="https://opensea.io/assets/0xd05f71067876a68336c836ae602981728034a84c/${id}">Opensea</a>
                        </div>
                    </div>
                </div>
                <div class="row">
                    ${narrativeElement}
                </div>
                <footer>
                    <a href="https://bio-runner.pages.dev/">set a bio for your runner at bio-runner</a>
                </footer>
            </div>
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
            <h1><a href="/${id}">${title}</a></h1>
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

async function viewStreak(request, env) {
    const url = new URL(request.url);
    const re = /^\/(\d+)\/streak$/;
    const [_, id] = re.exec(url.pathname);
    return Promise.all([
        fetchRunner(env, id),
        fetchCurrentStreak(env, id),
    ]).then(([runner, streak]) => {
        const title = runnerTitle(id, runner);
        return new Response(`
        <!html>
        ${htmlHead(title, runner, null, streak)}
        <body>
            <h1><a href="/${id}">${title}</a></h1>
            <table>
                <tbody>
                    <tr>
                        <th>Current Streak</th>
                        <td>${streak}</td>
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

function formatTimestamp(timestamp) {
    if (timestamp) {
        return (new Date(timestamp * 1000)).toISOString().replace(/\.000Z$/, ' UTC');
    }
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
            <h1><a href="/${run.tokenId}/runs">${title}</a></h1>
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
                    <tr>
                        <th>started</th>
                        <td>${formatTimestamp(run.startTime)}</td>
                    </tr>
                    <tr>
                        <th>ended</th>
                        <td>${formatTimestamp(run.endTime)}</td>
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
        [/^\/\d+\/streak$/, viewStreak],
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
