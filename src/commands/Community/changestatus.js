const {
  ActivityType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");

const activityTypes = {
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changestatus")
    .setDescription("Change the bot's activity status")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Status activity type")
        .setRequired(true)
        .addChoices(
          { name: "Playing", value: "playing" },
          { name: "Streaming", value: "streaming" },
          { name: "Listening", value: "listening" },
          { name: "Watching", value: "watching" },
          { name: "Competing", value: "competing" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("Status text to display")
        .setRequired(true)
        .setMaxLength(128)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("Streaming URL, only needed for Streaming")
        .setRequired(false)
    ),

  async execute(interaction) {
    const type = interaction.options.getString("type");
    const text = interaction.options.getString("text");
    const url = interaction.options.getString("url");

    const statusOptions = {
      type: activityTypes[type],
    };

    if (type === "streaming") {
      if (!url || !/^https?:\/\//i.test(url)) {
        return interaction.reply({
          content: "Please provide a valid streaming URL when using the Streaming status type.",
          ephemeral: true,
        });
      }

      statusOptions.url = url;
    }

    await interaction.client.user.setActivity(text, statusOptions);

    const embed = new EmbedBuilder()
      .setColor("#50C878")
      .setTitle("<:SOELAINITIAL:1419871723083268136>  Status Updated")
      .setDescription(`The bot is now **${type}**: ${text}!`)
       .setFooter({ text: "Soela · 2026", iconURL: "https://cdn.discordapp.com/attachments/1386187429387698226/1495986204712108194/Soela_icon_w_no_text.png?ex=69f76679&is=69f614f9&hm=9285de2a707fb3f93b5925d0cdd7a0456e9f2da113d438f84abf4cbbcc3a242b&" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
