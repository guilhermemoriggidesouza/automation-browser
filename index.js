const bot = require("./bot");
const [__, _, email, password] = process.argv;
bot(email, password);
