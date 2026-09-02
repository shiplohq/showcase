<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0

Kitchen gouache plate — viewBox 1200x800, item groups on their JSON bbox centres.
-->
<template>
  <svg class="scene-art" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
    <!-- wall, tiles, counter, floor -->
    <rect width="1200" height="800" fill="#f6e7ce" />
    <path d="M0 60 Q 300 48 600 62 T 1200 56 L1200 660 L0 664 Z" fill="#efe0c4" opacity="0.7" />
    <path d="M520 40 h160 M600 40 v120" stroke="#e3d2ae" stroke-width="6" />
    <rect x="150" y="120" width="300" height="150" rx="12" fill="#bcd9e8" />
    <path d="M150 210 q70 -20 150 -4 t150 -10" fill="none" stroke="#e3d2ae" stroke-width="5" opacity="0.7" />
    <rect x="136" y="106" width="328" height="178" rx="16" fill="none" stroke="#b98f63" stroke-width="12" />
    <!-- counter band behind kettle/pot -->
    <path d="M210 540 h420" stroke="#c89a66" stroke-width="18" stroke-linecap="round" />
    <rect x="210" y="540" width="420" height="120" fill="#d9b98c" />
    <rect x="210" y="528" width="420" height="26" rx="12" fill="#c89a66" />
    <!-- table right -->
    <path d="M700 560 q130 -14 260 0" stroke="#c89a66" stroke-width="20" stroke-linecap="round" fill="none" />
    <rect x="700" y="560" width="260" height="14" rx="7" fill="#c89a66" />
    <path d="M720 574 l-8 110 M940 574 l8 110" stroke="#b98f63" stroke-width="14" stroke-linecap="round" />
    <!-- floor -->
    <path d="M0 660 Q 300 650 600 664 T 1200 658 L1200 800 L0 800 Z" fill="#cea97e" />
    <path d="M100 716 q220 -10 440 2 t460 -6" stroke="#b98f63" stroke-width="3" fill="none" opacity="0.4" />

    <!-- fridge [3,16,17,58] → c(126,360) -->
    <g id="item-fridge" transform="translate(126 360)">
      <rect x="-88" y="-216" width="176" height="432" rx="16" fill="#eef3ec" />
      <rect x="-88" y="-216" width="176" height="176" rx="16" fill="#e6efe4" />
      <path d="M-88 -52 q88 12 176 0" stroke="#cdd9c8" stroke-width="6" fill="none" />
      <rect x="-16" y="-186" width="8" height="60" rx="4" fill="#8a6b4f" />
      <rect x="-16" y="-10" width="8" height="84" rx="4" fill="#8a6b4f" />
      <rect x="-70" y="96" width="26" height="34" rx="6" fill="#c0504a" opacity="0.85" />
      <path d="M-70 130 q13 8 26 0 l0 -8 q-13 8 -26 0 z" fill="#a8453f" opacity="0.85" />
      <circle cx="58" cy="-190" r="6" fill="#5f8f3e" />
    </g>

    <!-- pot [24,52,14,18] → c(330,488) -->
    <g id="item-pot" transform="translate(330 488)">
      <ellipse cx="0" cy="66" rx="80" ry="12" fill="#4a3527" opacity="0.08" />
      <path d="M-72 -26 q72 -16 144 0 l-10 76 q-62 14 -124 0 z" fill="#3f7e8c" />
      <rect x="-78" y="-34" width="156" height="18" rx="9" fill="#2d5e6a" />
      <path d="M-78 -30 q78 12 156 0" stroke="#bcd9e8" stroke-width="4" fill="none" opacity="0.6" />
      <path d="M-86 -20 q-16 4 0 22 M86 -20 q16 4 0 22" stroke="#2d5e6a" stroke-width="9" fill="none" stroke-linecap="round" />
      <ellipse cx="-30" cy="-34" rx="12" ry="6" fill="#f2c14e" />
      <ellipse cx="16" cy="-36" rx="14" ry="6" fill="#e08a3c" />
      <path d="M-40 -52 q6 -18 2 -30 M18 -54 q10 -14 8 -28" stroke="#cdd9c8" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8" />
    </g>

    <!-- kettle [40,46,14,20] → c(564,448) -->
    <g id="item-kettle" transform="translate(564 448)">
      <ellipse cx="0" cy="66" rx="70" ry="11" fill="#4a3527" opacity="0.08" />
      <path d="M-58 -34 q58 -20 116 0 q10 56 -8 78 q-50 16 -100 0 q-16 -28 -8 -78 z" fill="#c0504a" />
      <path d="M-58 -34 q58 -20 116 0 l-4 14 q-54 -16 -108 0 z" fill="#a8453f" />
      <path d="M58 -18 q30 -6 34 -34 q18 30 -14 52 z" fill="#a8453f" />
      <rect x="-16" y="-62" width="32" height="16" rx="7" fill="#8a6b4f" />
      <ellipse cx="0" cy="-62" rx="22" ry="7" fill="#4a3527" opacity="0.5" />
      <path d="M-30 -46 q30 -10 60 0" stroke="#f2c14e" stroke-width="6" fill="none" opacity="0.8" />
    </g>

    <!-- apple [64,52,9,12] → c(822,464) -->
    <g id="item-apple" transform="translate(822 464)">
      <ellipse cx="0" cy="46" rx="38" ry="8" fill="#4a3527" opacity="0.08" />
      <path d="M0 -30 q-44 -6 -46 30 q-2 36 46 34 q48 2 46 -34 q2 -36 -46 -30 z" fill="#c0504a" />
      <path d="M-4 -30 q-24 -2 -34 18 q16 -12 34 -6 z" fill="#d97b6f" />
      <path d="M0 -32 q4 -22 18 -28" stroke="#8a6b4f" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M14 -56 q26 -4 26 20 q-18 -10 -26 -20 z" fill="#5f8f3e" />
      <ellipse cx="-20" cy="-4" rx="6" ry="10" fill="#e8d9bd" opacity="0.5" transform="rotate(-20 -20 -4)" />
    </g>

    <!-- bread [78,50,16,13] → c(1032,440) -->
    <g id="item-bread" transform="translate(1032 440)">
      <ellipse cx="0" cy="42" rx="86" ry="9" fill="#4a3527" opacity="0.08" />
      <path d="M-88 0 q0 -40 44 -42 q10 -20 46 -20 q40 0 46 22 q40 6 40 40 q0 20 -24 22 h-128 q-24 -4 -24 -22 z" fill="#d9a45c" />
      <path d="M-60 -18 q22 -12 44 2 M-10 -34 q24 -8 40 8 M28 -10 q20 -8 34 4" stroke="#b9813d" stroke-width="7" fill="none" stroke-linecap="round" />
      <path d="M-84 8 q84 14 172 0 l0 12 q-86 12 -172 0 z" fill="#c08a45" />
    </g>

    <!-- cup [55,62,8,10] → c(708,576) -->
    <g id="item-cup" transform="translate(708 576)">
      <ellipse cx="0" cy="32" rx="40" ry="7" fill="#4a3527" opacity="0.08" />
      <path d="M-34 -22 q34 10 68 0 l-8 46 q-26 10 -52 0 z" fill="#3f7e8c" />
      <ellipse cx="0" cy="-22" rx="34" ry="9" fill="#eef6f4" />
      <ellipse cx="0" cy="-22" rx="24" ry="6" fill="#8a5a2e" opacity="0.85" />
      <path d="M34 -10 q22 4 18 20 q-4 14 -20 12" stroke="#3f7e8c" stroke-width="8" fill="none" />
      <path d="M-12 -34 q6 -10 0 -18 M6 -34 q6 -10 0 -18" stroke="#cdd9c8" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round" />
    </g>

    <!-- bowl [84,66,10,10] → c(1068,608) -->
    <g id="item-bowl" transform="translate(1068 608)">
      <ellipse cx="0" cy="26" rx="52" ry="8" fill="#4a3527" opacity="0.08" />
      <path d="M-50 -14 q50 14 100 0 l-10 34 q-40 12 -80 0 z" fill="#e08a3c" />
      <ellipse cx="0" cy="-14" rx="50" ry="12" fill="#f2c14e" />
      <ellipse cx="0" cy="-14" rx="38" ry="8" fill="#fffdf4" />
      <path d="M-24 -18 q10 -10 22 -2 q10 -10 22 0" stroke="#3f7e8c" stroke-width="0" fill="#e8d9bd" />
      <ellipse cx="-8" cy="-16" rx="12" ry="5" fill="#e8d9bd" />
      <ellipse cx="14" cy="-15" rx="11" ry="5" fill="#d9c8a4" />
      <path d="M-46 10 q46 10 92 0" stroke="#c97430" stroke-width="5" fill="none" />
    </g>
  </svg>
</template>
