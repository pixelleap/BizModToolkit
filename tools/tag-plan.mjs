/* 生成 docs/TAG-REVIEW.md：标签词表 + 每个 feat 的建议标签
 * 只读 docs/data.json，不修改任何数据。
 * 用法：node tools/tag-plan.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'data.json'), 'utf8').replace(/^\uFEFF/, ''));
const cards = data.state.cards;

/* 参考项目（PLBizToolbox/data.yaml）的 23 个标签 */
const VOCAB = [
  ['广告', '广告系', '看广告/展示广告带来的收益点', '广告'],
  ['激励广告', '广告系', '看广告换奖励的那类', '（新）'],
  ['广告收入', '广告系', '展示型广告位（插屏/横幅）', '（新）'],
  ['付费', '付费系', '直接付费才能拿到的内容或权益', '付费'],
  ['权益商品', '付费系', 'VIP / 月卡 / 订阅这类持续权益', 'VIP'],
  ['售卖容器', '付费系', '商店、礼包这类货架', '（新）'],
  ['售卖机制', '付费系', '定价、限时、存钱罐这类机制', '（新）'],
  ['货币', '资源系', '金币 / 钻石 / 币种', '货币'],
  ['资源消耗', '资源系', '消耗资源或库存', '资源'],
  ['道具消耗', '资源系', '消耗的是道具而非货币', '（新）'],
  ['消耗', '资源系', '通用消耗，不特指资源/道具', '（新）'],
  ['资源循环', '资源系', '体力 / 门票 / 自然恢复这类循环', '（新）'],
  ['留存', '留存系', '为留存服务的机制', '（新）'],
  ['目标留存', '留存系', '目标驱动型留存', '（新）'],
  ['竞争留存', '留存系', '排行 / 竞赛型留存', '（新）'],
  ['内容留存', '留存系', '内容消费型留存', '（新）'],
  ['目标驱动', '留存系', '任务 / 里程碑 / 进度驱动', '（新）'],
  ['转化', '留存系', '曝光 → 付费/广告的转化', '（新）'],
  ['收集', '成长系', '收集、图鉴、套系', '（新）'],
  ['成长', '成长系', '属性/能力/等级成长线', '（新）'],
  ['内容型适配', '成长系', '依赖内容更新的产品适配', '（新）'],
  ['需合规审查', '底座', '抽奖概率、隐私、年龄分级', '（新）'],
  ['共用能力', '底座', '所有模块可以复用的底座能力', '共用能力']
];

/* 模块级建议标签（来自参考项目的 module.tags；参考项目没有的按类比补） */
const MODULE_TAGS = {
  card_reward_choice: ['激励广告'],
  card_level_result: ['激励广告'],
  card_revive: ['广告', '道具消耗'],
  card_booster: ['广告', '资源消耗'],
  card_boost: ['广告', '资源消耗'],
  card_ingame_goal: ['目标驱动'],
  card_ad_slot: ['广告收入'],
  card_checkin: ['留存', '广告'],
  card_quest: ['目标留存'],
  card_challenge: ['留存', '广告', '付费'],
  card_collect: ['留存', '消耗'],
  card_pass: ['付费', '留存'],
  card_rank: ['竞争留存'],
  card_segment: ['留存', '转化'],
  card_shop: ['售卖容器'],
  card_bundle: ['售卖容器'],
  card_flash: ['售卖容器'],
  card_piggy: ['售卖机制'],
  card_vip: ['权益商品'],
  card_noads: ['权益商品'],
  card_gacha: ['需合规审查'],
  card_energy: ['资源循环'],
  card_meta_growth: ['成长', '消耗'],
  card_content_unlock: ['广告', '货币', '付费'],
  card_character: ['收集', '付费'],
  card_album: ['内容留存'],
  card_export: ['内容型适配'],
  card_decor: ['成长', '消耗'],
  card_economy: ['共用能力'],
  card_ad_system: ['共用能力'],
  card_payment: ['共用能力'],
  card_condition: ['共用能力'],
  card_remote: ['共用能力'],
  card_data: ['共用能力'],
  card_compliance: ['共用能力'],
  /* 参考项目里没有、按类比补的 */
  card_level_struct: ['内容留存'],
  card_pack_shop: ['售卖容器'],
  card_free_chest: ['留存', '广告'],
  card_vip_event: ['权益商品', '留存'],
  card_cumulative: ['留存', '目标驱动']
};

/* 参考项目的模块名，用来说明对应关系 */
const REF_NAME = {
  card_reward_choice: '壁纸奖励', card_level_result: '结算奖励', card_revive: '失败挽救',
  card_booster: '辅助与道具', card_boost: '临时增益', card_ingame_goal: '局内目标',
  card_ad_slot: '广告展示节点', card_checkin: '签到与周期领取', card_quest: '任务与成就',
  card_challenge: '挑战活动', card_collect: '收集活动', card_pass: '通行证',
  card_rank: '排行与竞赛', card_segment: '人群专属活动', card_shop: '通用商店',
  card_bundle: '礼包', card_flash: '限时特惠', card_piggy: '存钱罐',
  card_vip: '会员与订阅', card_noads: '去广告与便利', card_gacha: '抽奖与随机商品',
  card_energy: '体力与次数', card_meta_growth: '局外成长', card_content_unlock: '内容包解锁',
  card_character: '角色与外观', card_album: '相册与收藏', card_export: '内容导出',
  card_decor: '建造与装饰', card_economy: '奖励与经济', card_ad_system: '广告接入与控制',
  card_payment: '支付与权益', card_condition: '活动与条件引擎', card_remote: '远程配置与实验',
  card_data: '数据与经验沉淀', card_compliance: '本地化与合规'
};

const RULES = [
  ['广告', /广告|激励|插屏|横幅|频控|保护期|兜底|投放|曝光位/],
  ['权益商品', /VIP|会员|订阅|权益/],
  ['付费', /付费|直购|首购|礼包|特惠|定价|价格|抽奖|保底/],
  ['货币', /货币|金币|钻石|余额|币种/],
  ['资源消耗', /资源|库存|材料/],
  ['道具消耗', /道具/],
  ['消耗', /消耗/],
  ['留存', /留存|签到|任务|成就|收集|图鉴|相册/],
  ['成长', /成长|升级|属性|能力|解锁/],
  ['内容型适配', /内容|关卡|主题包|图包|壁纸|作品|章节/],
  ['需合规审查', /合规|隐私|年龄|市场规则|语言|时区|概率|随机/],
  ['转化', /转化|曝光|收益|埋点|实验|数据/],
  ['目标驱动', /目标|里程碑|进度/],
  ['竞争留存', /竞赛|排行|排名|榜单/],
  ['售卖容器', /商店|货架|商品|售卖/],
  ['资源循环', /体力|恢复|循环|门票/]
];

function tagsForFeat(card, variant, feat) {
  const text = [feat.title, feat.desc || '', variant.title || ''].join(' ');
  const hits = [];
  for (const [tag, re] of RULES) if (re.test(text)) hits.push(tag);
  const fallback = MODULE_TAGS[card.id] || [];
  // 命中就用命中；一个都没命中才落到模块建议标签
  const merged = hits.length ? hits : fallback.slice();
  return merged.slice(0, 3);
}

const rows = [];
let total = 0, changed = 0, added = 0;
for (const card of cards) {
  const modTags = MODULE_TAGS[card.id] || [];
  const items = [];
  for (const v of card.options || []) {
    for (const f of v.options || []) {
      total++;
      const cur = (f.tags || []).slice();
      const next = tagsForFeat(card, v, f);
      const isSame = cur.length === next.length && cur.slice().sort().join('|') === next.slice().sort().join('|');
      if (!isSame) changed++;
      if (!cur.length && next.length) added++;
      items.push({ variant: v.title, feat: f.title, cur, next });
    }
  }
  rows.push({ card, modTags, items });
}

const L = [];
L.push('# 标签清单与选项打标');
L.push('');
L.push('状态：**待确认，未执行**（这份文档只描述要加什么，没有改任何数据）');
L.push('参考：https://pixelleap.github.io/PLBizToolbox/ · https://github.com/pixelleap/PLBizToolbox');
L.push('');
L.push('基线：v4.21.0 · ' + cards.length + ' 模块 / ' + total + ' feat');
L.push('打标后：**' + changed + ' 个 feat 的标签会变**，其中 **' + added + ' 个是从无标签补上**；其余 ' + (total - changed) + ' 个保持不变。');
L.push('');
L.push('---');
L.push('');
L.push('## 1. 标签词表（23 个，采用参考项目那套）');
L.push('');
L.push('| 标签 | 归类 | 含义 | 对应我们现在 |');
L.push('|---|---|---|---|');
for (const [t, g, d, old] of VOCAB) L.push('| ' + t + ' | ' + g + ' | ' + d + ' | ' + old + ' |');
L.push('');
L.push('退役：`其他`（现在 192 个 feat 挂着它，改成具体标签）。改名：`VIP` → `权益商品`，`资源` → `资源消耗`。');
L.push('');
L.push('## 2. 打标规则');
L.push('');
L.push('1. 先按关键词命中（feat 标题 + 说明 + 所属变体标题一起匹配）');
L.push('2. 一个标签都没命中 → 落到模块建议标签');
L.push('3. 每个 feat 最多 3 个标签，按规则表顺序截断');
L.push('4. 模块（卡片）级标签同样换成新词表');
L.push('');
L.push('## 3. 模块级建议标签');
L.push('');
L.push('| 行 | 模块 | 建议标签 | feat 数 | 参考项目对应 |');
L.push('|---|---|---|---|---|');
for (const { card } of rows) {
  const n = (card.options || []).reduce((m, v) => m + (v.options || []).length, 0);
  L.push('| ' + card.rowId.replace('row_', '') + ' | ' + card.title + ' | ' + (MODULE_TAGS[card.id] || []).join(' · ') + ' | ' + n + ' | ' + (REF_NAME[card.id] || '**参考项目无**') + ' |');
}
L.push('');
L.push('## 4. 选项（feat）打标清单');
L.push('');
L.push('只列**会变化**的 feat；`现有` 是当前标签，`建议` 是打标后的标签。');
L.push('');
for (const { card, items } of rows) {
  const diff = items.filter(i => i.cur.slice().sort().join('|') !== i.next.slice().sort().join('|'));
  if (!diff.length) continue;
  L.push('### ' + card.title + '（' + card.id + '）');
  L.push('');
  L.push('模块标签：' + (MODULE_TAGS[card.id] || []).join(' · '));
  L.push('');
  L.push('| 变体 | feat | 现有 | 建议 |');
  L.push('|---|---|---|---|');
  for (const it of diff) {
    L.push('| ' + it.variant + ' | ' + it.feat + ' | ' + (it.cur.join('、') || '—') + ' | ' + it.next.join('、') + ' |');
  }
  L.push('');
}

fs.writeFileSync(path.join(root, 'docs', 'TAG-REVIEW.md'), L.join('\n') + '\n', 'utf8');
console.log('written docs/TAG-REVIEW.md  lines=' + L.length + '  feats=' + total + '  changed=' + changed + '  added=' + added);
