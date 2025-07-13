import WebLib from './src/index.mjs';

// const tstz = WebLib.Common.Utils.Misc.DateTimeUtils.tstz()
// const bot = process.env.WEBLIB_ALERTTELEGRAM_BOT;
// const st = new WebLib.Common.Utils.Alerts.AlertTelegram();
// st.sendTelegram(`AlertTelegram ${new Date().toISOString()}`);

const url = 'https://script.google.com/macros/s/AKfycbzcVsRaN-y1GCl--9QMIPpcTjBMagE5KNnmfndi9mBLz0K_en8AtcxhqJOpsIMS8Uyo1Q/exec';
// const response = await WebLib.Common.Retrieve.RequestUnlimited.endPoint(url);
// console.log('Response:', response);
const rl = new WebLib.Common.Retrieve.RequestLimited();
const limited = await rl.fetchAll([{url: url}, {url: url}]);
console.log('Limited Response:', limited);