require('dotenv-safe').config({
    example: './env'
});
const Discord = require("discord.js"),
    config = require("./config.json"),
    Vibrant = require("node-vibrant"),
    chalk = require("chalk"),
    fs = require("fs"),
    log = console.log,
    prefix = config.prefix,
    bot = new Discord.Client(),
    lang = config.lang,
    http = require('http'),
    express = require('express'),
    app = express();


if (lang === null || lang.length < 1) throw new Error("no language specified.");
if (!fs.existsSync(`./langs/${lang}.json`)) throw new Error("could not find language file.");
const txt = require(`./langs/${lang}.json`);

function fetchColors(roles, userRoles) {
    const detect = config.colorDetect;
    if (detect.default.startswith.length < 1 && detect.default.endswith.length < 1 && detect.default.endswith.length < 1) throw new Error("no default color detection method added.");
    var colors = roles.filter(r => detect.default.startswith.some(i => r.name.toLowerCase().startsWith(i.toLowerCase())) || detect.default.endswith.some(i => r.name.toLowerCase().endsWith(i.toLowerCase())) || detect.default.contains.some(i => r.name.toLowerCase().includes(i.toLowerCase())));
    for (var roleDetect in detect) {
        if (roleDetect === "default") continue;
        if (!userRoles.find(r => r.name.toLowerCase() === roleDetect)) continue;
        colors = colors.concat(roles.filter(r => detect[roleDetect].startswith.some(i => r.name.toLowerCase().startsWith(i.toLowerCase())) || detect[roleDetect].endswith.some(i => r.name.toLowerCase().endsWith(i.toLowerCase())) || detect[roleDetect].contains.some(i => r.name.toLowerCase().includes(i.toLowerCase()))));
    }
    colors.sweep(r => r.hexColor === "#000000");
    return colors;
};

bot.on("ready", () => {
    log("logged in.");
    bot.user.setActivity(prefix, {
        type: "PLAYING"
    });
});

bot.on("message", (msg) => {
    if (msg.channel.dm) return;
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;

    function reply(message) {
        msg.channel.send(`<@${msg.author.id}> ${message}`);
    };
    var talk = true;
    if (!msg.channel.permissionsFor(msg.guild.me).has("SEND_MESSAGES")) talk = false;
    var args = msg.content.slice(prefix.length).split(" ");
    var cmd = msg.content.slice(prefix.length).split(" ")[0];
    var colors = fetchColors(msg.guild.roles.cache, msg.member.roles.cache);
    if (colors.size < 1) {
        var conditions = "";
        let detect = config.colorDetect.default;
        if (detect.startswith.length > 0) {
            conditions += `\n${txt.START_WITH}: \`${detect.startswith.join("\`, \`")}\``;
        };
        if (detect.endswith.length > 0) {
            conditions += `\n${txt.END_WITH}: \`${detect.endswith.join("\`, \`")}\``;
        };
        if (detect.contains.length > 0) {
            conditions += `\n${txt.CONTAIN}: \`${detect.contains.join("\`, \`")}\``;
        };
        if (Object.keys(config.colorDetect).length > 1) conditions += `\n\n${txt.OTHER_ROLES}`
        reply(`${txt.NO_COLORS} ${(msg.member.hasPermission("MANAGE_ROLES")) ? txt.COLOR_NAME_MOD : txt.COLOR_NAME_USER}${conditions}`);
    }

    function removeAccents(text) {
        return text.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ô", "o").replace("ú", "u").replace("ã", "a");
    };
    switch (cmd) {
        case "avatar":
        case "detect":
            var image = msg.author.displayAvatarURL({
                format: "png",
                size: 128
            });
            if (talk) msg.channel.send(txt.PROCESSING).then(message => {
                var colorss = colors.array().map(r => r = r.hexColor.slice(1));

                function getSimilarColor(color) {
                    var base_colors = colorss;
                    var color_r = color[0];
                    var color_g = color[1];
                    var color_b = color[2];
                    var differenceArray = [];
                    Array.min = function (array) {
                        return Math.min.apply(Math, array)
                    };
                    base_colors.forEach(function (code) {
                        var base_color_rgb = hex2rgb(code);
                        var base_colors_r = base_color_rgb.split(',')[0];
                        var base_colors_g = base_color_rgb.split(',')[1];
                        var base_colors_b = base_color_rgb.split(',')[2];
                        differenceArray.push(Math.sqrt((color_r - base_colors_r) * (color_r - base_colors_r) + (color_g - base_colors_g) * (color_g - base_colors_g) + (color_b - base_colors_b) * (color_b - base_colors_b)))
                    });
                    var lowest = Array.min(differenceArray);
                    var index = differenceArray.indexOf(lowest);

                    function hex2rgb(colour) {
                        var r, g, b;
                        if (colour.charAt(0) == '#') {
                            colour = colour.substr(1)
                        }
                        r = colour.charAt(0) + colour.charAt(1);
                        g = colour.charAt(2) + colour.charAt(3);
                        b = colour.charAt(4) + colour.charAt(5);
                        r = parseInt(r, 16);
                        g = parseInt(g, 16);
                        b = parseInt(b, 16);
                        return r + ',' + g + ',' + b
                    }
                    return base_colors[index]
                };
                var v = new Vibrant(image);
                v.getPalette().then(pallete => {
                    var vibrant = getSimilarColor(pallete.Vibrant.rgb);
                    var darkVibrant = getSimilarColor(pallete.DarkVibrant.rgb);
                    var lightVibrant = getSimilarColor(pallete.LightVibrant.rgb);

                    function removeDuplicates(num) {
                        var x, len = num.length,
                            out = [],
                            obj = {};
                        for (x = 0; x < len; x += 1) {
                            obj[num[x]] = 0
                        }
                        for (x in obj) {
                            out.push(x)
                        }
                        return out
                    }
                    var rolesFromColor = [colors.filter(r => r.hexColor == `#${vibrant}`).first(), colors.filter(r => r.hexColor == `#${darkVibrant}`).first(), colors.filter(r => r.hexColor == `#${lightVibrant}`).first()];
                    message.edit(" ", new Discord.MessageEmbed()
                        .setColor(msg.guild.me.displayHexColor)
                        .setAuthor(msg.author.username, image)
                        .setFooter(bot.user.username, bot.user.displayAvatarURL())
                        .setDescription(`${txt.THESE_COLORS}: \n${removeDuplicates(rolesFromColor).join(", ")}.`));
                }).catch((e) => {
                    if (talk) reply(`${txt.ERROR}: ${e.message}`)
                });
            });
            break;
        case "colors":
        case "list":
        case "l":
            if (talk) {
                var roles = msg.guild.roles.cache
                roles.sweep(r => r.hexColor === "#000000" && r.name !== "@everyone" && !Object.keys(config.colorDetect).includes(r.name))
                var detect = config.colorDetect;
                var colorList = colors.sort((a, b) => {
                    if (a.position >= b.position) {
                        return 1
                    } else {
                        return -1
                    }
                }).array().join(", ");
                if (Object.keys(config.colorDetect).length > 1) {
                    colorList = `**${txt.AVAILABLE}**: ${roles.filter(r => detect["default"].startswith.some(i => r.name.toLowerCase().startsWith(i.toLowerCase())) || detect["default"].endswith.some(i => r.name.toLowerCase().endsWith(i.toLowerCase())) || detect["default"].contains.some(i => r.name.toLowerCase().includes(i.toLowerCase()))).array().join(", ")}`
                    for (var roleDetect in config.colorDetect) {
                        if (roleDetect === "default") continue;
                        console.log(msg.member.roles.cache.map(a => a.name), roleDetect)
                        var userHas = false;
                        userHas = msg.member.roles.cache.some(r => r.name.toLowerCase().includes(roleDetect.toLowerCase()))
                        colorList += `\n${(!userHas) ? "~~" : ""}**${roleDetect}**: ${roles.filter(r => detect[roleDetect].startswith.some(i => r.name.toLowerCase().startsWith(i.toLowerCase())) || detect[roleDetect].endswith.some(i => r.name.toLowerCase().endsWith(i.toLowerCase())) || detect[roleDetect].contains.some(i => r.name.toLowerCase().includes(i.toLowerCase()))).array().join(", ")}${(!userHas) ? "~~" : ""}`
                    }
                }
                msg.channel.send(new Discord.MessageEmbed()
                    .setColor(msg.guild.me.displayHexColor)
                    .setAuthor(msg.author.username, msg.author.displayAvatarURL())
                    .setTitle(txt.AVAILABLE_COLORS)
                    .setFooter(bot.user.username, bot.user.displayAvatarURL())
                    .setDescription(colorList)
                );
            };
            break;
        case "help":
        case "h":
            if (talk) reply(`\`${prefix}list\` ${txt.LIST_COMMAND}\n\`${prefix}avatar\` ${txt.AVATAR_COMMAND}\n\n${txt.COLOR_YOURSELF} \`${prefix + txt.LIGHT_BLUE}\`${(config.silentUse) ? "\n" + txt.SILENT_USE : ""}\n${txt.SHORT_CMD}`)
            break;
        default:
            if (!msg.guild.me.permissions.has("MANAGE_ROLES")) {
                reply(txt.MISSING_PERMISSIONS);
            } else {
                var search = args.join(" ").toLowerCase();
                let resultsC = colors.filter(r => removeAccents(r.name.toLowerCase()).includes(removeAccents(search)));
                let results = resultsC.array().sort(function (a, b) {
                    if (a.name.length >= b.name.length) {
                        return 1
                    } else {
                        return -1
                    }
                });
                if (results.length < 1) {
                    if (talk) reply(txt.COULD_NOT_FIND);
                } else {
                    var role = results[0];
                    if (msg.member.roles.cache.some(r => r === role)) {
                        msg.member.roles.remove(role, "colorful")
                        if (talk) reply(`${txt.NOT_COLORED} \`${role.name}\`.`);
                    } else {
                        msg.member.roles.remove(colors, "colorful").then(() => msg.member.roles.add(role, "colorful"));
                        if (talk) reply(`${txt.COLORED} \`${role.name}\`.`);
                    };
                };
            };
            break;
    };

    if (config.silentUse && !talk && msg.channel.permissionsFor(bot.user).has("MANAGE_MESSAGES")) msg.delete(5);
});

app.get("/", (request, response) => {
    response.sendStatus(200);
});
app.listen(process.env.PORT);


if (config.hostedOnGlitch) {
    setInterval(() => {
        http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }, 280000);
};

log("initializing");
bot.login(process.env.TOKEN).catch((e) => {
    throw new Error(`can't login: ${e.message}`)
})