const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { bottoken, guildId } = require("./config.js");
const users = require("./modules/users.js");

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
];

const client = new Client({ intents: intents });

client.once('ready', async () => {
    console.log('The bloxyspin bot is ready! Slay!');

    const profileCommand = new SlashCommandBuilder()
        .setName('profile')
        .setDescription("Check the site profile of someone!")
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Select a user to view their profile')
                .setRequired(true))
        .toJSON();

    const leaderboardCommand = new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription("View the leaderboard")
        .toJSON();

    const profitCommand = new SlashCommandBuilder()
        .setName('profit')
        .setDescription("Check your profit")
        .toJSON();

    await client.application.commands.set([profileCommand, leaderboardCommand, profitCommand]);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'profile') {
        try {
            const selected = interaction.options.getUser('user');
            if (!selected) {
                return await interaction.reply("You must select a user to check their profile!");
            }

            const user = await users.findOne({ discordid: selected.id });
            if (user) {
                await interaction.reply(`**${user.username} - lvl ${user.level}** \nWager: ${user.wager} R$  \nWon: ${user.won}  \nLost: ${user.lost} R$`);
            } else {
                await interaction.reply(`No linked account found for ${selected.username}.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply("Something went wrong...");
        }
    } else if (commandName === 'leaderboard') {
        try {
            const leaders = await users.find({}).sort({ wager: -1 }).limit(10);
            if (leaders.length > 0) {
                const leaderboard = leaders.map((user, index) => 
                    `#${(index + 1).toString().padEnd(2)} ${user.username.padEnd(15)} R$${user.wager} :heart:`
                ).join('\n');
                await interaction.reply(`**Leaderboard:**\n#   USERNAME      WAGER\n${leaderboard}`);
            } else {
                await interaction.reply("**NO CONTENT FOUND**");
            }
        } catch (error) {
            console.error(error);
            await interaction.reply("Something went wrong...");
        }
    } else if (commandName === 'profit') {
        try {
            const user = await users.findOne({ discordid: interaction.user.id });
            if (user) {
                const profit = user.won - user.lost;
                await interaction.reply(`this is your profit: **${profit}**`);
            } else {
                await interaction.reply("link a discord account to do this.");
            }
        } catch (error) {
            console.error(error);
            await interaction.reply("Something went wrong...");
        }
    }
});

client.login(bottoken);
