async function stylesheet(request) {
    const black = '#000019';
    const blue = '#525DDD';
    const yellow = '#F2CB04';
    return new Response(`
    @font-face {
        font-family: EvangelionRegular;
        src: url('https://files-cors.sirsean.workers.dev/fonts/EVANGELION-k227rn.ttf');
    }
    @font-face {
        font-family: EvangelionItalic;
        src: url('https://files-cors.sirsean.workers.dev/fonts/EVANGELION-ITALIC-xohlcz.ttf');
    }
    @font-face {
        font-family: SupplyMono;
        src: url('https://files-cors.sirsean.workers.dev/fonts/PPSupplyMono-Light.ttf');
    }
    body {
        margin: 0 auto;
        font-family: SupplyMono, monospace;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: ${black};
        color: white;
        min-height: 100vh;
        position: relative;
    }
    body::after {
        content: '';
        display: block;
        height: 50px;
    }
    footer {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 50px;
        text-align: center;
    }
    a {
        color: ${blue};
        text-decoration: none;
    }
    h1 {
        font-family: EvangelionItalic;
        font-weight: 100;
        padding: 0;
        margin: 0.2em;
        font-size: 3.5em;
        color: ${blue};
    }
    h2 {
        font-family: EvangelionRegular;
        font-weight: 100;
        padding: 0;
        margin: 0.2em;
        font-size: 2.5em;
        color: ${blue};
    }
    .runner {
        display: flex;
        flex-direction: column;
    }
    .runner .row {
        margin: 8px 0;
        display: flex;
        flex-direction: row;
    }
    .runner .left {
        width: 400px;
    }
    .runner .right {
        display: flex;
        flex-direction: column;
        margin: 0 8px;
    }
    @media (max-width: 800px) {
        .runner .row {
            flex-direction: column;
        }
        .runner .left {
            width: 100%;
        }
    }
    .runner .attr {
        font-size: 1.8em;
    }
    .runner .attr .name {
        color: ${blue};
    }
    .runner .attr .value {
        color: ${yellow};
    }
    .runner .links {
        display: flex;
        flex-direction: row;
    }
    .runner .links a {
        background-color: ${blue};
        color: white;
        font-size: 1.6em;
        padding: 8px 6px 4px 6px;
        margin: 6px;
        text-decoration: none;
        border-bottom: 2px solid ${yellow};
    }
    .imgWrapper {
        border: 4px solid ${yellow};
        padding: 14px;
    }
    img.runner {
        width: 100%;
        border-radius: 1px;
    }
    .owner {
        padding: 5px;
        color: ${black};
        background-color: ${yellow};
        font-size: 1.2em;
        width: 100%;
    }
    div.narrative {
        display: block;
        padding: 0.05em 1em;
        margin: 0.2em;
        font-size: 1.5em;
        background-color: #2C2E3B;
        border-radius: 5px;
        width: 100%;
    }
    table {
        font-size: 2em;
        margin: 1em 1.5em;
        padding: 14px;
        border: 4px solid ${yellow};
    }
    table th {
        text-align: right;
        padding-right: 0.4em;
        font-weight: normal;
        color: ${blue};
    }
    table td {
        color: ${yellow};
    }
    form {
        margin: 2em;
    }
    input {
        border: none;
        border-bottom: 1px solid ${blue};
        background-color: ${black};
        color: ${yellow};
        outline: none;
        font-family: 'SupplyMono', monospace;
        font-size: 2.4em;
        width: 3em;
        text-align: center;
    }
    button {
        background-color: ${black};
        border: 1px solid ${blue};
        border-radius: 3px;
        font-family: 'SupplyMono', monospace;
        color: ${yellow};
        font-size: 1.8em;
        padding: 0.25em 0.3em 0.05em 0.3em;
    }
    ol.run-list {
        margin-left: 4em;
        font-size: 1.5em;
    }
    ol.run-list a {
        color: ${yellow};
    }
    `);
}

export default stylesheet;
