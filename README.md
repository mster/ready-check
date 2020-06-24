# Ready-Check

A Discord bot that adds a World of Warcraft style 'ready-check' to your server.

## Usage

`rdy command [args]`

## Commands

### Check

`rdy check [@designation] topic`

Performs a ready check in the given channel with the given designation, defaulting to @here. Users react to the ready check message by selecting either thumbs up or down emojis (👍, 👎).

![runs command](https://user-images.githubusercontent.com/15038724/85495563-97cd8200-b58f-11ea-84fb-e4f3881f3c20.png)

After the check time has elasped, a verdict will be decided and the original message will be replaced.

![determines verdict](https://user-images.githubusercontent.com/15038724/85495650-cea39800-b58f-11ea-88f5-dd108bb5ac50.png)

As of v1.0.0, Ready-Check will wait 60 seconds before determining a verdict.

### Help

`rdy help`

Posts a message in the current channel which displays usage information.
