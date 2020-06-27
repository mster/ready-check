const Discord = require('discord.js')
const debug = require('util').debuglog('ready-check')

const client = new Discord.Client()
const config = require('./config.json')

const STATE = {
  checking: false,
  ref: null,
  cmdAuthor: ''
}

client.on('ready', () => {
  // Bot is ready
  debug('Bot has started.')
  client.user.setActivity('you.', { type: 'WATCHING' })
})

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

  // help command prints usage
  if (command === 'help') {
    message.channel.send(
      `<@${message.author.id}>, to run a ready check use the command:\n\`rdy check [@designation] topic\`.\n\nFor example, \`rdy check @everyone Summer Olypmics\``
    )
    message.delete().catch(e => {})

    return
  }

  // remove the ready check
  if (command === 'rm') {
    if (STATE.cmdAuthor === message.author.id) {
      STATE.ref.delete().catch(e => {})
      STATE.ref = null
      STATE.checking = false

      message.delete().catch(e => {})
    } else {
      const reply = await message.channel.send(
        `<@${message.author.id}>, only the command author may exit the ready check.`
      )

      setTimeout(() => {
        reply.delete().catch(e => {})
      }, 10000)
    }
  }

  // rdy check [@designation] topic -> '@designation Are we ready for topic?'
  if (command === 'check') {
    if (STATE.checking) {
      message.delete().catch(e => {})

      const reply = await message.channel.send(
        `<@${message.author.id}>, We are already running a ready check.`
      )

      // delete the reply after 10 seconds
      setTimeout(() => {
        reply.delete().catch(e => {})
      }, 10000)

      return
    }

    const msg = await message.channel.send(
      `${designation} Are we ready for ${args.join(' ')}?`
    )

    STATE.checking = true
    STATE.ref = msg
    STATE.cmdAuthor = message.author.id

    // add template reactions for users to click
    try {
      await msg.react('❓')
      await msg.react('👍')
      await msg.react('👎')
    } catch (error) {
      errorOut(error)
    }

    // perform collection of reactions
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

    // add listeners for each event
    collector.on('collect', collected => {
      debug('ON-COLLECT')
    })

    collector.on('end', collected => {
      debug('ON-END')

      // eagerly exit the collection when 'rm' is entered
      if (!STATE.ref) return

      try {
        const hasYea = collected.has('👍')
        const hasNay = collected.has('👎')

        if (hasNay) {
          message.channel.send(
            `${designation} We are NOT ready for ${args.join(' ')}!`
          )
        } else if (!hasNay && hasYea) {
          message.channel.send(
            `${designation} We are ready for ${args.join(' ')}!`
          )
        } else {
          message.channel.send(
            `${designation} Nobody responded to my ready check...`
          )
        }

        msg.delete().catch(e => {})
      } catch (error) {
        errorOut(error)
      }

      // revert state after our check has completed
      STATE.checking = false
      STATE.ref = null
      STATE.cmdAuthor = ''

      // clean up listeners
      collector.removeAllListeners()
    })

    collector.on('error', error => {
      msg.channel.send('Uh oh! Something went *funky* with our check.')
      errorOut(error)
    })
  }
})

function errorOut (error) {
  // just console.error with exitCode setting
  process.exitCode = 1
  console.error(error)
  process.exit()
}

client.login(config.token)
