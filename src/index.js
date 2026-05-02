// src/index.js
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");


// Optional crash logging
process.on("unhandledRejection", (r) => console.error("UnhandledRejection:", r));
process.on("uncaughtException", (e) => console.error("UncaughtException:", e));

const TOKEN = process.env.DISCORD_TOKEN;
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.MONGO_DB || "surfari";
const PORT = process.env.PORT || 3000;



if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN missing");
  process.exit(1);
}

if (!MONGO_URL) {
  console.error("❌ MONGO_URL missing");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});


client.commands = new Collection();

const app = express();
app.use(cookieParser());

const ROOT = __dirname;
const COMMANDS_DIR = path.join(ROOT, "commands");
const EVENTS_DIR = path.join(ROOT, "events");

function loadEvents(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const ev = require(path.join(dir, file));

    if (!ev?.name || typeof ev.execute !== "function") {
      console.warn(`⚠️ Skipping event ${file} (missing name/execute)`);
      continue;
    }

    if (ev.once) {
      client.once(ev.name, (...args) => ev.execute(...args, client));
    } else {
      client.on(ev.name, (...args) => ev.execute(...args, client));
    }

    console.log(`✅ Event loaded: ${ev.name}`);
  }
}

function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      const files = fs.readdirSync(sub).filter((f) => f.endsWith(".js"));

      for (const file of files) {
        const cmd = require(path.join(sub, file));

        if (!cmd?.data?.name || typeof cmd.execute !== "function") {
          console.warn(`⚠️ Skipping command ${entry.name}/${file}`);
          continue;
        }

        client.commands.set(cmd.data.name, cmd);
        console.log(`✅ Command loaded: ${cmd.data.name}`);
      }
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const cmd = require(path.join(dir, entry.name));

      if (!cmd?.data?.name || typeof cmd.execute !== "function") {
        console.warn(`⚠️ Skipping command ${entry.name}`);
        continue;
      }

      client.commands.set(cmd.data.name, cmd);
      console.log(`✅ Command loaded: ${cmd.data.name}`);
    }
  }
}

async function registerGuildCommands() {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const GUILD_ID = process.env.GUILD_ID;

  if (!CLIENT_ID || !GUILD_ID) {
    console.error("❌ Missing DISCORD_CLIENT_ID or GUILD_ID for command registration");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const body = [...client.commands.values()].map((c) => c.data.toJSON());

  console.log(`📝 Registering ${body.length} guild commands to ${GUILD_ID}...`);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
  console.log("✅ Guild commands registered.");
}

// --------------------
// Discord events
// --------------------

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  try {
    await registerGuildCommands();
  } catch (e) {
    console.error("Command registration failed:", e);
  }

});

client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = member.guild.channels.cache.get("1384677375215665264");
  if (!welcomeChannel) return;

  // change these
  const ROBLOX_GROUP_URL = "https://www.roblox.com/communities/13722860/Soel#!/about";
  const RULES_CHANNEL_ID = "1384660159804080318";

  const rulesUrl = `https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID}`;

  const welcomeEmbed = new EmbedBuilder()
    .setColor("#50C878")
    .setTitle("<:SOELAINITIAL:1419871723083268136>  Welcome to Soela's Community Server!")
    .setDescription(
      [
        `Greetings, <@${member.id}>, and welcome to **Soela's Community Server!** Soela is a refined Roblox experience centered around community, creativity, and elegant hospitality. Our team is committed to creating immersive and memorable experiences for every guest who joins us.`,
        ``,
        `-# Please take a moment to review our rules and explore our Roblox Group below. We are delighted to have you with us.`
      ].join("\n")
    )
    .setImage("https://cdn.discordapp.com/attachments/1496212937138769951/1500242330194677861/Banner_w_only_text.png?ex=69f7b90c&is=69f6678c&hm=3ebb7bdd757bc93be77a62c3ebe7e5a37ab54d39f11213fc269f73c690763b9d")
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Roblox Group")
      .setStyle(ButtonStyle.Link)
      .setURL(ROBLOX_GROUP_URL)
      .setEmoji({
          id: "1495309148945121300", // replace with real emoji ID
        }),

    new ButtonBuilder()
      .setLabel("Rules")
      .setStyle(ButtonStyle.Link)
      .setURL(rulesUrl)
      .setEmoji({
          id: "1495309102253871307", // replace with real emoji ID
        }),
  );

  await welcomeChannel.send({
    content: `Welcome, <@${member.id}>!`,
    embeds: [welcomeEmbed],
    components: [row],
  });
});

// --------------------
// Startup
// --------------------

(async () => {
  console.log("📦 Connecting to Mongo…");
  const mongo = await MongoClient.connect(MONGO_URL);
  const db = mongo.db(DB_NAME);
  client.db = db;

  console.log("✅ Mongo connected. DB:", DB_NAME);
 client.db.collection("giveaways")
  global._surfariDb = db;
  console.log("🔌 Global _surfariDb set:", !!global._surfariDb);

  loadEvents(EVENTS_DIR);
  loadCommands(COMMANDS_DIR);

  app.listen(PORT, () => {
    console.log(`🌐 Backend running on :${PORT}`);
  });

  await client.login(TOKEN);
})().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});
