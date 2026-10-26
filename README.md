# Pass the Initiative _(pass-the-initiative)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

A Foundry VTT v13 module initiative tracker where the gamemaster decides combat turn order.

Pass the Initiative provides an alternative encounter flow for tabletop roleplaying in Foundry VTT. Instead of fixed initiative rolls, the GM or active participants pass the turn dynamically to the next actor.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Background

Traditional TTRPG initiative uses static turn orders calculated once per combat round. Pass the Initiative introduces dynamic pop-corn style or GM-adjudicated turn delegation, making tactical decisions and cinematic action sequences more flexible in Foundry Virtual Tabletop.

## Install

### Foundry VTT Module Browser

1. In Foundry VTT Setup, navigate to the **Add-on Modules** tab.
2. Click **Install Module**.
3. Search for `Pass the Initiative` or paste the manifest URL:
   ```
   https://raw.githubusercontent.com/Nevitash/pass-the-initiative/master/module.json
   ```
4. Click **Install**.

### Development Setup

```bash
npm install
npm run link
npm run dev
```

The `npm run link` script creates a directory link into your local Foundry VTT user data modules directory.

## Usage

1. Open your Foundry VTT world.
2. Enable **Pass the Initiative** under **Game Settings > Manage Modules**.
3. Open the Combat Tracker encounter interface.
4. Use the custom initiative buttons to designate and pass initiative to the next actor.

## Maintainers

[@Nevitash](https://github.com/Nevitash)

## Contributing

PRs accepted. Please open an issue first to discuss substantial workflow changes.

## License

[MIT](LICENSE)
