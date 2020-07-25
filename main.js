require('dotenv').config();
const fs = require('fs');
const Telegram = require('telegraf/telegram');
const VK_API = require('vk_api_tool');

const vk = new VK_API(process.env.VK_TOKEN, '5.110', 'ru');
const tg = new Telegram(process.env.TG_TOKEN);

const get_last_post_id = () => parseInt(fs.readFileSync('last_post_id.txt', 'utf8'));
const save_last_post_id = id => fs.writeFileSync('last_post_id.txt', id.toString());

const check_new_post = async () => {
    try {
        let res = await vk.use('wall.get', {
            domain: process.env.GROUP_DOMAIN,
            count: 1,
        });
        let post = res.items[0];
        let photo_sizes = post.attachments.find(a => a.type == 'photo').photo.sizes;
        let photo_url = photo_sizes[photo_sizes.length - 1].url;
        let last_post_id = get_last_post_id();
        if (post.id > last_post_id && !post.text.includes('✌')) {
            await tg.sendPhoto(process.env.CHANNEL_ID, {url: photo_url}, {
                caption: post.text,
                reply_markup: {
                    inline_keyboard: [
                        [ { text: 'Перейти', url: post.attachments.find(a => a.type == 'link').link.url } ]
                    ]
                }
            });
            save_last_post_id(post.id);
        }
    } catch (e) {}

    setTimeout(check_new_post, 1000 * 15);
}

check_new_post();