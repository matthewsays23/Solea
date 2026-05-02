const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a Soela giveaway")
    .addStringOption(option =>
      option
        .setName("prize")
        .setDescription("Prize for the giveaway")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("duration")
        .setDescription("Duration in minutes")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("winners")
        .setDescription("How many winners")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const prize = interaction.options.getString("prize");
    const duration = interaction.options.getInteger("duration");
    const winnerCount = interaction.options.getInteger("winners");

    const customerRoleId = process.env.CUSTOMER_ROLE_ID;
    if (!customerRoleId) {
      return interaction.reply({
        content: "❌ CUSTOMER_ROLE_ID is missing!",
        ephemeral: true,
      });
    }

    const endsAt = Date.now() + duration * 60 * 1000;

    const embed = new EmbedBuilder()
      .setColor("#50C878")
      .setTitle("<:SOELATYPO1:1419871347047403580><:SOELATYPO2:1419871344232763412> Participate in our giveaway!")
      .setDescription(
        `**Prize Information:** ${prize}\n\n` +
        `Click the button below to enter.\n` +
        `You must have the **Customer** or above role to join.\n\n` +
        `⏰ Ends: <t:${Math.floor(endsAt / 1000)}:R>\n` +
        `🏆 Winners: ${winnerCount}`
      )
     .setFooter({ text: "Soela · 2026", iconURL: "https://cdn.discordapp.com/attachments/1386187429387698226/1495986204712108194/Soela_icon_w_no_text.png?ex=69f76679&is=69f614f9&hm=9285de2a707fb3f93b5925d0cdd7a0456e9f2da113d438f84abf4cbbcc3a242b&" })
     .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("giveaway_enter_placeholder")
        .setLabel("Enter Giveaway")
        .setEmoji("1419871723083268136")
        .setStyle(ButtonStyle.Secondary)
    );

    const message = await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    const giveawayId = message.id;

    row.components[0].setCustomId(`giveaway_enter_${giveawayId}`);

    await message.edit({
      components: [row],
    });

    await interaction.client.db.collection("giveaways").insertOne({
      giveawayId,
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      messageId: message.id,
      hostId: interaction.user.id,
      prize,
      winnerCount,
      customerRoleId,
      participants: [],
      winnerIds: [],
      ended: false,
      endsAt,
      createdAt: Date.now(),
    });

    if (!interaction.client.giveawayTimeouts) {
      interaction.client.giveawayTimeouts = new Map();
    }

    const { scheduleGiveawayEnd } = require("../../utils/giveawayManager");
    scheduleGiveawayEnd(interaction.client, giveawayId, endsAt);

    await interaction.reply({
      content: "✅ Giveaway started.",
      ephemeral: true,
    });
  },
};
