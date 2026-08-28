// Builds the PG SOFT "New Currency" sheet as an Excel-openable file, keeping
// PG SOFT's exact field labels, row order and 4-column layout. Values are copied
// verbatim from the live USDT submission except the currency itself (USD).

const SUPA = 'https://ovyrljtgviabkamomjso.supabase.co/functions/v1';

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

export function buildNewCurrencyForm({ operatorToken = '', server = '' } = {}) {
  const TOKEN = operatorToken || '<<OPERATOR_TOKEN>>';
  const SERVER = server || '<<SERVER>>';

  return [
    ['Part 1: General Information / Part 1: 通用信息\nMandatory must fill up by Operator else will new integration request will not able proceed in PG side. / 必填项必须由运营商填写，否则新的对接请求将无法在 PG 端进行。', '', '', 'Operator fill up info / 客户填写资料'],
    ['Basic / 基本资料', '*Brand Name /品牌名称', '', 'GoldenBounty'],
    ['', '* Parent Operator / 总代理\n[Special mandatory: Reseller name 总代理 - 只限包网商，若无请填入PG]', '', 'PG'],
    ['', '* Operator Token / 运营商OT', '', TOKEN],
    ['', '* Server / 服务器', '', SERVER],
    ['', '* Office IP / 办公室IP', '', '31.59.20.176'],
    ['', '*Operator have a market operation license /运营商是否有市场运营牌照', '', 'No'],
    ['Setting / 配置信息', '*Most of the currency conversion are using 1:1 base unit except some currencies eg: KRW, VND, IDR, MMK etc. are using 1:1000 base unit in conversion.\n*Operator is required to perform the conversion before send to the API.', '', ''],
    ['', '*Choice of Currencies /选择货币\nFill up and ensure under PG support list', '', 'USD'],
    ['', '*Person in charge of 1:1000 currency unit / 负责1:1000基础单位的人', '', 'N/A - USD uses the 1:1 base unit, no 1:1000 currency requested'],
    ['', '*Integrate currency USD or SC&GC / 对接USD或SC&GC货币\n[Special mandatory / 特别必填项]', 'Operator request Integrating currency USD or SC&GC /客户请求 对接USD或 SC&GC货币', 'Yes - we request to add currency USD (in addition to our existing live USDT currency). Existing USDT setup must remain unchanged.'],
    ['', '', 'Disclaimer agreement / 免责声明\n(Get disclaimer from PG Support to integrate currency USD or SC&GC)', 'Agreed - we accept PG\'s USD disclaimer and confirm we do not and will not operate in the United States of America. Please issue the disclaimer for our signature if a signed copy is required.'],
    ['', '*Integrate Free Game & Bonus / 对接免费游戏 & 红利', '* Event Type / 活动类型', 'Free Game + Bonus'],
    ['', '', '* [Special Mandatory/特别必填项]\nReason for Not Integrating Free Games or Bonus Features (or Both)', 'N/A - both Free Game and Bonus are integrated and already live for our existing currency. Please enable them for USD as well.'],
    ['', '*Information only needs to be provided when integrating the production environment\n[Special mandatory / 特别必填项]', '*Operator Test site / 运营商测试网站', 'https://golden-bounty.com'],
    ['', '', '*Operator Test Site Country Restriction / 运营商测试网站地区限制', 'No restriction for PG testing. Blocked countries: United States of America, Japan, Hong Kong.'],
    ['', '', '*Test Site Language / 测试网址支持语言', 'English'],
    ['', '', '*Test account&Password / 测试账号&密码', 'Test account: pgtest@golden-bounty.com / Password: PGtest#2026 (email login enabled for PG QA). Open https://golden-bounty.com/login. This account has access to all games, deposit, withdraw and wallet functions.'],
    ['', '*Setup for production directly byPASS QAT using SAME API / 想要直接配置正式环境并且跳过测试\n[Special mandatory / 特别必填项]', 'Operator request Bypass QAT and direct setup production using existing api', 'No - we will complete QAT for the new currency using the same existing API.'],
    ['', '', 'Disclaimer agreement / 免责声明\n(Get disclaimer from PG Support to direct setup Production)', 'N/A - bypass QAT is not requested.'],
    ['', '', '', ''],
    ['Remarks / 备注', 'Target Launch Date / 目标上线时间', '', '2026-08-30'],
    ['', 'Existing live currency / 现有货币', '', 'USDT - remains active and unchanged. This request only ADDS USD.'],
    ['', 'Seamless Wallet API endpoints (unchanged, same for Staging & Production) / 单一钱包 API', 'Verify session API / 令牌验证API', `${SUPA}/pgsoft-verify-session`],
    ['', '', 'Get player wallet /获取用户钱包', `${SUPA}/pgsoft-cash-get`],
    ['', '', 'Adjustment / 余额调整', `${SUPA}/pgsoft-cash-adjustment`],
    ['', '', 'Bet Payout / 下注派彩', `${SUPA}/pgsoft-cash-transfer`],
    ['', 'SERVER IP /服务器IP (unchanged)', '', '172.245.40.68'],
  ];
}

export function buildNewCurrencyXls(opts) {
  const rows = buildNewCurrencyForm(opts);
  const body = rows
    .map(
      (r) =>
        `<tr>${r
          .map((c) => `<td style="vertical-align:top;border:1px solid #999;">${esc(c)}</td>`)
          .join('')}</tr>`
    )
    .join('');
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>New Currency</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>${body}</table></body></html>`;
}