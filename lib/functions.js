const { default: got, HTTPError } = require("got/dist/source");
const fetch = require("node-fetch");
const { getBase64 } = require("./fetcher");
const request = require("request");
const emoji = require("emoji-regex");
const fs = require("fs-extra");
const https = require('https');

const liriklagu = async (lagu) => {
    const response = await fetch(
        `https://scrap.terhambar.com/lirik?word=${lagu}`,
        { agent: new https.Agent({ rejectUnauthorized: false }) }
    );
    if (!response.ok)
        throw new Error(`unexpected response ${response.statusText}`);
    const json = await response.json();
    if (json.status === true) return `Lyrics ${lagu}\n\n${json.result.lirik}`;
    return `[ Error ] Lyrics for ${lagu} not found!`;
};

const quotemaker = async (quotes, author = "AdiBot", type = "random") => {
    var q = quotes.replace(/ /g, "%20").replace("\n", "%5Cn");
    const response = await fetch(
        `https://terhambar.com/aw/qts/?kata=${q}&author=${author}&tipe=${type}`
    );
    if (!response.ok)
        throw new Error(`unexpected response ${response.statusText}`);
    const json = await response.json();
    if (json.status) {
        if (json.result !== "") {
            const base64 = await getBase64(json.result);
            return base64;
        }
    }
};

const emojiStrip = (string) => {
    return string.replace(emoji, "");
};
const fb = async (url) => {
    const response = await fetch(`http://scrap.terhambar.com/fb?link=${url}`);
    if (!response.ok)
        throw new Error(`unexpected response ${response.statusText}`);
    const json = await response.json();
    if (json.status === true)
        return {
            capt: json.result.title,
            exts: ".mp4",
            url: json.result.linkVideo.sdQuality,
        };
    return {
        capt: "[ ERROR ] Not found!",
        exts: ".jpg",
        url: "https://c4.wallpaperflare.com/wallpaper/976/117/318/anime-girls-404-not-found-glowing-eyes-girls-frontline-wallpaper-preview.jpg",
    };
};

const ss = async (query) => {
    request(
        {
            url: "https://api.apiflash.com/v1/urltoimage",
            encoding: "binary",
            qs: {
                access_key: "2fc9726e595d40eebdf6792f0dd07380",
                url: query,
            },
        },
        (error, response, body) => {
            if (error) {
                console.log(error);
            } else {
                fs.writeFile(
                    "./media/img/screenshot.jpeg",
                    body,
                    "binary",
                    (error) => {
                        console.log(error);
                    }
                );
            }
        }
    );
};

const randomNimek = async (type) => {
    var url = "https://api.computerfreaker.cf/v1/";
    const nimek = await fetch(url + type);
    if (!nimek.ok) throw new Error(`unexpected response ${nimek.statusText}`);
    const resultnimek = await nimek.json();
    return resultnimek.url;
};

const sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const jadwalTv = async (query) => {
    const res = await got
        .get(`https://api.haipbis.xyz/jadwaltv/${query}`)
        .json();
    if (res.error) return res.error;
    switch (query) {
        case "antv":
            return `\t\t[ ANTV ]\n${res.join("\n")}`;
            break;
        case "gtv":
            return `\t\t[ GTV ]\n${res.join("\n")}`;
            break;
        case "indosiar":
            return `\t\t[ INDOSIAR ]\n${res.join("\n")}`;
            break;
        case "inewstv":
            return `\t\t[ iNewsTV ]\n${res.join("\n")}`;
            break;
        case "kompastv":
            return `\t\t[ KompasTV ]\n${res.join("\n")}`;
            break;
        case "mnctv":
            return `\t\t[ MNCTV ]\n${res.join("\n")}`;
            break;
        case "metrotv":
            return `\t\t[ MetroTV ]\n${res.join("\n")}`;
            break;
        case "nettv":
            return `\t\t[ NetTV ]\n${res.join("\n")}`;
            break;
        case "rcti":
            return `\t\t[ RCTI ]\n${res.join("\n")}`;
            break;
        case "sctv":
            return `\t\t[ SCTV ]\n${res.join("\n")}`;
            break;
        case "rtv":
            return `\t\t[ RTV ]\n${res.join("\n")}`;
            break;
        case "trans7":
            return `\t\t[ Trans7 ]\n${res.join("\n")}`;
            break;
        case "transtv":
            return `\t\t[ TransTV ]\n${res.join("\n")}`;
            break;
        default:
            return "[ ERROR ] Channel TV salah! silahkan cek list channel dengan mengetik perintah *!listChannel*";
            break;
    }
};

exports.liriklagu = liriklagu;
exports.quotemaker = quotemaker;
exports.randomNimek = randomNimek;
exports.fb = fb;
exports.emojiStrip = emojiStrip;
exports.sleep = sleep;
exports.jadwalTv = jadwalTv;
exports.ss = ss;
