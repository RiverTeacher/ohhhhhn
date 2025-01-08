const new_quiz_cooldowns = new Map();  
const apiConnectionStatus = new Map();  
const on_quiz_ban = new Collection();  
  
client.on('messageCreate', async (message) => {  
    if (!message.guild) return; // ダイレクトメッセージを無視  
    if (message.author.bot) return; // ボットからのメッセージを無視  
  
    const args = message.content.split(' ');  
    const command = args.shift();  
   
  
    if (message.content.startsWith('!quiz')) {  
        const userBanInfo = on_quiz_ban.get(message.author.id);  
        if (userBanInfo) {  
            const { banEndTime, reason } = userBanInfo;  
  
            if (Date.now() < banEndTime) {  
                const timeLeft = banEndTime - Date.now();  
                const minutesLeft = Math.floor(timeLeft / 60000);  
                const secondsLeft = Math.floor((timeLeft % 60000) / 1000);  
  
                return message.reply(`クイズの使用は制限されています。\n制限解除まで ${minutesLeft} 分 ${secondsLeft} 秒\n制限理由: ${reason}`);  
            } else {  
                on_quiz_ban.delete(message.author.id);  
            }  
        }  
  
        const subAccountRoleID = '1255022636501831741'; // サブアカウントのロールID  
        if (message.member.roles.cache.has(subAccountRoleID)) {  
            return message.reply('このコマンドはサブアカウントを使って使用することはできません。');  
        }  
  
        const channelID = '1027481732691263509'; // クイズが許可されたチャンネルのID  
        if (message.channel.id !== channelID) {  
            return message.reply('このコマンドは指定されたチャンネルでのみ使用できます。');  
        }  
  
        if (apiConnectionStatus.has(message.author.id)) {  
            return message.reply('サーバー接続中です。少々お待ちください。');  
        }  
  
        apiConnectionStatus.set(message.author.id, true); // API接続中のフラグを立てる  
  
        let cooldownTime = Date.now();  
  
        if (new_quiz_cooldowns.has(message.author.id)) {  
            const expirationTime = new_quiz_cooldowns.get(message.author.id);  
            if (Date.now() < expirationTime) {  
                const timeLeft = (expirationTime - Date.now()) / 1000;  
                apiConnectionStatus.delete(message.author.id); // API接続中のフラグを解除  
                return message.reply(`クールダウン中です。${timeLeft.toFixed(0)}秒待ってから再度使用してください。`);  
            }  
        }  
  
        const mention = message.mentions.members.first();  
        if (!mention) {  
            apiConnectionStatus.delete(message.author.id); // API接続中のフラグを解除  
            cooldownTime += 900000; // 900秒 (15分) のクールダウン  
            new_quiz_cooldowns.set(message.author.id, cooldownTime);  
            return message.reply('クイズに回答するメンバーをメンションしてください。');  
        }  
  
        try {  
            const response = await fetch('PLEASE_ENTER_HERE_YOUR_API_URL');  //こちらにAPIのリンクを挿入してください。
            const quizData = await response.json();  
  
            const { topicLink, quiz, answer, explanation, image } = quizData;  
  
            let quizMessage = `${mention.toString()} **クイズ:**\n${topicLink}\n${quiz}\n${image}`;  
  
            const sentMessage = await message.channel.send({ content: quizMessage });  
  
            const filter = (response) => {  
                return response.author.id === mention.id;  
            };  
  
            const collector = message.channel.createMessageCollector({ filter, time: 15000 });  
  
            collector.on('collect', (msg) => {  
                if (msg.content.trim().toLowerCase() === answer.toLowerCase()) {  
                    message.reply(`${mention.toString()} 正解です！`);  
                } else {  
                    message.reply(`${mention.toString()} 不正解です。\n正解は "${answer}" です。\n解説: ${explanation}`);  
                    const role = message.guild.roles.cache.get('1027486149721202739');  
                    if (role) {  
                        msg.member.roles.add(role).then(() => {  
                            setTimeout(() => {  
                                msg.member.roles.remove(role);  
                            }, 180000);  
                        }).catch(console.error);  
                    }  
                }  
            });  
  
            collector.on('end', (collected) => {  
                if (collected.size === 0) {  
                    message.reply(`${mention.toString()} 時間内に回答がありませんでした。不正解となります。`);  
                    const role = message.guild.roles.cache.get('1027486149721202739');  
                    if (role) {  
                        mention.roles.add(role).then(() => {  
                            setTimeout(() => {  
                                mention.roles.remove(role);  
                            }, 180000);  
                        }).catch(console.error);  
                    }  
                }  
            });  
  
            cooldownTime += 900000; // 900秒 (15分) のクールダウン  
            new_quiz_cooldowns.set(message.author.id, cooldownTime);  
        } catch (error) {  
            console.error('クイズの取得中にエラーが発生しました:', error);  
            message.reply('クイズの取得中にエラーが発生しました。');  
        } finally {  
            apiConnectionStatus.delete(message.author.id); // API接続中のフラグを解除  
        }  
    }  
});  
  
const pointsCooldowns = new Map();  
const effectCodes = new Map();  
const pointsFilePath = './points.json';  
  
// ポイントデータの読み込み  
let pointsData = {};  
if (fs.existsSync(pointsFilePath)) {  
    pointsData = JSON.parse(fs.readFileSync(pointsFilePath, 'utf8'));  
} else {  
    fs.writeFileSync(pointsFilePath, JSON.stringify({}));  
}  
  
client.on('messageCreate', async (message) => {  
    if (!message.guild) return; // ダイレクトメッセージを無視  
    if (message.author.bot) return; // ボットからのメッセージを無視  
  
    const args = message.content.split(' ');  
    const command = args.shift();  
  
    if (command === '!getpoint') {  
        if (pointsCooldowns.has(message.author.id)) {  
            const cooldownEnd = pointsCooldowns.get(message.author.id);  
            if (Date.now() < cooldownEnd) {  
                const timeLeft = Math.ceil((cooldownEnd - Date.now()) / 60000);  
                return message.reply(`ポイントを取得できるまで ${timeLeft} 分お待ちください。`);  
            }  
        }  
  
        const randomPoints = Math.floor(Math.random() * 10) + 1; // 1~10 のランダムなポイント  
        pointsData[message.author.id] = (pointsData[message.author.id] || 0) + randomPoints;  
  
        // ポイントデータを保存  
        fs.writeFileSync(pointsFilePath, JSON.stringify(pointsData));  
  
        pointsCooldowns.set(message.author.id, Date.now() + 3600000); // 1時間のクールダウン  
        return message.reply(`${randomPoints} ポイントを獲得しました！現在のポイント: ${pointsData[message.author.id]} ポイント`);  
    }  
 
    // !getpoint command 
    if (command === '!getpoint') { 
        if (pointsCooldowns.has(message.author.id)) { 
            const cooldownEnd = pointsCooldowns.get(message.author.id); 
            if (Date.now() < cooldownEnd) { 
                const timeLeft = Math.ceil((cooldownEnd - Date.now()) / 60000); 
                return message.reply(`ポイントを取得できるまで ${timeLeft} 分お待ちください。`); 
            } 
        } 
 
        const randomPoints = Math.floor(Math.random() * 10) + 1; 
        pointsData[message.author.id] = (pointsData[message.author.id] || 0) + randomPoints; 
 
        fs.writeFileSync(pointsFilePath, JSON.stringify(pointsData)); 
 
        pointsCooldowns.set(message.author.id, Date.now() + 3600000); // 1時間のクールダウン 
        return message.reply(`${randomPoints} ポイントを獲得しました！現在のポイント: ${pointsData[message.author.id]} ポイント`); 
    } 
});
