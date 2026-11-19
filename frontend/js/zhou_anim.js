/*
 * 姓名：周浩 | 学号：24001010105 |
 * 时间：2026-11-19 | 大模型：Space Bunny
 *
 * zhou_anim.js —— 首页动画逻辑（原生实现，不依赖任何第三方库）
 *   1. zhou_anim_split_title  标题逐字入场
 *   2. zhou_anim_count        数字滚动计数
 *   3. zhou_anim_io           IntersectionObserver 滚动入场（含 AJAX 新插入节点）
 *   4. zhou_anim_progress     顶部滚动进度条 + 返回顶部
 *   5. zhou_anim_parallax     Hero 鼠标视差
 *   6. 尊重系统 prefers-reduced-motion 偏好
 */

'use strict';

var zhou_anim_reduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. 标题逐字入场 ---------- */
function zhou_anim_split_title() {
    var zhou_el = document.getElementById('zhou_hero_title');
    if (!zhou_el) {
        return;
    }
    var zhou_text = zhou_el.textContent;
    zhou_el.textContent = '';
    var zhou_i = 0;
    for (var zhou_k = 0; zhou_k < zhou_text.length; zhou_k++) {
        var zhou_ch = zhou_text.charAt(zhou_k);
        var zhou_span = document.createElement('span');
        zhou_span.className = 'zhou_char';
        zhou_span.textContent = zhou_ch === ' ' ? '\u00a0' : zhou_ch;
        zhou_span.style.setProperty('--zhou-delay', (zhou_anim_reduced ? 0 : zhou_i * 0.045) + 's');
        zhou_el.appendChild(zhou_span);
        zhou_i += 1;
    }
    console.log('[动画] 标题拆分为 ' + zhou_i + ' 个字符，逐字入场');
}

/* ---------- 2. 数字滚动计数 ---------- */
function zhou_anim_count(zhou_el, zhou_target, zhou_dec) {
    /* 防止重复计数：MutationObserver 会因 textContent 变化再次触发扫描 */
    if (zhou_el.getAttribute('data-zhou-counted') === '1') {
        return;
    }
    zhou_el.setAttribute('data-zhou-counted', '1');
    var zhou_digits = zhou_dec === undefined ? 0 : zhou_dec;
    if (zhou_anim_reduced) {
        zhou_el.textContent = zhou_target.toFixed(zhou_digits);
        return;
    }
    var zhou_start = null;
    var zhou_dur = 1200;
    function zhou_step(zhou_ts) {
        if (zhou_start === null) {
            zhou_start = zhou_ts;
        }
        var zhou_p = Math.min(1, (zhou_ts - zhou_start) / zhou_dur);
        var zhou_ease = 1 - Math.pow(1 - zhou_p, 3);
        zhou_el.textContent = (zhou_target * zhou_ease).toFixed(zhou_digits);
        if (zhou_p < 1) {
            window.requestAnimationFrame(zhou_step);
        } else {
            zhou_el.textContent = zhou_target.toFixed(zhou_digits);
        }
    }
    window.requestAnimationFrame(zhou_step);
}

/* ---------- 3. 滚动入场 ---------- */
var zhou_anim_observer = null;

function zhou_anim_io() {
    if (!('IntersectionObserver' in window)) {
        /* 浏览器不支持时直接全部显示 */
        var zhou_all = document.querySelectorAll('[data-zhou-anim]');
        for (var zhou_i = 0; zhou_i < zhou_all.length; zhou_i++) {
            zhou_all[zhou_i].classList.add('zhou_in');
        }
        return;
    }
    if (zhou_anim_observer) {
        return zhou_anim_observer;
    }
    zhou_anim_observer = new IntersectionObserver(function (zhou_entries) {
        zhou_entries.forEach(function (zhou_entry) {
            var zhou_el = zhou_entry.target;
            if (!zhou_entry.isIntersecting) {
                /* 已经滚出视口上方的元素直接显示，避免快速滚动后永久隐藏 */
                if (zhou_entry.boundingClientRect.bottom < 0) {
                    zhou_el.classList.add('zhou_in');
                    zhou_anim_observer.unobserve(zhou_el);
                    var zhou_pass = zhou_el.querySelector('[data-zhou-count]');
                    if (zhou_pass) {
                        zhou_anim_set_final(zhou_pass);
                    }
                }
                return;
            }
            zhou_el.classList.add('zhou_in');
            zhou_anim_observer.unobserve(zhou_el);
            /* 数字卡片进入视口后开始滚动 */
            var zhou_num = zhou_el.querySelector('[data-zhou-count]');
            if (zhou_num) {
                var zhou_target = Number(zhou_num.getAttribute('data-zhou-count')) || 0;
                var zhou_dec = parseInt(zhou_num.getAttribute('data-zhou-dec') || '0', 10);
                zhou_anim_count(zhou_num, zhou_target, zhou_dec);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    return zhou_anim_observer;
}

/** 直接显示最终数值（元素已被快速滚过时使用） */
function zhou_anim_set_final(zhou_el) {
    if (!zhou_el || zhou_el.getAttribute('data-zhou-counted') === '1') {
        return;
    }
    zhou_el.setAttribute('data-zhou-counted', '1');
    var zhou_target = Number(zhou_el.getAttribute('data-zhou-count')) || 0;
    var zhou_dec = parseInt(zhou_el.getAttribute('data-zhou-dec') || '0', 10);
    zhou_el.textContent = zhou_target.toFixed(zhou_dec);
}

/**
 * 滚动时检查待计数的数字卡片
 * 在视口内 → 播放滚动动画；已经滚过去 → 直接显示最终值
 */
function zhou_anim_check_counts() {
    var zhou_els = document.querySelectorAll('[data-zhou-count]:not([data-zhou-counted])');
    for (var zhou_i = 0; zhou_i < zhou_els.length; zhou_i++) {
        var zhou_el = zhou_els[zhou_i];
        var zhou_r = zhou_el.getBoundingClientRect();
        if (zhou_r.bottom <= 0) {
            zhou_anim_set_final(zhou_el);
        } else if (zhou_r.top < window.innerHeight) {
            zhou_anim_count(
                zhou_el,
                Number(zhou_el.getAttribute('data-zhou-count')) || 0,
                parseInt(zhou_el.getAttribute('data-zhou-dec') || '0', 10)
            );
        }
    }
}

/**
 * 扫描需要动画的元素并注册观察
 * 统计卡片、商品卡片、公告表格行都由 AJAX 动态插入，因此需要重复扫描
 */
function zhou_anim_scan() {
    var zhou_io = zhou_anim_io();

    /* 统计卡片 */
    var zhou_stats = document.querySelectorAll('#zhou_stat .zhou_stat');
    for (var zhou_i = 0; zhou_i < zhou_stats.length; zhou_i++) {
        if (zhou_stats[zhou_i].classList.contains('zhou_in')) {
            continue;
        }
        zhou_stats[zhou_i].setAttribute('data-zhou-anim', 'up');
        zhou_stats[zhou_i].style.setProperty('--zhou-delay', (zhou_i * 0.09) + 's');
        zhou_io.observe(zhou_stats[zhou_i]);
    }

    /* 商品卡片 */
    var zhou_cards = document.querySelectorAll('#zhou_hot .zhou_goods_card');
    for (zhou_i = 0; zhou_i < zhou_cards.length; zhou_i++) {
        if (zhou_cards[zhou_i].classList.contains('zhou_in')) {
            continue;
        }
        zhou_cards[zhou_i].setAttribute('data-zhou-anim', 'up');
        zhou_cards[zhou_i].style.setProperty('--zhou-delay', (zhou_i * 0.08) + 's');
        zhou_io.observe(zhou_cards[zhou_i]);
    }

    /* 公告表格行 */
    var zhou_rows = document.querySelectorAll('#zhou_notice tr');
    for (zhou_i = 0; zhou_i < zhou_rows.length; zhou_i++) {
        zhou_rows[zhou_i].style.setProperty('--zhou-delay', (zhou_i * 0.06) + 's');
    }

    /* 其余静态区块（已入场的跳过，避免重复 observe 触发重复动画） */
    var zhou_blocks = document.querySelectorAll('[data-zhou-anim]');
    for (zhou_i = 0; zhou_i < zhou_blocks.length; zhou_i++) {
        if (zhou_blocks[zhou_i].classList.contains('zhou_in')) {
            continue;
        }
        zhou_io.observe(zhou_blocks[zhou_i]);
    }
}
/* ---------- 4. 滚动进度条 + 返回顶部 ---------- */
function zhou_anim_progress() {
    var zhou_bar = document.getElementById('zhou_progress_bar');
    var zhou_btn = document.getElementById('zhou_top_btn');
    var zhou_tick = false;

    function zhou_update() {
        var zhou_h = document.documentElement.scrollHeight - window.innerHeight;
        var zhou_p = zhou_h > 0 ? (window.scrollY / zhou_h) : 0;
        if (zhou_bar) {
            zhou_bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, zhou_p)) + ')';
        }
        if (zhou_btn) {
            if (window.scrollY > 520) {
                zhou_btn.classList.add('zhou_show');
            } else {
                zhou_btn.classList.remove('zhou_show');
            }
        }
        zhou_tick = false;
    }

    window.addEventListener('scroll', function () {
        if (!zhou_tick) {
            zhou_tick = true;
            window.requestAnimationFrame(function () {
                zhou_update();
                zhou_anim_check_counts();
            });
        }
    }, { passive: true });

    window.addEventListener('resize', zhou_update);
    zhou_update();

    if (zhou_btn) {
        zhou_btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: zhou_anim_reduced ? 'auto' : 'smooth' });
        });
    }
}

/* ---------- 5. Hero 鼠标视差 ---------- */
function zhou_anim_parallax() {
    var zhou_hero = document.querySelector('.zhou_hero');
    var zhou_inner = document.querySelector('.zhou_hero_inner');
    if (!zhou_hero || !zhou_inner || zhou_anim_reduced) {
        return;
    }
    zhou_hero.addEventListener('mousemove', function (zhou_e) {
        var zhou_r = zhou_hero.getBoundingClientRect();
        var zhou_x = (zhou_e.clientX - zhou_r.left) / zhou_r.width - 0.5;
        var zhou_y = (zhou_e.clientY - zhou_r.top) / zhou_r.height - 0.5;
        zhou_inner.style.transform = 'translate(' + (zhou_x * 14).toFixed(2) + 'px,' + (zhou_y * 10).toFixed(2) + 'px)';
    });
    zhou_hero.addEventListener('mouseleave', function () {
        zhou_inner.style.transform = 'translate(0,0)';
    });
}

/* ---------- 6. 打字机副标题 ---------- */
function zhou_anim_typewriter() {
    var zhou_el = document.getElementById('zhou_hero_desc');
    if (!zhou_el || zhou_anim_reduced) {
        return;
    }
    var zhou_full = zhou_el.getAttribute('data-zhou-text') || zhou_el.textContent;
    zhou_el.textContent = '';
    var zhou_caret = document.createElement('span');
    zhou_caret.className = 'zhou_hero_caret';
    zhou_el.appendChild(zhou_caret);

    var zhou_i = 0;
    var zhou_timer = window.setInterval(function () {
        if (zhou_i >= zhou_full.length) {
            window.clearInterval(zhou_timer);
            return;
        }
        zhou_caret.parentNode.insertBefore(document.createTextNode(zhou_full.charAt(zhou_i)), zhou_caret);
        zhou_i += 1;
    }, 34);
    console.log('[动画] 副标题打字机启动，共 ' + zhou_full.length + ' 字');
}

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('zhou_anim');
    /* 只有脚本正常运行才添加 ready 类：若脚本被禁用或出错，页面内容仍然完整可见 */
    document.body.classList.add('zhou_anim_ready');
    zhou_anim_split_title();
    zhou_anim_typewriter();
    zhou_anim_progress();
    zhou_anim_parallax();
    zhou_anim_scan();
    window.requestAnimationFrame(zhou_anim_check_counts);

    /* AJAX 插入的新节点（统计卡片、商品卡片、公告行）自动补动画 */
    if ('MutationObserver' in window) {
        var zhou_mo_timer = null;
        var zhou_mo = new MutationObserver(function () {
            /* 节流：避免计数动画每次改写 textContent 都触发一次扫描 */
            if (zhou_mo_timer) {
                return;
            }
            zhou_mo_timer = window.setTimeout(function () {
                zhou_mo_timer = null;
                zhou_anim_scan();
            }, 120);
        });
        zhou_mo.observe(document.body, { childList: true, subtree: true });
        console.log('[动画] 已启用 MutationObserver，动态插入内容自动补入场动画');
    }

    console.log('[动画] 首页动画已启动（reduced-motion =', zhou_anim_reduced, '）');
});