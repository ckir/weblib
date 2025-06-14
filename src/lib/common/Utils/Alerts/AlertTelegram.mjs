import { Bot } from 'grammy';

// Find user IDs with https://t.me/getidsbot
export default class AlertTelegram {
    constructor(bot = process.env.WEBLIB_ALERTTELEGRAM_BOT, recipients = [1538031015]) {
        this.className = this.constructor.name;
        this.bot = new Bot(bot);
        this.logger = global.WebLib.logger;
        this.recipients = recipients;
    }

    async sendTelegram(message) {

        const partSize = 4000;
        const parts = (message.length > partSize) ? this.splitStringByLine(message, 4000) : [message];

        for (const recipient of this.recipients) {
            for (const part of parts) {
                try {
                    await this.bot.api.sendMessage(recipient, part);
                    this.logger.silly(`Message sent: ${message}`);
                } catch (error) {
                    console.error(error);
                    this.logger.error(`Error sending message to ${recipient}: ${part}`, error);
                }
            }
        }

    } // sendTelegram

    splitStringByLine(string, maxLength) {
        const lines = string.split('\n');
        const parts = [];
        let currentPart = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (currentPart.length + line.length <= maxLength) {
                currentPart += line + '\n';
            } else {
                parts.push(currentPart.trim());
                currentPart = line + '\n';
            }
        }

        if (currentPart.length > 0) {
            parts.push(currentPart.trim());
        }

        return parts;
    } // splitStringByLine

} // AlertTelegram

// const st = new AlertTelegram();
// st.sendTelegram("Test 2 message from AlertTelegram class");