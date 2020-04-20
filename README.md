# colorful
let your discord server be colorful.

includes:
- automatic detection of color roles
- silent use when the bot doesn't have permission to talk
- color detection from user profile picture
- color restriction to certain roles

requires node and npm.
to use locally, put all the files in a folder, use `npm install`, change the options on `config.json` as you prefer, create a file named `.env`, copy the contents on `env` and add your bot token after `TOKEN=`. then use `node server.js` to make your bot online.

to add role restriction, write like this in the `config.json`:

```js
"colorDetect": {
    "default": {
      "startswith": [
        "Cor ",
        "Color "
      ],
      "endswith": [],
      "contains": []
    },
    "my special role name": {
        "startswith": [
          "Special Color "
        ]
        "endswith": [],
        "contains": []
    }
  }
```

then, the role named `my special role name` will include the colors with name starting with `Special Color `. don't repeat color detection methods from default roles. if you don't want role restriction, leave it as in the example `config.json`.

host for free remixing on glitch
<!-- Remix Button -->
<a href="https://glitch.com/edit/#!/remix/colorful-discord">
  <img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fremix%402x.png?1513093958726" alt="remix this" height="33">
</a>


<a href="https://discordapp.com/api/oauth2/authorize?client_id=606546413505216532&permissions=268511232&scope=bot">add the default version of the bot to your guild clicking here</a>

better README coming soon.
