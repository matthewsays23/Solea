const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tickets")
    .setDescription("Send the Soela support panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#50C878")
      .setTitle("<:SOELAINITIAL:1419871723083268136>  Support Panel")
      .setDescription(
        "Need help with something in Soela? Choose the option below that best matches your request, and our team will review it as soon as possible.\n\n" +
"-# To keep support organized, please use this ticket panel before reaching out to the **Executive Team** directly."
      )
      .setImage("https://cdn.discordapp.com/attachments/1386187429387698226/1430698337539199106/Support_info.png?ex=69f73068&is=69f5dee8&hm=b092de8eca6b5c39c407eed290a650b095c4d8cb18e8e02614194e5aeda8471d&");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("soela_ticket_select")
      .setPlaceholder("Choose a ticket type")
      .addOptions([
        {
          label: "Staff Management",
          value: "management",
          emoji: "1495999651097215057",
        },
        {
          label: "Public Relations",
          value: "relations",
          emoji: "1495997604604153876",
        },
        {
          label: "General Inquiry",
          value: "general",
          emoji: "1496609522158932039",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: "✅ Ticket panel sent.",
      ephemeral: true,
    });
  },
};
