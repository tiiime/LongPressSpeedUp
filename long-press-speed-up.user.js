// ==UserScript==
// @name         Long Press Speed Up
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  长按Ctrl键或鼠标在左下角区域时将当前播放速度翻倍,松开后恢复
// @author       tiiime
// @match        https://www.youtube.com/watch*
// @match        https://www.bilibili.com/video/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isLongPressing = false;
    let isMouseInCorner = false;
    let videoElement = null;
    let previousSpeed = 1.0; // 存储加速前的速度
    const CORNER_SIZE = 100; // 左下角区域大小（像素）
    let cornerIndicator = null; // 视觉反馈元素

    // 创建视觉反馈元素
    function createCornerIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'speedup-indicator';
        indicator.style.position = 'fixed';
        indicator.style.bottom = '0';
        indicator.style.left = '0';
        indicator.style.width = `${CORNER_SIZE}px`;
        indicator.style.height = `${CORNER_SIZE}px`;
        indicator.style.background = 'rgba(0,0,0,0.5)';
        indicator.style.opacity = '0';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '999999';
        indicator.style.transition = 'opacity 0.1s ease';
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.style.justifyContent = 'center';

        // 创建加速符号
        const speedSymbol = document.createElement('div');
        speedSymbol.textContent = '▶▶';
        speedSymbol.style.fontSize = '24px';
        speedSymbol.style.color = 'white';
        speedSymbol.style.fontWeight = 'bold';
        speedSymbol.style.animation = 'speedUp 1s infinite';

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes speedUp {
                0% { transform: scale(1); }
                50% { transform: scale(1.5); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        indicator.appendChild(speedSymbol);
        document.body.appendChild(indicator);
        return indicator;
    }

    // 更新视觉反馈的透明度
    function updateCornerIndicatorOpacity(x, y) {
        if (!cornerIndicator) return;

        const windowHeight = window.innerHeight;
        const distanceX = Math.max(0, CORNER_SIZE - x);
        const distanceY = Math.max(0, CORNER_SIZE - (windowHeight - y));
        const maxDistance = Math.sqrt(CORNER_SIZE * CORNER_SIZE * 2);
        const currentDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        const opacity = Math.max(0, 1 - (currentDistance / maxDistance));

        cornerIndicator.style.opacity = 1-opacity;
    }

    // 查找视频元素
    function getVideoElement() {
        return document.querySelector('video');
    }

    // 设置播放速度
    function setPlaybackSpeed(speed) {
        if (videoElement) {
            videoElement.playbackRate = speed;
        }
    }

    // 获取当前播放速度
    function getCurrentSpeed() {
        return videoElement ? videoElement.playbackRate : 1.0;
    }

    // 加速播放
    function speedUp() {
        if (videoElement) {
            previousSpeed = getCurrentSpeed();
            setPlaybackSpeed(previousSpeed * 2);
        }
    }

    // 恢复速度
    function restoreSpeed() {
        if (videoElement) {
            setPlaybackSpeed(previousSpeed);
        }
    }

    // 检查鼠标是否在左下角区域
    function checkMouseInCorner(e) {
        const windowHeight = window.innerHeight;
        const isInCorner = e.clientX <= CORNER_SIZE && e.clientY >= windowHeight - CORNER_SIZE;

        // 更新视觉反馈
        updateCornerIndicatorOpacity(e.clientX, e.clientY);

        if (isInCorner && !isMouseInCorner) {
            isMouseInCorner = true;
            videoElement = getVideoElement();
            if (videoElement && !isLongPressing) {
                speedUp();
            }
        } else if (!isInCorner && isMouseInCorner) {
            isMouseInCorner = false;
            videoElement = getVideoElement();
            if (videoElement && !isLongPressing) {
                restoreSpeed();
            }
        }
    }

    // 初始化视频速度
    window.addEventListener('load', function() {
        videoElement = getVideoElement();
        if (videoElement) {
            previousSpeed = getCurrentSpeed();
        }

        // 创建视觉反馈元素
        cornerIndicator = createCornerIndicator();

        // 添加鼠标移动监听
        document.addEventListener('mousemove', checkMouseInCorner);
    });

    // 键盘按下事件
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Control' && !isLongPressing) {
            videoElement = getVideoElement();
            if (videoElement) {
                isLongPressing = true;
                // 延迟300ms确认长按
                setTimeout(() => {
                    if (isLongPressing) {
                        speedUp();
                    }
                }, 300);
            }
        }
    });

    // 键盘松开事件
    document.addEventListener('keyup', function(e) {
        if (e.key === 'Control') {
            isLongPressing = false;
            videoElement = getVideoElement();
            if (videoElement && !isMouseInCorner) {
                restoreSpeed();
            }
        }
    });

    // 防止Ctrl键长按触发其他事件
    document.addEventListener('contextmenu', function(e) {
        if (isLongPressing) {
            e.preventDefault();
        }
    });
})();