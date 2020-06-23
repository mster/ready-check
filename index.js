const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('./config.json')

client.on('ready', () => {
  // Bot is ready
  console.log(`Bot has started.`)
  client.user.setActivity(`you.`, { type: 'WATCHING' })
})

let checking = false

client.on('message', async message => {
  // good house keeping
  if (message.author.bot) return
  if (!message.content.startsWith(config.prefix)) return

  // arg splitting
  const args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g)
  const command = args.shift().toLowerCase()

  // init designation with '@here' flag
  let designation = '@here'
  if (args[0] && args[0].includes('@')) designation = args.shift()

  // rdy check [@designation] topic -> '@designation Are we ready for topic?'
  if (command === 'check') {
    if (checking) {
      message.delete().catch(e => {})
      const reply = await message.channel.send(
        `<@${message.author.id}>, We are already running a ready check.`
      )
      setTimeout(() => {
        reply.delete().catch(e => {})
      }, 5000)

      return
    }

    checking = true

    const msg = await message.channel.send(
      `${designation} Are we ready for ${args.join(' ')}?`
    )
    // add template reactions
    try {
      await msg.react('❓')
      await msg.react('👍')
      await msg.react('👎')
    } catch (err) {
      onError(err)
    }

    // perform collection
    // https://discordjs.guide/popular-topics/reactions.html
    const filter = (reaction, user) => {
      return (
        ['👍', '👎'].includes(reaction.emoji.name) &&
        user.id === message.author.id
      )
    }
    const collectorOpts = {
      time: 60 * 1000
    }
    const collector = await msg.createReactionCollector(filter, collectorOpts)

    // add listeners
    collector.on('collect', onCollect)
    collector.on('end', onEnd)
    collector.on('error', onError)

    // listeners
    function onCollect (reaction) {
      console.log('ON-COLLECT')
    }

    function onEnd (collected) {
      console.log('ON-END')
      try {
        const hasYea = collected.has('👍')
        const hasNay = collected.has('👎')

        if (hasNay)
          message.channel.send(
            `${designation} We are NOT ready for ${args.join(' ')}!`
          )
        else if (!hasNay && hasYea)
          message.channel.send(
            `${designation} We are ready for ${args.join(' ')}!`
          )
        else
          message.channel.send(
            `${designation} Nobody responded to my ready check...`
          )

        msg.delete().catch(e => {})
      } catch (err) {
        onError(err)
      }

      checking = false
    }

    function onError (err) {
      msg.channel.send(
        'Uh oh! Something went *fucky-wucky* with our check. Go ping the author with this error message'
      )
      msg.channel.send(err)

      process.exitCode = 1
    }
  }
})

client.login(config.token)
