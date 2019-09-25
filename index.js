const discord = require("discord.js");
const fs = require("fs");
const config = require("./config.json");
const db = require('./DB');
const bot = new discord.Client();
const noperms = "You don't have permission to use that command!"
bot.commands = new discord.Collection();
bot.aliases = new discord.Collection();
bot.readyTimestampTrue = Date.now()

// When bot ready
bot.on("ready", async () => {
  console.log(`${bot.user.username} is ready for action!`);
  if (config.activity.streaming == true) {
    bot.user.setActivity(config.activity.game, {url: 'https://twitch.tv/username'});
  } else {
    bot.user.setActivity(config.activity.game, {type: 'PLAYING'}); //PLAYING, LISTENING, WATCHING
    bot.user.setStatus('idle'); // dnd, idle, online, invisible
  }
});

/* 
command handler
*/ 

bot.on("message", (m) => { 
if (m.author.bot || m.channel.type != 'text') return
if (!m.content.toLowerCase().startsWith(config.prefix)) return
var cmd = String(m.content).toLowerCase().split(config.prefix)[1].replace(/\s+/g,' ').split(' ')[0].toLowerCase()
var args = String(m.content).substring(`${config.prefix}${cmd}`.length).replace(/\s+/g,' ')
new (require('./Events/handler')).CommandHandler(cmd, bot, m, args).runCmd()
})

bot.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`${CommandsFolder}${command}`)];
      let cmd = require(`${CommandsFolder}${command}`);
      bot.commands.delete(command);
      bot.aliases.forEach((cmd, alias) => {
        if (cmd === command) bot.aliases.delete(alias);
      });
      bot.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        bot.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      console.log(e)
    }
  });
};
/* 
command handler
*/ 


bot.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  
  if (!db[message.author.id]) db[message.author.id] = {
    warns: 0
  };

});

// Server ping | kick & ban (Full Working!)
bot.on("message", async (message) => {
  if (message.author.bot) return;
  let prefix = config.prefix
  if (!message.content.startsWith(prefix)) return;

  let args = message.content.slice(prefix.length).trim().split(/ +/)
  let cmd = args.shift().toLowerCase()

  if (cmd === "ping") {
      let botping = new Date() - message.createdAt

      return message.channel.send(`My ping is **${botping}**ms`)
  }
  else if (cmd === "kick") {
      if (!message.member.roles.some(r => ["Moderator","Administrator","Toothless"].includes(r.name))) return message.reply("You don't have permission to use that command!")

      let member = message.mentions.members.first() || message.guild.members.get(args[0])
      if (!member) return message.reply("Please specify a user to kick.")
      if (!member.kickable) return message.reply("Couldn't kick this user.")
      let reason = args.slice(1).join(" ")
      
      await member.kick(reason).catch(error => {
          return message.reply("There was a error.")
      })
      return message.channel.send(`@${member.user.tag} was kicked by @${message.author.tag} | Reason: ${reason}`)
  }
  else if (cmd === "ban") {
      if (!message.member.roles.some(r => ["Administrator","Toothless"].includes(r.name))) return message.reply("You don't have permission to use that command!")

      let member = message.mentions.members.first() || message.guild.members.get(args[0])
      if (!member) return message.reply("Please specify a user to ban.")
      if (!member.bannable) return message.reply("Couldn't ban this user.")
      let reason = args.slice(1).join(" ")

      await member.ban(reason).catch(error => {
          return message.reply("There was a error.")
      })
      return message.channel.send(`@${member.user.tag} was banned by @${message.author.tag} | Reason: ${reason}`)
  }
});

bot.login(config.token);
