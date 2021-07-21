const { decryptMedia } = require("@open-wa/wa-decrypt");
const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");
const get = require("got");
const color = require("./lib/color");
const { exec } = require("child_process");
const nhentai = require("nhentai-js");
const { API } = require("nhentai-api");
const { liriklagu, quotemaker, randomNimek, fb } = require("./lib/functions");
const { help, info } = require("./lib/help");
const nsfw_ = JSON.parse(fs.readFileSync("./lib/NSFW.json"));
const enabledgrps = JSON.parse(fs.readFileSync("./lib/groups.json"));
const {
    RemoveBgResult,
    removeBackgroundFromImageBase64,
    removeBackgroundFromImageFile,
} = require("remove.bg");
const ytdl = require("ytdl-core");
const InstagramApi = require("simple-instagram-api");
const fbdl = require("fbdl-core");

const config = process.env.config ? process.env : require("./config");

moment.tz.setDefault("Asia/Kolkata").locale("in");

module.exports = msgHandler = async (client, message) => {
    try {
        const {
            type,
            id,
            t,
            sender,
            isGroupMsg,
            chat,
            chatId,
            // caption,
            isMedia,
            mimetype,
            quotedMsg,
            quotedMsgObj,
        } = message;
        // const chat = await client.getChatById(chatId);
        if (!sender) return;
        let { body, caption } = message;
        const { name, formattedTitle } = chat;
        let pushname = "";
        pushname = sender.pushname || sender.verifiedName;
        if (pushname == undefined) pushname = config.ownerName;
        if (typeof body === "object" && quotedMsg) body = quotedMsgObj.body;
        if (body && body.startsWith("! ")) body = body[0] + body.slice(2);
        if (caption && caption.startsWith("! "))
            caption = caption[0] + caption.slice(2);
        let commands = caption || body || "";
        let command = commands.toLowerCase().split("\n")[0].split(" ")[0] || "";
        const args = commands.split(" ");

        const msgs = (message) => {
            if (command.startsWith("!")) {
                if (message.length >= 10) {
                    return `${message.substr(0, 15)}`;
                } else {
                    return `${message}`;
                }
            }
        };

        const mess = {
            wait: "Aankh band karke 10 tk gino :3",
            error: {
                St: "[❗] Write *!sticker* either in the caption of an image/gif or reply to an image/gif with the command.",
                Qm: "[❗] Some error occured, maybe the theme is not available!",
                Ki: "[❗] Bot can't remove the group admin!",
                Ad: "[❗] Could not add target, may be it is private",
                Iv: "[❗] Link is invalid!",
                Gp: "[❗] This command is only for groups!",
                Ow: "[❗] This command is only for the bot owner!",
                admin: "[❗] This command can be used by group admins only!",
                nsfw: "[❗] NSFW not enabled in this group",
            },
        };
        const time = moment(t * 1000).format("DD/MM HH:mm:ss");
        const botNumber = await client.getHostNumber();
        const blockNumber = await client.getBlockedIds();
        if (isGroupMsg && chat.groupMetadata == null) {
            console.log(body);
        }
        const groupId = isGroupMsg ? chat.groupMetadata.id : "";
        const groupAdmins = isGroupMsg
            ? await client.getGroupAdmins(groupId)
            : "";
        const isGroupAdmins = isGroupMsg
            ? groupAdmins.includes(sender.id)
            : false;
        const isBotGroupAdmins = isGroupMsg
            ? groupAdmins.includes(botNumber + "@c.us")
            : false;
        const isOwner = message.fromMe;
        const isBlocked = blockNumber.includes(sender.id);
        const isNsfw = isGroupMsg ? nsfw_.includes(chat.id) : false;
        const uaOverride =
            "WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";
        const isUrl = new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi
        );
        if (!isGroupMsg && command.startsWith("!"))
            console.log(
                "\x1b[1;31m~\x1b[1;37m>",
                "[\x1b[1;32mEXEC\x1b[1;37m]",
                time,
                color(msgs(command)),
                "from",
                color(pushname)
            );
        if (isGroupMsg && command.startsWith("!"))
            console.log(
                "\x1b[1;31m~\x1b[1;37m>",
                "[\x1b[1;32mEXEC\x1b[1;37m]",
                time,
                color(msgs(command)),
                "from",
                color(pushname),
                "in",
                color(formattedTitle)
            );
        //if (!isGroupMsg && !command.startsWith('!')) console.log('\x1b[1;33m~\x1b[1;37m>', '[\x1b[1;31mMSG\x1b[1;37m]', time, color(body), 'from', color(pushname))
        //if (isGroupMsg && !command.startsWith('!')) console.log('\x1b[1;33m~\x1b[1;37m>', '[\x1b[1;31mMSG\x1b[1;37m]', time, color(body), 'from', color(pushname), 'in', color(formattedTitle))
        if (isBlocked) return;
        //if (!isOwner) return
        if (
            isGroupMsg &&
            !isOwner &&
            !config.enableInGroups &&
            !enabledgrps.includes(chatId)
        )
            return;
        switch (command) {
            case "!sticker":
            case "!stiker":
            case "!st":
                let metadata = { author: "", pack: "" };
                if (args.includes("wname") || args.includes("withname")) {
                    metadata.author = pushname;
                    metadata.pack = pushname;
                }
                if (args.includes("nocrop")) metadata.keepScale = true;
                if (
                    (isMedia && type === "image" && mimetype !== "image/gif") ||
                    (quotedMsg &&
                        quotedMsg.type == "image" &&
                        quotedMsgObj.mimetype !== "image/gif")
                ) {
                    const msg = isMedia ? message : quotedMsg;
                    const mediaData = await decryptMedia(msg, uaOverride);
                    let imageBase64 = `data:${
                        msg.mimetype
                    };base64,${mediaData.toString("base64")}`;
                    if (args.includes("nobg")) {
                        let result = await removeBackgroundFromImageBase64({
                            base64img: imageBase64,
                            apiKey: config.removeBgAPIKey,
                            size: "auto",
                            type: "auto",
                            format: "png",
                        });
                        imageBase64 = `data:image/png;base64,${result.base64img}`;
                    }
                    await client.sendImageAsSticker(
                        chatId,
                        imageBase64,
                        metadata
                    );
                } else if (
                    (isMedia &&
                        (mimetype === "video/mp4" ||
                            mimetype === "image/gif")) ||
                    (quotedMsgObj &&
                        quotedMsgObj.isMedia &&
                        (quotedMsgObj.mimetype === "video/mp4" ||
                            quotedMsgObj.mimetype === "image/gif"))
                ) {
                    msg = isMedia ? message : quotedMsgObj;
                    const mediaData = await decryptMedia(msg, uaOverride);
                    client.reply(chatId, "Aankh band karke 10 tak gino :3", id);
                    try {
                        await client.sendMp4AsSticker(
                            chatId,
                            mediaData,
                            {
                                crop: false,
                                endTime:
                                    msg.duration >= 10
                                        ? "00:00:10.0"
                                        : `00:00:0${msg.duration}.0`,
                            },
                            metadata
                        );
                    } catch (err) {
                        await client.reply(
                            chatId,
                            err.name === "STICKER_TOO_LARGE"
                                ? "Video too big, try reducing the duration"
                                : "Some error occurred, sorry :(",
                            id
                        );
                    }
                } else if (args[1] && args[1].match(isUrl)) {
                    await client
                        .sendStickerfromUrl(chatId, args[1], { method: "get" })
                        .catch((err) => console.log("Caught exception: ", err));
                } else {
                    client.reply(chatId, mess.error.St, id);
                }
                break;
            case "!texttospeech":
            case "!tts":
                if (args.length === 1)
                    return client.reply(
                        chatId,
                        "Syntax *!tts [en, hi, ja,..] [text]*, contoh *!tts en Hello*\nwhere en=english, hi=hindi, ja=japanese, etc.\n Send *!tts listlang* to list all supported languages."
                    );
                const LANGUAGES = {
                    af: "Afrikaans",
                    sq: "Albanian",
                    ar: "Arabic",
                    hy: "Armenian",
                    ca: "Catalan",
                    zh: "Chinese",
                    "zh-cn": "Chinese (Mandarin/China)",
                    "zh-tw": "Chinese (Mandarin/Taiwan)",
                    "zh-yue": "Chinese (Cantonese)",
                    hr: "Croatian",
                    cs: "Czech",
                    da: "Danish",
                    nl: "Dutch",
                    en: "English",
                    "en-au": "English (Australia)",
                    "en-uk": "English (United Kingdom)",
                    "en-us": "English (United States)",
                    eo: "Esperanto",
                    fi: "Finnish",
                    fr: "French",
                    de: "German",
                    el: "Greek",
                    ht: "Haitian Creole",
                    hi: "Hindi",
                    hu: "Hungarian",
                    is: "Icelandic",
                    id: "Indonesian",
                    it: "Italian",
                    ja: "Japanese",
                    ko: "Korean",
                    la: "Latin",
                    lv: "Latvian",
                    mk: "Macedonian",
                    no: "Norwegian",
                    pl: "Polish",
                    pt: "Portuguese",
                    "pt-br": "Portuguese (Brazil)",
                    ro: "Romanian",
                    ru: "Russian",
                    sr: "Serbian",
                    sk: "Slovak",
                    es: "Spanish",
                    "es-es": "Spanish (Spain)",
                    "es-us": "Spanish (United States)",
                    sw: "Swahili",
                    sv: "Swedish",
                    ta: "Tamil",
                    th: "Thai",
                    tr: "Turkish",
                    vi: "Vietnamese",
                    cy: "Welsh",
                };
                const tts = require("node-gtts");
                const dataText = body.slice(6 + args[1].length);
                var dataBhs = args[1].toLowerCase();
                if (dataBhs === "listlang")
                    return client.reply(
                        chatId,
                        Object.keys(LANGUAGES).reduce(
                            (prev, curr) =>
                                prev + `\n${curr}: ${LANGUAGES[curr]}`,
                            "List of supported languages\n"
                        ),
                        id
                    );
                if (!Object.keys(LANGUAGES).includes(dataBhs))
                    return client.reply(
                        chatId,
                        "Language not supported! Send *!tts listlang* to list all supported languages!",
                        id
                    );
                if (dataText === "")
                    return client.reply(chatId, "Didn't get you", id);
                if (dataText.length > 1000)
                    return client.reply(
                        chatId,
                        "Text is too long! Limit is 1000 characters",
                        id
                    );
                try {
                    tts2 = tts(dataBhs);
                    tts2.save("./media/tts/res.mp3", dataText, function () {
                        client.sendPtt(chatId, "./media/tts/res.mp3", id);
                    });
                } catch (err) {
                    console.log(message);
                    await client.reply(chatId, err, id);
                    return;
                }
                break;
            case "!nh":
                //if (isGroupMsg) return client.reply(chatId, 'Sorry this command for private chat only!', id)
                if (args.length === 2) {
                    const nuklir = body.split(" ")[1];
                    client.reply(chatId, mess.wait, id);
                    const cek = await nhentai.exists(nuklir);
                    if (cek === true) {
                        try {
                            const api = new API();
                            const pic = await api
                                .getBook(nuklir)
                                .then((book) => {
                                    return api.getImageURL(book.cover);
                                });
                            const dojin = await nhentai.getDoujin(nuklir);
                            const { title, details, link } = dojin;
                            const {
                                parodies,
                                tags,
                                artists,
                                groups,
                                languages,
                                categories,
                            } = await details;
                            var teks = `*Title* : ${title}\n\n*Parodies* : ${parodies}\n\n*Tags* : ${tags.join(
                                ", "
                            )}\n\n*Artists* : ${artists.join(
                                ", "
                            )}\n\n*Groups* : ${groups.join(
                                ", "
                            )}\n\n*Languages* : ${languages.join(
                                ", "
                            )}\n\n*Categories* : ${categories}\n\n*Link* : ${link}`;
                            //exec('nhentai --id=' + nuklir + ` -P mantap.pdf -o ./hentong/${nuklir}.pdf --format `+ `${nuklir}.pdf`, (error, stdout, stderr) => {
                            client.sendFileFromUrl(
                                chatId,
                                pic,
                                "hentod.jpg",
                                teks,
                                id
                            );
                            //client.sendFile(chatId, `./hentong/${nuklir}.pdf/${nuklir}.pdf.pdf`, then(() => `${title}.pdf`, '', id)).catch(() =>
                            //client.sendFile(chatId, `./hentong/${nuklir}.pdf/${nuklir}.pdf.pdf`, `${title}.pdf`, '', id))
                            /*if (error) {
                                console.log('error : '+ error.message)
                                return
                            }
                            if (stderr) {
                                console.log('stderr : '+ stderr)
                                return
                            }
                            console.log('stdout : '+ stdout)*/
                            //})
                        } catch (err) {
                            client.reply(
                                chatId,
                                "[❗] Something went wrong, maybe the sauce is wrong",
                                id
                            );
                        }
                    } else {
                        client.reply(chatId, "[❗] Wrong sauce!");
                    }
                } else {
                    client.reply(
                        chatId,
                        "[ WRONG ] Send command *!nh [sauce]*, for detailed description of commands checkout *!readme*"
                    );
                }
                break;
            case "!sauce":
                if (
                    (isMedia && type === "image") ||
                    (quotedMsg && quotedMsg.type === "image")
                ) {
                    if (isMedia) {
                        var mediaData = await decryptMedia(message, uaOverride);
                    } else {
                        var mediaData = await decryptMedia(
                            quotedMsg,
                            uaOverride
                        );
                    }
                    const fetch = require("node-fetch");
                    const imgBS4 = `data:${mimetype};base64,${mediaData.toString(
                        "base64"
                    )}`;
                    client.reply(chatId, "Searching....", id);
                    fetch("https://trace.moe/api/search", {
                        method: "POST",
                        body: JSON.stringify({ image: imgBS4 }),
                        headers: { "Content-Type": "application/json" },
                    })
                        .then((respon) => respon.json())
                        .then((resolt) => {
                            if (resolt.docs && resolt.docs.length <= 0) {
                                client.reply(
                                    chatId,
                                    "Sorry, I don't know what anime is this",
                                    id
                                );
                            }
                            const {
                                is_adult,
                                title,
                                title_chinese,
                                title_romaji,
                                title_english,
                                episode,
                                similarity,
                                filename,
                                at,
                                tokenthumb,
                                anilist_id,
                            } = resolt.docs[0];
                            teks = "";
                            if (similarity < 0.92) {
                                teks =
                                    "*I don't have much confidence with this* :\n\n";
                            }
                            teks += `➸ *Title Japanese* : ${title}\n➸ *Title chinese* : ${title_chinese}\n➸ *Title Romaji* : ${title_romaji}\n➸ *Title English* : ${title_english}\n`;
                            teks += `➸ *Ecchi* : ${is_adult}\n`;
                            teks += `➸ *Eps* : ${episode.toString()}\n`;
                            teks += `➸ *Similarity* : ${(
                                similarity * 100
                            ).toFixed(1)}%\n`;
                            var video = `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(
                                filename
                            )}?t=${at}&token=${tokenthumb}`;
                            client
                                .sendFileFromUrl(
                                    chatId,
                                    video,
                                    "nimek.mp4",
                                    teks,
                                    id
                                )
                                .catch(() => {
                                    client.reply(chatId, teks, id);
                                });
                        })
                        .catch(() => {
                            client.reply(chatId, "Error !", id);
                        });
                } else {
                    client.sendFile(
                        chatId,
                        "./media/img/tutod.jpg",
                        "Tutor.jpg",
                        "Neh contoh mhank!",
                        id
                    );
                }
                break;
            case "!quotemaker":
                arg = body.trim().split("|");
                if (arg.length >= 3) {
                    client.reply(chatId, mess.wait, id);
                    const quotes = encodeURIComponent(arg[1].trim());
                    const author = encodeURIComponent(arg[2].trim());
                    const theme = encodeURIComponent(arg[3].trim());
                    await quotemaker(quotes, author, theme).then((amsu) => {
                        client
                            .sendFile(chatId, amsu, "quotesmaker.jpg", "neh...")
                            .catch(() => {
                                client.reply(chatId, mess.error.Qm, id);
                            });
                    });
                } else {
                    client.reply(
                        chatId,
                        "Usage: \n!quotemaker |quote|author|theme\n",
                        id
                    );
                }
                break;
            case "!linkgroup":
                if (!isBotGroupAdmins)
                    return client.reply(
                        chatId,
                        "Sorry, I am not an admin.",
                        id
                    );
                if (isGroupMsg) {
                    const inviteLink = await client.getGroupInviteLink(groupId);
                    client.sendLinkWithAutoPreview(
                        chatId,
                        inviteLink,
                        `\nLink group *${name}*`
                    );
                } else {
                    client.reply(chatId, mess.error.Gp, id);
                }
                break;
            case "!adminlist":
                if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
                let mimin = "";
                for (let admon of groupAdmins) {
                    mimin += `➸ @${admon.replace(/@c.us/g, "")}\n`;
                }
                await client.sendTextWithMentions(chatId, mimin);
                break;
            case "!ownergroup":
                if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
                const Owner_ = chat.groupMetadata.owner;
                await client.sendTextWithMentions(
                    chatId,
                    `Owner Group : @${Owner_}`
                );
                break;
            case "!mentionall":
                if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
                if (!isGroupAdmins)
                    return client.reply(chatId, mess.error.admin, id);
                const groupMem = await client.getGroupMembers(groupId);
                let hehe = "╔══✪〘 Mention All 〙✪══\n";
                hehe += "╠➥ Requested by " + pushname + "\n";
                for (let i = 0; i < groupMem.length; i++) {
                    hehe += "╠➥";
                    hehe += ` @${groupMem[i].id.replace(/@c.us/g, "")}\n`;
                }
                await client.sendTextWithMentions(chatId, hehe);
                break;
            // case "!kickallasbasfba":
            //   if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
            //   const isGroupOwner = sender.id === chat.groupMetadata.owner;
            //   if (!isGroupOwner)
            //     return client.reply(
            //       chatId,
            //       "Perintah ini hanya bisa di gunakan oleh Owner group",
            //       id
            //     );
            //   if (!isBotGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       "Perintah ini hanya bisa di gunakan ketika bot menjadi admin",
            //       id
            //     );
            //   const allMem = await client.getGroupMembers(groupId);
            //   for (let i = 0; i < allMem.length; i++) {
            //     if (groupAdmins.includes(allMem[i].id)) {
            //       console.log("Upss this is Admin group");
            //     } else {
            //       await client.removeParticipant(groupId, allMem[i].id);
            //     }
            //   }
            //   client.reply(chatId, "Succes kick all member", id);
            //   break;
            // // case "!leaveall":
            //   if (!isOwner) return client.reply(chatId, mess.error.Ow, id);
            //   const allChats = await client.getAllChatIds();
            //   const allGroups = await client.getAllGroups();
            //   for (let gclist of allGroups) {
            //     await client.sendText(
            //       gclist.contact.id,
            //       `Maaf bot sedang pembersihan, total chat aktif : ${allChats.length}`
            //     );
            //     await client.leaveGroup(gclist.contact.id);
            //   }
            //   client.reply(chatId, "Succes leave all group!", id);
            //   break;
            // case "!clearall":
            //   if (!isOwner)
            //     return client.reply(chatId, "Perintah ini hanya untuk Owner bot", id);
            //   const allChatz = await client.getAllChats();
            //   for (let dchat of allChatz) {
            //     await client.deleteChat(dchat.id);
            //   }
            //   client.reply(chatId, "Succes clear all chat!", id);
            //   break;
            case "!add":
                const orang = args[1];
                if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
                if (args.length === 1)
                    return client.reply(
                        chatId,
                        "To use this feature, send command *!add* 628xxxxx",
                        id
                    );
                if (!isGroupAdmins)
                    return client.reply(chatId, mess.error.admin, id);
                if (!isBotGroupAdmins)
                    return client.reply(
                        chatId,
                        "Sorry, I am not an admin.",
                        id
                    );
                try {
                    await client.addParticipant(chatId, `${orang}@c.us`);
                } catch {
                    client.reply(chatId, mess.error.Ad, id);
                }
                break;
            // case "!kickadfasdfadwf":
            //   if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
            //   if (!isGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       mess.error.admin,
            //       id
            //     );
            //   if (!isBotGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       "Perintah ini hanya bisa di gunakan ketika bot menjadi admin",
            //       id
            //     );
            //   if (mentionedJidList.length === 0)
            //     return client.reply(
            //       chatId,
            //       "Untuk menggunakan Perintah ini, kirim perintah *!kick* @tagmember",
            //       id
            //     );
            //   await client.sendText(
            //     chatId,
            //     `Perintah diterima, mengeluarkan:\n${mentionedJidList.join("\n")}`
            //   );
            //   for (let i = 0; i < mentionedJidList.length; i++) {
            //     if (groupAdmins.includes(mentionedJidList[i]))
            //       return client.reply(chatId, mess.error.Ki, id);
            //     await client.removeParticipant(groupId, mentionedJidList[i]);
            //   }
            //   break;
            // case "!leave":
            //   if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
            //   if (!isGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       mess.error.admin,
            //       id
            //     );
            //   await client.sendText(
            //     chatId,
            //     "Bancho mai ni ja rha ab; baar baar bulate ho fir nikal dete ;_;"
            //   );
            //   //   .then(() => client.leaveGroup(groupId));
            //   break;
            // case "!promote":
            //   if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
            //   if (!isGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       mess.error.admin,
            //       id
            //     );
            //   if (!isBotGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       "Fitur ini hanya bisa di gunakan ketika bot menjadi admin",
            //       id
            //     );
            //   if (mentionedJidList.length === 0)
            //     return client.reply(
            //       chatId,
            //       "Untuk menggunakan fitur ini, kirim perintah *!promote* @tagmember",
            //       id
            //     );
            //   if (mentionedJidList.length >= 2)
            //     return client.reply(
            //       chatId,
            //       "Maaf, perintah ini hanya dapat digunakan kepada 1 user.",
            //       id
            //     );
            //   if (groupAdmins.includes(mentionedJidList[0]))
            //     return client.reply(
            //       chatId,
            //       "Maaf, user tersebut sudah menjadi admin.",
            //       id
            //     );
            //   await client.promoteParticipant(groupId, mentionedJidList[0]);
            //   await client.sendTextWithMentions(
            //     chatId,
            //     `Perintah diterima, menambahkan @${mentionedJidList[0]} sebagai admin.`
            //   );
            //   break;
            // case "!demote":
            //   if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
            //   if (!isGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       mess.error.admin,
            //       id
            //     );
            //   if (!isBotGroupAdmins)
            //     return client.reply(
            //       chatId,
            //       "Fitur ini hanya bisa di gunakan ketika bot menjadi admin",
            //       id
            //     );
            //   if (mentionedJidList.length === 0)
            //     return client.reply(
            //       chatId,
            //       "Untuk menggunakan fitur ini, kirim perintah *!demote* @tagadmin",
            //       id
            //     );
            //   if (mentionedJidList.length >= 2)
            //     return client.reply(
            //       chatId,
            //       "Maaf, perintah ini hanya dapat digunakan kepada 1 orang.",
            //       id
            //     );
            //   if (!groupAdmins.includes(mentionedJidList[0]))
            //     return client.reply(
            //       chatId,
            //       "Maaf, user tersebut tidak menjadi admin.",
            //       id
            //     );
            //   await client.demoteParticipant(groupId, mentionedJidList[0]);
            //   await client.sendTextWithMentions(
            //     chatId,
            //     `Perintah diterima, menghapus jabatan @${mentionedJidList[0]}.`
            //   );
            //   break;
            // case "!join":
            //   //return client.reply(chatId, 'Jika ingin meng-invite bot ke group anda, silahkan izin ke wa.me/6285892766102', id)
            //   if (args.length < 2)
            //     return client.reply(
            //       chatId,
            //       "Kirim perintah *!join linkgroup key*\n\nEx:\n!join https://chat.whatsapp.com/blablablablablabla abcde\nuntuk key kamu bisa mendapatkannya hanya dengan donasi 5k",
            //       id
            //     );
            //   const link = args[1];
            //   const key = args[2];
            //   const tGr = await client.getAllGroups();
            //   const minMem = 5;
            //   const isLink = link.match(/(https:\/\/chat.whatsapp.com)/gi);
            //   if (key !== "adityaag121")
            //     return client.reply(
            //       chatId,
            //       "*key* salah! silahkan chat owner bot unruk mendapatkan key yang valid",
            //       id
            //     );
            //   const check = await client.inviteInfo(link);
            //   if (!isLink) return client.reply(chatId, "Ini link? 👊🤬", id);
            //   if (tGr.length > 15)
            //     return client.reply(chatId, "Maaf jumlah group sudah maksimal!", id);
            //   if (check.size < minMem)
            //     return client.reply(
            //       chatId,
            //       "Member group tidak melebihi 30, bot tidak bisa masuk",
            //       id
            //     );
            //   if (check.status === 200) {
            //     await client
            //       .joinGroupViaLink(link)
            //       .then(() => client.reply(chatId, "Bot akan segera masuk!"));
            //   } else {
            //     client.reply(chatId, "Link group tidak valid!", id);
            //   }
            //   break;
            case "!delete":
                if (!config.allowDelete) return;
                if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
                if (!isGroupAdmins)
                    return client.reply(chatId, mess.error.admin, id);
                if (!quotedMsg)
                    return client.reply(
                        chatId,
                        "Reply to a bot's message with *!delete*",
                        id
                    );
                if (!quotedMsgObj.fromMe)
                    return client.reply(
                        chatId,
                        "The quoted message is not from the bot!",
                        id
                    );
                client.deleteMessage(
                    quotedMsgObj.chatId,
                    quotedMsgObj.id,
                    false
                );
                break;
            case "!lyrics":
                if (args.length == 1)
                    return client.reply(
                        chatId,
                        "Send command *!lyrics [song]*",
                        id
                    );
                const lagu = body.slice(8);
                const lirik = await liriklagu(lagu);
                client.reply(chatId, lirik, id);
                break;
            case "!husbu":
                const diti = fs.readFileSync("./lib/husbu.json");
                const ditiJsin = JSON.parse(diti);
                const rindIndix = Math.floor(Math.random() * ditiJsin.length);
                const rindKiy = ditiJsin[rindIndix];
                client.sendFileFromUrl(
                    chatId,
                    rindKiy.image,
                    "Husbu.jpg",
                    rindKiy.teks,
                    id
                );
                break;
            case "!randomnsfwneko":
            case "!randomhentai":
            case "!randomyuri":
                if (isGroupMsg && !isNsfw)
                    return client.reply(chatId, mess.error.nsfw, id);
                let nimekpath = command.slice(7);
                let nsfwneko = await randomNimek(nimekpath);
                var ext = nsfwneko.endsWith(".png") ? ".png" : ".jpg";
                client.sendFileFromUrl(
                    chatId,
                    nsfwneko,
                    nimekpath + ext,
                    nimekpath.toUpperCase() + "!",
                    id
                );
                break;
            case "!randomtrapnime":
                const trap = await randomNimek("trap");
                var ext = trap.endsWith(".png") ? ".png" : ".jpg";
                client.sendFileFromUrl(
                    chatId,
                    trap,
                    `trapnime${ext}`,
                    "Trapnime!",
                    id
                );
                break;
            case "!randomanime":
                const nime = await randomNimek("anime");
                var ext = nime.endsWith(".png") ? ".png" : ".jpg";
                client.sendFileFromUrl(
                    chatId,
                    nime,
                    `Randomanime${ext}`,
                    "Randomanime!",
                    id
                );
                break;
            case "!inu":
                const list = [
                    "https://cdn.shibe.online/shibes/247d0ac978c9de9d9b66d72dbdc65f2dac64781d.jpg",
                    "https://cdn.shibe.online/shibes/1cf322acb7d74308995b04ea5eae7b520e0eae76.jpg",
                    "https://cdn.shibe.online/shibes/1ce955c3e49ae437dab68c09cf45297d68773adf.jpg",
                    "https://cdn.shibe.online/shibes/ec02bee661a797518d37098ab9ad0c02da0b05c3.jpg",
                    "https://cdn.shibe.online/shibes/1e6102253b51fbc116b887e3d3cde7b5c5083542.jpg",
                    "https://cdn.shibe.online/shibes/f0c07a7205d95577861eee382b4c8899ac620351.jpg",
                    "https://cdn.shibe.online/shibes/3eaf3b7427e2d375f09fc883f94fa8a6d4178a0a.jpg",
                    "https://cdn.shibe.online/shibes/c8b9fcfde23aee8d179c4c6f34d34fa41dfaffbf.jpg",
                    "https://cdn.shibe.online/shibes/55f298bc16017ed0aeae952031f0972b31c959cb.jpg",
                    "https://cdn.shibe.online/shibes/2d5dfe2b0170d5de6c8bc8a24b8ad72449fbf6f6.jpg",
                    "https://cdn.shibe.online/shibes/e9437de45e7cddd7d6c13299255e06f0f1d40918.jpg",
                    "https://cdn.shibe.online/shibes/6c32141a0d5d089971d99e51fd74207ff10751e7.jpg",
                    "https://cdn.shibe.online/shibes/028056c9f23ff40bc749a95cc7da7a4bb734e908.jpg",
                    "https://cdn.shibe.online/shibes/4fb0c8b74dbc7653e75ec1da597f0e7ac95fe788.jpg",
                    "https://cdn.shibe.online/shibes/125563d2ab4e520aaf27214483e765db9147dcb3.jpg",
                    "https://cdn.shibe.online/shibes/ea5258fad62cebe1fedcd8ec95776d6a9447698c.jpg",
                    "https://cdn.shibe.online/shibes/5ef2c83c2917e2f944910cb4a9a9b441d135f875.jpg",
                    "https://cdn.shibe.online/shibes/6d124364f02944300ae4f927b181733390edf64e.jpg",
                    "https://cdn.shibe.online/shibes/92213f0c406787acd4be252edb5e27c7e4f7a430.jpg",
                    "https://cdn.shibe.online/shibes/40fda0fd3d329be0d92dd7e436faa80db13c5017.jpg",
                    "https://cdn.shibe.online/shibes/e5c085fc427528fee7d4c3935ff4cd79af834a82.jpg",
                    "https://cdn.shibe.online/shibes/f83fa32c0da893163321b5cccab024172ddbade1.jpg",
                    "https://cdn.shibe.online/shibes/4aa2459b7f411919bf8df1991fa114e47b802957.jpg",
                    "https://cdn.shibe.online/shibes/2ef54e174f13e6aa21bb8be3c7aec2fdac6a442f.jpg",
                    "https://cdn.shibe.online/shibes/fa97547e670f23440608f333f8ec382a75ba5d94.jpg",
                    "https://cdn.shibe.online/shibes/fb1b7150ed8eb4ffa3b0e61ba47546dd6ee7d0dc.jpg",
                    "https://cdn.shibe.online/shibes/abf9fb41d914140a75d8bf8e05e4049e0a966c68.jpg",
                    "https://cdn.shibe.online/shibes/f63e3abe54c71cc0d0c567ebe8bce198589ae145.jpg",
                    "https://cdn.shibe.online/shibes/4c27b7b2395a5d051b00691cc4195ef286abf9e1.jpg",
                    "https://cdn.shibe.online/shibes/00df02e302eac0676bb03f41f4adf2b32418bac8.jpg",
                    "https://cdn.shibe.online/shibes/4deaac9baec39e8a93889a84257338ebb89eca50.jpg",
                    "https://cdn.shibe.online/shibes/199f8513d34901b0b20a33758e6ee2d768634ebb.jpg",
                    "https://cdn.shibe.online/shibes/f3efbf7a77e5797a72997869e8e2eaa9efcdceb5.jpg",
                    "https://cdn.shibe.online/shibes/39a20ccc9cdc17ea27f08643b019734453016e68.jpg",
                    "https://cdn.shibe.online/shibes/e67dea458b62cf3daa4b1e2b53a25405760af478.jpg",
                    "https://cdn.shibe.online/shibes/0a892f6554c18c8bcdab4ef7adec1387c76c6812.jpg",
                    "https://cdn.shibe.online/shibes/1b479987674c9b503f32e96e3a6aeca350a07ade.jpg",
                    "https://cdn.shibe.online/shibes/0c80fc00d82e09d593669d7cce9e273024ba7db9.jpg",
                    "https://cdn.shibe.online/shibes/bbc066183e87457b3143f71121fc9eebc40bf054.jpg",
                    "https://cdn.shibe.online/shibes/0932bf77f115057c7308ef70c3de1de7f8e7c646.jpg",
                    "https://cdn.shibe.online/shibes/9c87e6bb0f3dc938ce4c453eee176f24636440e0.jpg",
                    "https://cdn.shibe.online/shibes/0af1bcb0b13edf5e9b773e34e54dfceec8fa5849.jpg",
                    "https://cdn.shibe.online/shibes/32cf3f6eac4673d2e00f7360753c3f48ed53c650.jpg",
                    "https://cdn.shibe.online/shibes/af94d8eeb0f06a0fa06f090f404e3bbe86967949.jpg",
                    "https://cdn.shibe.online/shibes/4b55e826553b173c04c6f17aca8b0d2042d309fb.jpg",
                    "https://cdn.shibe.online/shibes/a0e53593393b6c724956f9abe0abb112f7506b7b.jpg",
                    "https://cdn.shibe.online/shibes/7eba25846f69b01ec04de1cae9fed4b45c203e87.jpg",
                    "https://cdn.shibe.online/shibes/fec6620d74bcb17b210e2cedca72547a332030d0.jpg",
                    "https://cdn.shibe.online/shibes/26cf6be03456a2609963d8fcf52cc3746fcb222c.jpg",
                    "https://cdn.shibe.online/shibes/c41b5da03ad74b08b7919afc6caf2dd345b3e591.jpg",
                    "https://cdn.shibe.online/shibes/7a9997f817ccdabac11d1f51fac563242658d654.jpg",
                    "https://cdn.shibe.online/shibes/7221241bad7da783c3c4d84cfedbeb21b9e4deea.jpg",
                    "https://cdn.shibe.online/shibes/283829584e6425421059c57d001c91b9dc86f33b.jpg",
                    "https://cdn.shibe.online/shibes/5145c9d3c3603c9e626585cce8cffdfcac081b31.jpg",
                    "https://cdn.shibe.online/shibes/b359c891e39994af83cf45738b28e499cb8ffe74.jpg",
                    "https://cdn.shibe.online/shibes/0b77f74a5d9afaa4b5094b28a6f3ee60efcb3874.jpg",
                    "https://cdn.shibe.online/shibes/adccfdf7d4d3332186c62ed8eb254a49b889c6f9.jpg",
                    "https://cdn.shibe.online/shibes/3aac69180f777512d5dabd33b09f531b7a845331.jpg",
                    "https://cdn.shibe.online/shibes/1d25e4f592db83039585fa480676687861498db8.jpg",
                    "https://cdn.shibe.online/shibes/d8349a2436420cf5a89a0010e91bf8dfbdd9d1cc.jpg",
                    "https://cdn.shibe.online/shibes/eb465ef1906dccd215e7a243b146c19e1af66c67.jpg",
                    "https://cdn.shibe.online/shibes/3d14e3c32863195869e7a8ba22229f457780008b.jpg",
                    "https://cdn.shibe.online/shibes/79cedc1a08302056f9819f39dcdf8eb4209551a3.jpg",
                    "https://cdn.shibe.online/shibes/4440aa827f88c04baa9c946f72fc688a34173581.jpg",
                    "https://cdn.shibe.online/shibes/94ea4a2d4b9cb852e9c1ff599f6a4acfa41a0c55.jpg",
                    "https://cdn.shibe.online/shibes/f4478196e441aef0ada61bbebe96ac9a573b2e5d.jpg",
                    "https://cdn.shibe.online/shibes/96d4db7c073526a35c626fc7518800586fd4ce67.jpg",
                    "https://cdn.shibe.online/shibes/196f3ed10ee98557328c7b5db98ac4a539224927.jpg",
                    "https://cdn.shibe.online/shibes/d12b07349029ca015d555849bcbd564d8b69fdbf.jpg",
                    "https://cdn.shibe.online/shibes/80fba84353000476400a9849da045611a590c79f.jpg",
                    "https://cdn.shibe.online/shibes/94cb90933e179375608c5c58b3d8658ef136ad3c.jpg",
                    "https://cdn.shibe.online/shibes/8447e67b5d622ef0593485316b0c87940a0ef435.jpg",
                    "https://cdn.shibe.online/shibes/c39a1d83ad44d2427fc8090298c1062d1d849f7e.jpg",
                    "https://cdn.shibe.online/shibes/6f38b9b5b8dbf187f6e3313d6e7583ec3b942472.jpg",
                    "https://cdn.shibe.online/shibes/81a2cbb9a91c6b1d55dcc702cd3f9cfd9a111cae.jpg",
                    "https://cdn.shibe.online/shibes/f1f6ed56c814bd939645138b8e195ff392dfd799.jpg",
                    "https://cdn.shibe.online/shibes/204a4c43cfad1cdc1b76cccb4b9a6dcb4a5246d8.jpg",
                    "https://cdn.shibe.online/shibes/9f34919b6154a88afc7d001c9d5f79b2e465806f.jpg",
                    "https://cdn.shibe.online/shibes/6f556a64a4885186331747c432c4ef4820620d14.jpg",
                    "https://cdn.shibe.online/shibes/bbd18ae7aaf976f745bc3dff46b49641313c26a9.jpg",
                    "https://cdn.shibe.online/shibes/6a2b286a28183267fca2200d7c677eba73b1217d.jpg",
                    "https://cdn.shibe.online/shibes/06767701966ed64fa7eff2d8d9e018e9f10487ee.jpg",
                    "https://cdn.shibe.online/shibes/7aafa4880b15b8f75d916b31485458b4a8d96815.jpg",
                    "https://cdn.shibe.online/shibes/b501169755bcf5c1eca874ab116a2802b6e51a2e.jpg",
                    "https://cdn.shibe.online/shibes/a8989bad101f35cf94213f17968c33c3031c16fc.jpg",
                    "https://cdn.shibe.online/shibes/f5d78feb3baa0835056f15ff9ced8e3c32bb07e8.jpg",
                    "https://cdn.shibe.online/shibes/75db0c76e86fbcf81d3946104c619a7950e62783.jpg",
                    "https://cdn.shibe.online/shibes/8ac387d1b252595bbd0723a1995f17405386b794.jpg",
                    "https://cdn.shibe.online/shibes/4379491ef4662faa178f791cc592b52653fb24b3.jpg",
                    "https://cdn.shibe.online/shibes/4caeee5f80add8c3db9990663a356e4eec12fc0a.jpg",
                    "https://cdn.shibe.online/shibes/99ef30ea8bb6064129da36e5673649e957cc76c0.jpg",
                    "https://cdn.shibe.online/shibes/aeac6a5b0a07a00fba0ba953af27734d2361fc10.jpg",
                    "https://cdn.shibe.online/shibes/9a217cfa377cc50dd8465d251731be05559b2142.jpg",
                    "https://cdn.shibe.online/shibes/65f6047d8e1d247af353532db018b08a928fd62a.jpg",
                    "https://cdn.shibe.online/shibes/fcead395cbf330b02978f9463ac125074ac87ab4.jpg",
                    "https://cdn.shibe.online/shibes/79451dc808a3a73f99c339f485c2bde833380af0.jpg",
                    "https://cdn.shibe.online/shibes/bedf90869797983017f764165a5d97a630b7054b.jpg",
                    "https://cdn.shibe.online/shibes/dd20e5801badd797513729a3645c502ae4629247.jpg",
                    "https://cdn.shibe.online/shibes/88361ee50b544cb1623cb259bcf07b9850183e65.jpg",
                    "https://cdn.shibe.online/shibes/0ebcfd98e8aa61c048968cb37f66a2b5d9d54d4b.jpg",
                ];
                let kya = list[Math.floor(Math.random() * list.length)];
                client.sendFileFromUrl(chatId, kya, "Dog.jpeg", "Inu");
                break;
            case "!neko":
                q2 = Math.floor(Math.random() * 900) + 300;
                q3 = Math.floor(Math.random() * 900) + 300;
                client.sendFileFromUrl(
                    chatId,
                    "http://placekitten.com/" + q3 + "/" + q2,
                    "neko.png",
                    "Neko "
                );
                break;
            case "!meme":
            case "!wholesome":
            case "!dank":
            case "!nsfw":
                let subr = "";
                if (command == "!meme") subr = "memes";
                else if (command == "!wholesome") subr = "wholesomememes";
                else if (command == "!dank") subr = "IndianDankMemes";
                else if (command == "!nsfw") {
                    if (!isNsfw && isGroupMsg)
                        return client.reply(chatId, mess.error.nsfw, id);
                    subr = "nsfwmemes";
                }
                const response = await axios.get(
                    "https://meme-api.herokuapp.com/gimme/" + subr
                );
                const { postlink, title, subreddit, url, nsfw, spoiler } =
                    response.data;
                client.sendFileFromUrl(
                    chatId,
                    `${url}`,
                    "meme.jpg",
                    `${title}`,
                    id
                );
                break;
            case "!togglensfw":
                if (!isGroupMsg) return client.reply(chatId, mess.error.Gp, id);
                if (!isGroupAdmins)
                    return client.reply(chatId, mess.error.admin, id);
                if (!isNsfw) {
                    nsfw_.push(chatId);
                    fs.writeFileSync("./lib/NSFW.json", JSON.stringify(nsfw_));
                    client.reply(
                        chatId,
                        "NSFW has been enabled! \nType *!nsfw* to see nsfw memes\nOther commands:\n*!randomnsfwneko*\n*!randomhentai*\n*!randomyuri*",
                        id
                    );
                } else {
                    nsfw_.splice(chatId, 1);
                    fs.writeFileSync("./lib/NSFW.json", JSON.stringify(nsfw_));
                    client.reply(
                        chatId,
                        "NSFW has been disabled in this group",
                        id
                    );
                }
                break;
            case "!help":
                client.sendText(chatId, help);
                break;
            case "!info":
                client.sendLinkWithAutoPreview(
                    chatId,
                    "https://github.com/spookbite/whatsapp-bot",
                    info
                );
                break;
            case "!yt":
                if (args.length == 1)
                    return client.reply(chatId, "Send command *!yt [url]*", id);
                const yturl = body.slice(4);
                // const ytId = ytdl.getVideoID(yturl);
                // const path = "./media/vid/" + ytId + ".mp4";
                // let caption = "";
                // const writeStream = fs.createWriteStream(path);
                // writeStream.on("open", () =>
                //     ytdl(yturl)
                //         .on(
                //             "info",
                //             (ytinfo) => (caption = ytinfo.videoDetails.title)
                //         )
                //         .pipe(writeStream)
                // );
                // writeStream.on("finish", () => {
                //     client
                //         .sendFile(chatId, path, ytId + ".mp4", caption, id)
                //         .then(() => fs.unlink(path));
                // });
                await ytdl.getInfo(yturl).then(
                    async (info) => {
                        await client.sendFileFromUrl(
                            chatId,
                            ytdl.chooseFormat(info.formats, {}).url,
                            "video.mp4",
                            info.videoDetails.title,
                            id
                        );
                    },
                    async (err) => {
                        console.log(err);
                        await client.reply(chatId, "Some Error occured!", id);
                    }
                );
                break;
            case "!ig":
                if (args.length == 1)
                    return client.reply(chatId, "Send command *!ig [url]*", id);
                const igUrl = new URL(body.slice(4));
                const igCode = igUrl.pathname.split("/")[2];
                await InstagramApi.default.get(igCode).then(
                    async (result) => {
                        await client.sendFileFromUrl(
                            chatId,
                            result.url,
                            null,
                            result.caption,
                            id
                        );
                    },
                    async (err) => {
                        console.log(err);
                        await client.reply(chatId, "Some Error occured!", id);
                    }
                );
                break;
            case "!fb":
                if (args.length == 1)
                    return client.reply(chatId, "Send command *!fb [url]*", id);
                const fbUrl = body.slice(4);
                await fbdl.getInfo(fbUrl).then(
                    async (info) => {
                        if (!info.streamURL)
                            await client.reply(chatId, "video not found!", id);
                        else
                            await client.sendFileFromUrl(
                                chatId,
                                info.streamURL,
                                "video.mp4",
                                info.title,
                                id
                            );
                    },
                    async (err) => {
                        console.log(err);
                        await client.reply(chatId, "Some Error occured!", id);
                    }
                );
                break;
            default:
                if (!isOwner && command.startsWith("!"))
                    client.reply(
                        chatId,
                        "I'm sorry that seems to be an invalid command! Type !help to see all the commands.",
                        id
                    );
        }
        if (isOwner) {
            switch (command) {
                case "!bot":
                    if (!isGroupMsg)
                        return client.reply(chatId, mess.error.Gp, id);
                    if (args.length === 1)
                        return client.reply(
                            chatId,
                            "Write enable or disable!",
                            id
                        );
                    if (args[1].toLowerCase() === "enable") {
                        enabledgrps.push(chatId);
                        fs.writeFileSync(
                            "./lib/groups.json",
                            JSON.stringify(enabledgrps)
                        );
                        client.reply(
                            chatId,
                            "The bot has been enabled in this group! Type *!help* to get started :)",
                            id
                        );
                    } else if (args[1].toLowerCase() === "disable") {
                        enabledgrps.splice(chatId, 1);
                        fs.writeFileSync(
                            "./lib/groups.json",
                            JSON.stringify(enabledgrps)
                        );
                        client.reply(chatId, "Bot disabled in this group!", id);
                    } else {
                        client.reply(chatId, "Write enable or disable!", id);
                    }
                    break;
                case "!getses":
                    if (!isOwner)
                        return client.reply(chatId, mess.error.Ow, id);
                    else {
                        const sesPic = await client.getSnapshot();
                        client.sendFile(
                            chatId,
                            sesPic,
                            "session.png",
                            "Neh...",
                            id
                        );
                    }
                    break;
                case "!openonpc":
                    if (args.length == 2) {
                        let link = args[1];
                        if (
                            !link.startsWith("http://") &&
                            !link.startsWith("https://")
                        )
                            link = "http://" + link;
                        await exec("start " + link, (err) => console.log(err));
                        client.sendText(chatId, "opening " + link);
                    }
                    break;
                case "!getfile":
                    let path = body.slice(9);
                    // await exec("start " + path, (err) => console.log(err));
                    console.log(path);
                    await client.sendFile(
                        chatId,
                        "./../" + path,
                        path.split("/")[path.split("/").length - 1],
                        path.split("/")[path.split("/").length - 1],
                        id,
                        false,
                        false,
                        true
                    );
                    break;
                case "!cmd":
                    let cmd = body.slice(5);
                    console.log(cmd);
                    await exec(cmd, (err, stdout, stderr) =>
                        client.sendText(
                            chatId,
                            (err ? err : "") +
                                (stdout ? stdout : "") +
                                (stderr ? stderr : ""),
                            id
                        )
                    );
                    break;
                case "!echo":
                    await client.sendText(chatId, body.slice(6));
                    break;
                case "!copy":
                    let text = body.slice(6);
                    if (quotedMsg) text = quotedMsg.body;
                    console.log(text);
                    await exec(
                        "echo " + text + " | clip",
                        (err, stdout, stderr) =>
                            client.reply(chatId, "copied", id)
                    );
                    break;
                case "!bc":
                    let msg = body.slice(4);
                    const chatz = await client.getAllChatIds();
                    for (let ids of chatz) {
                        var cvk = await client.getChatById(ids);
                        if (!cvk.isReadOnly && !cvk.archive)
                            client.sendText(ids, `\n${msg}`);
                    }
                    client.reply(chatId, "Broadcast Success!", id);
                    break;
                case "!save":
                    const b64 = await decryptMedia(quotedMsgObj);
                    fs.writeFile(
                        "C:/Users/DELL/Downloads/" + quotedMsgObj.caption,
                        b64,
                        { encoding: "base64" },
                        (err) => {
                            if (err) {
                                console.log(err);
                                client.reply(
                                    chatId,
                                    "Some error occurred!",
                                    id
                                );
                            } else {
                                client.reply(
                                    chatId,
                                    "File downloaded successfully!",
                                    id
                                );
                                console.log("success");
                            }
                        }
                    );
                    break;
            }
        }
    } catch (err) {
        console.log(color("[ERROR]", "red"), err);
        //client.kill().then(a => console.log(a))
    }
};
