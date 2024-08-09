// 最後に取得したEventIDを保存する変数
let earthquake_last_eventID = null;

client.once('ready', () => {
    console.log('Bot is ready!');

    // 5秒ごとにAPIをチェック
    setInterval(async () => {
        try {
            const response = await axios.get('https://api.wolfx.jp/jma_eew.json');
            const data = response.data;

            // 発表時刻をDateオブジェクトに変換
            const announcedTime = new Date(data.AnnouncedTime);
            const currentTime = new Date();
            const timeDifference = (currentTime - announcedTime) / 1000; // 秒単位での差分を計算

            // 発表時刻が60秒以上前、または震度2以下の場合は無視
            if (timeDifference > 60 || data.MaxIntensity < '3') {
                return;
            }

            // 新しいEventIDが前回のものと異なる場合
            if (data.EventID !== earthquake_last_eventID) {
                earthquake_last_eventID = data.EventID;

                // Embedを作成
                const embed = new EmbedBuilder()
                    .setTitle(data.Title)
                    .setDescription(`${data.CodeType} - ${data.Issue.Source}`)
                    .addFields(
                        { name: '発表時刻', value: data.AnnouncedTime, inline: true },
                        { name: '震源地', value: data.Hypocenter, inline: true },
                        { name: '震度', value: data.MaxIntensity, inline: true },
                        { name: 'マグニチュード', value: data.Magunitude.toString(), inline: true },
                        { name: '深さ', value: `${data.Depth} km`, inline: true },
                        { name: '緯度', value: data.Latitude.toString(), inline: true },
                        { name: '経度', value: data.Longitude.toString(), inline: true }
                    )
                    .setColor('#ff0000')
                    .setFooter({ text: '緊急地震速報' })
                    .setTimestamp();

                // 全てのサーバーをチェック
                client.guilds.cache.forEach(guild => {
                    // 全てのチャンネルをチェック
                    guild.channels.cache.forEach(channel => {
                        // チャンネルトピックに「on.地震速報」が含まれている場合
                        if (channel.topic && channel.topic.includes('on.地震速報')) {
                            channel.send({ embeds: [embed] });
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, 5000); // 5秒ごとにチェック
});
