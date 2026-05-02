const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function pickRandomWinners(participants, winnerCount) {
  const pool = [...participants];
  const winners = [];

  while (pool.length > 0 && winners.length < winnerCount) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool[index]);
    pool.splice(index, 1);
  }

  return winners;
}

async function endGiveaway(client, giveawayId) {
  const collection = client.db.collection("giveaways");
  const giveaway = await collection.findOne({ giveawayId });

  if (!giveaway || giveaway.ended) return;

  const guild = await client.guilds.fetch(giveaway.guildId).catch(() => null);
  if (!guild) return;

  const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  if (!message) return;

  const validParticipants = [];

  for (const userId of giveaway.participants) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;
    if (!member.roles.cache.has(giveaway.customerRoleId)) continue;
    validParticipants.push(userId);
  }

  const winners = pickRandomWinners(validParticipants, giveaway.winnerCount);

  await collection.updateOne(
    { giveawayId },
    {
      $set: {
        ended: true,
        winnerIds: winners,
        endedAt: Date.now(),
      },
    }
  );

  const endedEmbed = new EmbedBuilder()
    .setColor("#50C878")
    .setTitle("<:SOELATYPO1:1419871347047403580><:SOELATYPO2:1419871344232763412> Giveaway Ended")
    .setDescription(
      `**Prize:** ${giveaway.prize}\n\n` +
      `🏆 Winners: ${
        winners.length
          ? winners.map(id => `<@${id}>`).join(", ")
          : "No valid entries"
      }\n\n` +
      `Hosted by: <@${giveaway.hostId}>`
    )
      .setFooter({ text: "Soela · 2026", iconURL: "https://cdn.discordapp.com/attachments/1386187429387698226/1495986204712108194/Soela_icon_w_no_text.png?ex=69f76679&is=69f614f9&hm=9285de2a707fb3f93b5925d0cdd7a0456e9f2da113d438f84abf4cbbcc3a242b&" })
     .setTimestamp()

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_enter_${giveawayId}`)
      .setLabel("Giveaway Ended")
      .setEmoji("1419871723083268136")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`giveaway_reroll_${giveawayId}`)
      .setLabel("Reroll")
      .setEmoji("1495310133926826044")
      .setStyle(ButtonStyle.Secondary)
  );

  await message.edit({
    embeds: [endedEmbed],
    components: [row],
  });

  await channel.send(
    winners.length
      ? `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(", ")}! You won **${giveaway.prize}**!`
      : `❌ Giveaway ended, but there were no valid customer entries for **${giveaway.prize}**.`
  );
}

function scheduleGiveawayEnd(client, giveawayId, endsAt) {
  if (!client.giveawayTimeouts) {
    client.giveawayTimeouts = new Map();
  }

  const existing = client.giveawayTimeouts.get(giveawayId);
  if (existing) clearTimeout(existing);

  const delay = Math.max(endsAt - Date.now(), 0);

  const timeout = setTimeout(async () => {
    try {
      await endGiveaway(client, giveawayId);
    } catch (err) {
      console.error(`Failed to end giveaway ${giveawayId}:`, err);
    } finally {
      client.giveawayTimeouts.delete(giveawayId);
    }
  }, delay);

  client.giveawayTimeouts.set(giveawayId, timeout);
}

async function restoreGiveaways(client) {
  const collection = client.db.collection("giveaways");
  const activeGiveaways = await collection.find({ ended: false }).toArray();

  for (const giveaway of activeGiveaways) {
    scheduleGiveawayEnd(client, giveaway.giveawayId, giveaway.endsAt);
  }

  console.log(`✅ Restored ${activeGiveaways.length} active giveaway(s).`);
}

module.exports = {
  scheduleGiveawayEnd,
  restoreGiveaways,
  endGiveaway,
  pickRandomWinners,
};
