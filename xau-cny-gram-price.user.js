// ==UserScript==
// @name         XAU/CNY 黄金克价转换
// @namespace    https://github.com/openclaw/xau-cny-gram
// @version      1.3.0
// @description  将 investing.com 上 XAU/CNY 的盎司价格自动转换为每克人民币价格
// @author       OpenClaw
// @match        https://cn.investing.com/currencies/xau-cny*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=investing.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 1 金衡盎司 = 31.1034768 克（贵金属交易标准）
    var GRAMS_PER_TROY_OZ = 31.1035;

    // ========== 工具函数 ==========

    function parsePrice(text) {
        if (!text) return NaN;
        return parseFloat(text.replace(/[^\d.-]/g, ''));
    }

    function fmt(n) {
        return n.toFixed(2);
    }

    // ========== 查找价格元素 ==========

    function findPriceElement() {
        // 主选择器：data-test 属性（由用户确认的页面结构）
        var el = document.querySelector('[data-test="instrument-price-last"]');
        if (el) return el;

        // 备用选择器
        var fallbacks = [
            '[data-test="header-price-last"]',
            '.instrument-price_last__KQzyA',
        ];
        for (var i = 0; i < fallbacks.length; i++) {
            el = document.querySelector(fallbacks[i]);
            if (el) return el;
        }
        return null;
    }

    // ========== 构建显示卡片 ==========

    function createCard(pricePerOz, pricePerGram) {
        var card = document.createElement('div');
        card.id = 'xau-gram-price-card';

        // 与页面一致的浅色风格
        card.style.cssText = [
            'margin: 12px 0',
            'padding: 16px 20px',
            'background: linear-gradient(135deg, #fef9e7, #fdf2d0)',
            'border: 2px solid #f0c040',
            'border-radius: 12px',
            'display: inline-block',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'box-shadow: 0 2px 12px rgba(180,130,20,0.15)',
            'max-width: 100%',
            'box-sizing: border-box',
        ].join(';');

        card.innerHTML =
            '<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">' +
                '<div style="text-align:center;">' +
                    '<div style="color:#b8860b;font-size:13px;font-weight:600;margin-bottom:6px;">' +
                        '🥇 黄金克价（人民币）' +
                    '</div>' +
                    '<div style="color:#232526;font-size:30px;font-weight:800;line-height:1.1;">' +
                        '¥' + fmt(pricePerGram) +
                    '</div>' +
                    '<div style="color:#999;font-size:11px;margin-top:2px;">元 / 克</div>' +
                '</div>' +
                '<div style="width:1px;height:48px;background:rgba(180,130,20,0.2);"></div>' +
                '<div style="color:#888;font-size:12px;line-height:1.7;">' +
                    '参考盎司价<br>' +
                    '<span style="color:#555;font-weight:600;">¥' + fmt(pricePerOz) + '</span> / 盎司<br>' +
                    '<span style="color:#aaa;">1 金衡盎司 = 31.1035 克</span>' +
                '</div>' +
            '</div>';

        return card;
    }

    // ========== 更新已有卡片 ==========

    function updateCard(pricePerOz, pricePerGram) {
        var card = document.getElementById('xau-gram-price-card');
        if (!card) return false;

        // 更新克价数字
        var gramEl = card.querySelector('div[style*="font-size:30px"]');
        if (gramEl) gramEl.textContent = '¥' + fmt(pricePerGram);

        // 更新盎司参考价
        var ozEl = card.querySelector('span[style*="font-weight:600"]');
        if (ozEl) ozEl.textContent = '¥' + fmt(pricePerOz);

        return true;
    }

    // ========== 找到合适的插入位置 ==========

    function findInsertionParent(priceEl) {
        // 根据用户提供的 xpath 结构，价格在深层 div 链中
        // /html/body/div[1]/div[2]/div[2]/div[2]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]
        // 往上走 3 层到 div[3]（价格+买卖价所在的区域容器）

        var target = priceEl;
        for (var i = 0; i < 3; i++) {
            if (target.parentElement) {
                target = target.parentElement;
            }
        }
        return target;
    }

    // ========== 核心注入逻辑 ==========

    function tryInject() {
        var priceEl = findPriceElement();
        if (!priceEl) return false;

        var raw = priceEl.textContent.trim();
        var pricePerOz = parsePrice(raw);
        if (isNaN(pricePerOz) || pricePerOz <= 0) return false;

        var pricePerGram = pricePerOz / GRAMS_PER_TROY_OZ;

        // 已有卡片 → 只更新数字
        if (updateCard(pricePerOz, pricePerGram)) return true;

        // 新建卡片
        var card = createCard(pricePerOz, pricePerGram);
        var anchor = findInsertionParent(priceEl);

        if (anchor && anchor.parentElement) {
            anchor.parentElement.insertBefore(card, anchor.nextSibling);
        } else {
            // 终极兜底
            priceEl.parentElement.appendChild(card);
        }

        console.log(
            '[XAU-CNY 克价] 盎司 ¥' + fmt(pricePerOz) +
            ' → 克价 ¥' + fmt(pricePerGram)
        );
        return true;
    }

    // ========== 轮询等待 ==========

    function startPolling() {
        var attempts = 0;
        var maxAttempts = 60;
        var timer = setInterval(function () {
            attempts++;
            if (tryInject()) {
                clearInterval(timer);
            } else if (attempts >= maxAttempts) {
                clearInterval(timer);
                console.warn('[XAU-CNY 克价] 超时，未找到价格元素。页面可能已改版。');
            }
        }, 1000);
    }

    // ========== 实时价格刷新 ==========
    // 放弃 MutationObserver，纯轮询。investing.com 用 React 渲染，
    // DOM 节点频繁整棵替换，observer 容易脱钩。每秒读一次 DOM
    // 基本零开销，但绝对可靠。

    var _lastPrice = null;

    function refreshPrice() {
        var priceEl = findPriceElement();
        if (!priceEl) return;

        var raw = priceEl.textContent.trim();
        var pricePerOz = parsePrice(raw);
        if (isNaN(pricePerOz) || pricePerOz <= 0) return;

        // 价格没变就别碰 DOM
        if (pricePerOz === _lastPrice) return;
        _lastPrice = pricePerOz;

        var pricePerGram = pricePerOz / GRAMS_PER_TROY_OZ;
        updateCard(pricePerOz, pricePerGram);

        console.log(
            '[XAU-CNY] 价格更新 → 克价 ¥' + fmt(pricePerGram) +
            ' (盎司 ¥' + fmt(pricePerOz) + ')'
        );
    }

    function startPriceWatcher() {
        // 每秒轮询一次——只读一个 DOM 元素的 textContent，开销可忽略
        setInterval(refreshPrice, 1000);
    }

    // ========== 启动 ==========

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            startPolling();
            startPriceWatcher();
        });
    } else {
        startPolling();
        startPriceWatcher();
    }
})();
