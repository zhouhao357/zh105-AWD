/* =====================================================================
 * 高级网页设计I 网页元素设计 项目报告生成器
 * 策略：以 Word 生成的合法模板骨架(base_orig)为底，只替换 <w:body> 正文，
 *       保留模板原生命名空间、样式、编号、页眉页脚与 sectPr。
 * 环境变量：OUT_FILE=输出路径  SKIP_IMG=1 跳过图片  SKIP_CODE=1 跳过代码块
 * ===================================================================== */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ---------- CRC32 ---------- */
const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c;
    }
    return t;
})();
function crc32(buf) {
    let c = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
    return (c ^ (-1)) >>> 0;
}

/* ---------- 最小 zip 打包 ---------- */
function zip(files) {
    const parts = [], central = [];
    let offset = 0;
    files.forEach(f => {
        const nameBuf = Buffer.from(f.name, 'utf8');
        const comp = zlib.deflateRawSync(f.data);
        const crc = crc32(f.data);
        const lfh = Buffer.alloc(30);
        lfh.writeUInt32LE(0x04034b50, 0);
        lfh.writeUInt16LE(20, 4);
        lfh.writeUInt16LE(0x0800, 6);
        lfh.writeUInt16LE(8, 8);
        lfh.writeUInt16LE(0, 10);
        lfh.writeUInt16LE(0, 12);
        lfh.writeUInt32LE(crc, 14);
        lfh.writeUInt32LE(comp.length, 18);
        lfh.writeUInt32LE(f.data.length, 22);
        lfh.writeUInt16LE(nameBuf.length, 26);
        lfh.writeUInt16LE(0, 28);
        parts.push(lfh, nameBuf, comp);
        const cdh = Buffer.alloc(46);
        cdh.writeUInt32LE(0x02014b50, 0);
        cdh.writeUInt16LE(20, 4);
        cdh.writeUInt16LE(20, 6);
        cdh.writeUInt16LE(0x0800, 8);
        cdh.writeUInt16LE(8, 10);
        cdh.writeUInt16LE(0, 12);
        cdh.writeUInt16LE(0, 14);
        cdh.writeUInt32LE(crc, 16);
        cdh.writeUInt32LE(comp.length, 20);
        cdh.writeUInt32LE(f.data.length, 24);
        cdh.writeUInt16LE(nameBuf.length, 28);
        cdh.writeUInt32LE(0, 38);
        cdh.writeUInt32LE(offset, 42);
        central.push(Buffer.concat([cdh, nameBuf]));
        offset += lfh.length + nameBuf.length + comp.length;
    });
    const cd = Buffer.concat(central);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(cd.length, 12);
    eocd.writeUInt32LE(offset, 16);
    return Buffer.concat([...parts, cd, eocd]);
}

/* ---------- 路径 ---------- */
const BASE = 'c:/Users/zhoua/Desktop/高级网页设计';
const SRC = BASE + '/.codebuddy/base_orig';   /* Word 生成的原始骨架 */
const WORK = BASE + '/.codebuddy/build';      /* 本次工作副本 */
const DATA = BASE + '/.codebuddy/report-data.txt';
const OUT = process.env.OUT_FILE || (BASE + '/24001010105-周浩.docx');
const SKIP_IMG = !!process.env.SKIP_IMG;
const SKIP_CODE = !!process.env.SKIP_CODE;

/* ---------- OOXML 片段生成 ---------- */
const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function pngSize(file) {
    const b = fs.readFileSync(file);
    if (b.slice(1, 4).toString() === 'PNG') {
        return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), buf: b };
    }
    return { w: 1200, h: 700, buf: b };
}
const EMU = 9525;
const MAX_W = 5000000;   /* 正文可用宽度约 13.9cm */

/* rPr 子元素顺序：rFonts → b → noProof → color → sz → szCs → shd
   pPr 子元素顺序：shd → spacing → ind → jc */
function runProps(o) {
    o = o || {};
    const ea = o.ea || '宋体';
    const ascii = o.ascii || 'Times New Roman';
    const size = o.size || 21;
    const rFonts = '<w:rFonts w:ascii="' + ascii + '" w:eastAsia="' + ea +
        '" w:hAnsi="' + ascii + '" w:cs="' + ascii + '" w:hint="eastAsia"/>';
    const bold = o.bold ? '<w:b/><w:bCs/>' : '';
    const noProof = o.noProof ? '<w:noProof/>' : '';
    const color = o.color ? '<w:color w:val="' + o.color + '"/>' : '';
    const shd = o.shd ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>' : '';
    const spacing = '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) +
        '" w:line="' + (o.line || 300) + '" w:lineRule="auto"/>';
    const ind = o.indent ? '<w:ind w:left="' + o.indent + '"/>' : '';
    const jc = o.align ? '<w:jc w:val="' + o.align + '"/>' : '';
    return {
        r: '<w:rPr>' + rFonts + bold + noProof + color +
            '<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/>' + shd + '</w:rPr>',
        p: '<w:pPr>' + (o.shdP || '') + spacing + ind + jc + '</w:pPr>'
    };
}
function para(text, o) {
    const p = runProps(o);
    const lines = String(text).split('\n');
    const runs = lines.map((l, i) =>
        '<w:r>' + p.r + (i ? '<w:br/>' : '') +
        '<w:t xml:space="preserve">' + esc(l) + '</w:t></w:r>').join('');
    return '<w:p>' + p.p + runs + '</w:p>';
}
/* 行内图片：wp:docPr/@id 必须是整数，pic:cNvPr/@id 亦为整数 */
function imagePara(numId, cx, cy, alt) {
    return '<w:p><w:pPr><w:spacing w:before="120" w:after="60" w:line="240" w:lineRule="auto"/>' +
        '<w:jc w:val="center"/></w:pPr><w:r><w:drawing>' +
        '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
        '<wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
        '<wp:docPr id="' + numId + '" name="图片 ' + numId + '" descr="' + esc(alt || '') + '"/>' +
        '<wp:cNvGraphicFramePr>' +
        '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>' +
        '</wp:cNvGraphicFramePr>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:nvPicPr><pic:cNvPr id="' + numId + '" name="zhImage' + numId + '.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="rId' + (100 + numId) + '"/>' +
        '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
        '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}

/* ================= 解析模板 ================= */
fs.rmSync(WORK, { recursive: true, force: true });
fs.cpSync(SRC, WORK, { recursive: true });

const pristine = fs.readFileSync(WORK + '/word/document.xml', 'utf8');
const bodyMark = '<w:body>';
const bodyStart = pristine.indexOf(bodyMark) + bodyMark.length;
const rootOpen = pristine.slice(0, bodyStart);
const bodyEnd = pristine.lastIndexOf('</w:body>');
const sectPr = pristine.slice(pristine.lastIndexOf('<w:sectPr'), bodyEnd);

const tblStart = pristine.indexOf('<w:tbl>');
const tblEnd = pristine.indexOf('</w:tbl>') + '</w:tbl>'.length;
const titleBlock = pristine.slice(bodyStart, tblStart);   /* 模板标题段落 */
const infoTable = pristine.slice(tblStart, tblEnd);       /* 学号/姓名/班级/选题表格 */

/* 按 w14:paraId 精确取出一个 <w:p>…</w:p> */
function sliceP(paraId) {
    const marker = 'w14:paraId="' + paraId + '"';
    const i = pristine.indexOf(marker);
    if (i < 0) return '';
    const s = pristine.lastIndexOf('<w:p ', i);
    const e = pristine.indexOf('</w:p>', i) + '</w:p>'.length;
    return pristine.slice(s, e);
}
const H_SHIGHI = sliceP('05E6C119');   /* 实施过程 */
const H_SEC1 = sliceP('008A91F6');     /* 1 项目需求与实现 */
const H_SEC2 = sliceP('544FF46F');     /* 2 项目代码 */
const H_SEC3 = sliceP('50769BBC');     /* 3 测试与发布 */
const H_SUM = sliceP('215E8807');      /* 项目总结 */

/* ================= 解析报告数据 ================= */
const HEI = '黑体', SONG = '宋体', MONO = 'Consolas';
const raw = fs.readFileSync(DATA, 'utf8').split(/\r?\n/);
const items = [];
for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    if (!line.startsWith('##')) continue;
    const parts = line.split('|');
    const tag = parts[0].slice(2);
    const a1 = parts[1] === undefined ? '' : parts[1];
    const a2 = parts[2] === undefined ? '' : parts[2];
    if (tag === 'CODE') {
        const code = [];
        i++;
        while (i < raw.length && !raw[i].startsWith('##')) { code.push(raw[i]); i++; }
        i--;
        items.push({ tag: 'CODE', a1: a1, code: code });
    } else {
        items.push({ tag: tag, a1: a1, a2: a2 });
    }
}

/* 按 H1 切分 */
const sections = { head: [], sec1: [], sec2: [], sec3: [], tail: [] };
let cur = 'head';
items.forEach(it => {
    if (it.tag === 'H1') {
        const t = it.a1;
        cur = t.indexOf('一、') === 0 ? 'sec1'
            : t.indexOf('二、') === 0 ? 'sec2'
                : t.indexOf('三、') === 0 ? 'sec3' : 'tail';
        return;
    }
    sections[cur].push(it);
});

/* ================= 生成正文 ================= */
const media = [];
const rels = [];
let imgNum = 0;
const body = [];

function addImage(file, caption) {
    if (SKIP_IMG) return;
    if (!fs.existsSync(file)) {
        body.push(para('[缺少图片：' + file + ']', { size: 21 }));
        return;
    }
    const s = pngSize(file);
    let cx = s.w * EMU, cy = s.h * EMU;
    if (cx > MAX_W) { cy = Math.round(cy * MAX_W / cx); cx = MAX_W; }
    imgNum++;
    const name = 'zhImage' + imgNum + '.png';
    media.push({ name: 'word/media/' + name, data: s.buf });
    rels.push('<Relationship Id="rId' + (100 + imgNum) +
        '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"' +
        ' Target="media/' + name + '"/>');
    body.push(imagePara(imgNum, cx, cy, caption));
    if (caption) body.push(para(caption, { size: 19, align: 'center', color: '595959', after: 200 }));
}

function render(list) {
    list.forEach(it => {
        switch (it.tag) {
            case 'TITLE':
            case 'SUBTITLE':
                break;   /* 使用模板原生标题 */
            case 'CENTER':
                body.push(para(it.a1, { size: 21, align: 'center', after: 80 }));
                break;
            case 'H1':
                break;   /* 使用模板原生章节标题 */
            case 'H2':
                body.push(para(it.a1, { ea: HEI, ascii: HEI, size: 24, bold: true, before: 180, after: 120 }));
                break;
            case 'P':
                body.push(para(it.a1, { size: 21, align: 'both', line: 320, after: 120 }));
                break;
            case 'CODE': {
                if (SKIP_CODE) break;
                it.code.forEach(l => {
                    body.push(para(l, {
                        ea: MONO, ascii: MONO, size: 17, shd: 'F2F2F2', shdP: '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>',
                        indent: 200, line: 240, after: 0, noProof: true
                    }));
                });
                body.push(para('', { size: 12, after: 120 }));
                break;
            }
            case 'IMG':
                addImage(it.a1, it.a2);
                break;
        }
    });
}

/* 正文装配：模板标题 → 信息表格 → 补充信息 → 实施过程 → 三个章节 → 项目总结 */
const headHtml = [], sec1Html = [], sec2Html = [], sec3Html = [], tailHtml = [];
function renderInto(arr, list) {
    const saved = body.length;
    render(list);
    arr.push(body.slice(saved).join(''));
    body.length = saved;
}
renderInto(headHtml, sections.head);
renderInto(sec1Html, sections.sec1);
renderInto(sec2Html, sections.sec2);
renderInto(sec3Html, sections.sec3);
renderInto(tailHtml, sections.tail);

const documentXml = rootOpen +
    titleBlock + infoTable +
    headHtml.join('') +
    H_SHIGHI + H_SEC1 + sec1Html.join('') +
    H_SEC2 + sec2Html.join('') +
    H_SEC3 + sec3Html.join('') +
    H_SUM + tailHtml.join('') +
    sectPr + '</w:body></w:document>';

/* ================= 写包 ================= */
fs.writeFileSync(WORK + '/word/document.xml', Buffer.from(documentXml, 'utf8'));
media.forEach(m => fs.writeFileSync(WORK + '/' + m.name, m.data));

const relPath = WORK + '/word/_rels/document.xml.rels';
let relXml = fs.readFileSync(relPath, 'utf8');
relXml = relXml.replace('</Relationships>', rels.join('') + '</Relationships>');
fs.writeFileSync(relPath, Buffer.from(relXml, 'utf8'));

const ctPath = WORK + '/[Content_Types].xml';
let ct = fs.readFileSync(ctPath, 'utf8');
if (ct.indexOf('Extension="png"') < 0) {
    ct = ct.replace(/(<Types[^>]*>)/, '$1<Default Extension="png" ContentType="image/png"/>');
    fs.writeFileSync(ctPath, Buffer.from(ct, 'utf8'));
}

function walk(dir, root, out) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
        const p = dir + '/' + e.name;
        if (e.isDirectory()) walk(p, root, out);
        else out.push({
            name: path.relative(root, p).split(path.sep).join('/'),
            data: fs.readFileSync(p)
        });
    });
}
const files = [];
walk(WORK, WORK, files);
files.sort((a, b) => {
    if (a.name === '[Content_Types].xml') return -1;
    if (b.name === '[Content_Types].xml') return 1;
    return 0;
});

fs.writeFileSync(OUT, zip(files));
console.log('DONE ->', OUT, '| images:', imgNum, '| paragraphs:', body.length,
    '| size:', (fs.statSync(OUT).size / 1024).toFixed(1) + 'KB');
