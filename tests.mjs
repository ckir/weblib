import WebLib from './src/index.mjs';

const bot = process.env.WEBLIB_ALERTTELEGRAM_BOT;
const st = new WebLib.Common.Utils.Alerts.AlertTelegram();
st.sendTelegram(`AlertTelegram ${new Date().toISOString()}`);