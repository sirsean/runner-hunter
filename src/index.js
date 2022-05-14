function runnerTitle(id, runner) {
    const talent = runner.attributes.Talent;
    const faction = runner.attributes.Faction.replace(/The /, '').replace(/s$/, '');
    return `${id} &gt;&gt; T${talent} ${faction}`;
}

function htmlHead(title, runner) {
    let metadata = '';
    if (runner) {
        metadata = `
        <meta property="og:title" content="${title}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runner-hunter.sirsean.workers.dev" />
        <meta property="og:image" content="${runner.image}" />
        <meta property="og:description" content="${title}" />
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

async function fetchRunner(id) {
    return fetch(`https://mint.2112.run/tokens721/${id}.json`).then(r => r.json());
}

function attrRow(name, value) {
    return `
    <tr>
        <th>${name}</th>
        <td>${value}</td>
    </tr>
    `;
}

async function runner(request) {
    const url = new URL(request.url);
    const re = /^\/(\d+)$/;
    const [_, id] = re.exec(url.pathname);
    return fetchRunner(id).then(r => {
        const title = runnerTitle(id, r);
        const image = r.image;
        const attrs = Object.assign({}, r.attributes);
        ['Faction', 'Talent'].forEach(k => delete attrs[k]);
        return new Response(`
        <!html>
        ${htmlHead(title, r)}
        <body>
            <h1>${title}</h1>
            <img class="runner" src="${image}" />
            <table>
                <tbody>
                ${Object.keys(attrs).map(k => attrRow(k, attrs[k])).join('')}
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

async function search(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    url.pathname = id;
    url.search = '';
    return Response.redirect(url.href, 301);
}

function handler(pathname) {
    const routes = [
        [/^\/$/, home],
        [/^\/favicon.ico$/, favicon],
        [/^\/style.css$/, stylesheet],
        [/^\/search$/, search],
        [/^\/\d+/, runner],
    ];

    for (let i=0; i < routes.length; i++) {
        const [re, handler] = routes[i];
        if (re.test(pathname)) {
            return handler;
        }
    }

    return notFound;
}

export default {
  async fetch(request) {
      const url = new URL(request.url);
      return handler(url.pathname)(request);
      //return fetch('https://mint.2112.run/tokens721/1990.json').then(r => r.json())
      //  .then(x => {
      //      return new Response(x.name);
      //  });
  },
};
