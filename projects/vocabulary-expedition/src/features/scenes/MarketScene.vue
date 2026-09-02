<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0

Market street gouache plate — viewBox 1200x800, item groups on their JSON bbox centres.
-->
<template>
  <svg class="scene-art" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
    <!-- sky + awnings + ground -->
    <rect width="1200" height="800" fill="#bcd9e8" />
    <circle cx="105" cy="95" r="44" fill="#f2c14e" />
    <path d="M840 70 q26 -24 52 0 q26 -24 52 0 q26 -24 52 0 q26 -24 52 0 l0 -70 l-208 0 z" fill="#e8d9bd" opacity="0.9" />
    <!-- striped awning over the left stall -->
    <path d="M20 210 q260 -20 520 0 l0 -60 q-260 -20 -520 0 z" fill="#c0504a" />
    <path d="M124 202 q52 -4 104 0 l0 -54 q-52 -4 -104 0 z M332 202 q52 -4 104 0 l0 -54 q-52 -4 -104 0 z" fill="#fffdf4" />
    <path d="M20 150 h520 M20 150 v62 M540 150 v62" stroke="#8a6b4f" stroke-width="8" />
    <!-- second awning right -->
    <path d="M640 230 q250 -18 500 0 l0 -54 q-250 -18 -500 0 z" fill="#3f7e8c" />
    <path d="M740 224 q50 -4 100 0 l0 -48 q-50 -4 -100 0 z M940 224 q50 -4 100 0 l0 -48 q-50 -4 -100 0 z" fill="#fffdf4" />
    <path d="M640 178 h500" stroke="#2d5e6a" stroke-width="8" />
    <!-- stall tables -->
    <rect x="40" y="430" width="480" height="26" rx="12" fill="#b98f63" />
    <path d="M70 456 l-10 140 M490 456 l10 140" stroke="#a67f52" stroke-width="14" stroke-linecap="round" />
    <rect x="680" y="420" width="440" height="26" rx="12" fill="#b98f63" />
    <path d="M710 446 l-10 130 M1090 446 l10 130" stroke="#a67f52" stroke-width="14" stroke-linecap="round" />
    <!-- ground -->
    <path d="M0 640 Q 300 628 600 642 T 1200 636 L1200 800 L0 800 Z" fill="#d9c8a4" />
    <path d="M120 700 q220 -10 440 2 t460 -6" stroke="#c2ae85" stroke-width="3" fill="none" opacity="0.6" />
    <path d="M420 652 q60 -8 120 0 M780 646 q50 -6 100 0" stroke="#c2ae85" stroke-width="6" fill="none" opacity="0.5" />

    <!-- basket [6,58,16,18] → c(168,536) -->
    <g id="item-basket" transform="translate(168 536)">
      <ellipse cx="0" cy="66" rx="80" ry="10" fill="#4a3527" opacity="0.08" />
      <path d="M-74 -30 q74 12 148 0 l-14 76 q-60 14 -120 0 z" fill="#c97430" />
      <path d="M-74 -30 q74 12 148 0 l-3 12 q-71 10 -142 0 z" fill="#a85c22" />
      <path d="M-64 -18 q12 56 6 82 M-30 -14 q8 60 2 88 M6 -13 q6 62 0 90 M40 -15 q10 56 4 84 M68 -20 q12 50 4 74" stroke="#a85c22" stroke-width="5" fill="none" opacity="0.7" />
      <path d="M-52 -34 q52 -46 104 0" stroke="#c97430" stroke-width="10" fill="none" />
      <circle cx="-24" cy="-42" r="13" fill="#c0504a" />
      <circle cx="6" cy="-50" r="13" fill="#e08a3c" />
      <circle cx="32" cy="-40" r="13" fill="#f2c14e" />
    </g>

    <!-- carrot [24,66,13,9] → c(372,612) -->
    <g id="item-carrot" transform="translate(372 612)">
      <ellipse cx="0" cy="26" rx="66" ry="7" fill="#4a3527" opacity="0.08" />
      <path d="M-52 -6 q44 -22 88 0 l-16 26 q-30 8 -58 0 z" fill="#e08a3c" />
      <path d="M-38 18 q30 8 60 0 l-12 22 q-18 6 -36 0 z" fill="#d97b2e" />
      <path d="M-34 -10 q-4 -22 10 -30 M-6 -12 q2 -24 18 -28 M26 -10 q10 -18 24 -20" stroke="#5f8f3e" stroke-width="8" fill="none" stroke-linecap="round" />
      <path d="M-46 -2 q40 -18 80 0" stroke="#c97430" stroke-width="4" fill="none" opacity="0.8" />
    </g>

    <!-- banana [34,54,14,12] → c(492,480) -->
    <g id="item-banana" transform="translate(492 480)">
      <ellipse cx="0" cy="42" rx="76" ry="8" fill="#4a3527" opacity="0.08" />
      <path d="M-78 6 q-6 -34 30 -38 q44 -6 74 22 q16 14 20 34 q-30 -4 -52 -14 q-40 -18 -58 8 q-8 10 -14 -12 z" fill="#f2c14e" />
      <path d="M-62 0 q-2 -18 16 -22 q30 -6 54 14" stroke="#e0ad3a" stroke-width="6" fill="none" />
      <path d="M-78 6 q-4 4 0 8 q6 -2 6 -8 z" fill="#8a6b4f" />
      <path d="M44 26 q8 8 2 16" stroke="#8a6b4f" stroke-width="6" fill="none" stroke-linecap="round" />
      <ellipse cx="-30" cy="42" rx="9" ry="4" fill="#c2ae85" />
      <ellipse cx="20" cy="44" rx="9" ry="4" fill="#c2ae85" />
    </g>

    <!-- flower [48,60,11,14] → c(642,552) -->
    <g id="item-flower" transform="translate(642 552)">
      <ellipse cx="0" cy="56" rx="46" ry="8" fill="#4a3527" opacity="0.08" />
      <path d="M-6 54 q-6 -50 6 -74" stroke="#5f8f3e" stroke-width="7" fill="none" stroke-linecap="round" />
      <path d="M-6 8 q-26 -10 -34 8 q20 12 34 -8 z" fill="#7fa84b" />
      <path d="M-6 24 q26 -12 36 6 q-22 12 -36 -6 z" fill="#7fa84b" />
      <circle cx="0" cy="-44" r="14" fill="#c0504a" />
      <circle cx="-24" cy="-32" r="13" fill="#d97b6f" />
      <circle cx="24" cy="-32" r="13" fill="#d97b6f" />
      <circle cx="-14" cy="-60" r="12" fill="#e0a294" />
      <circle cx="14" cy="-60" r="12" fill="#e0a294" />
      <circle cx="0" cy="-46" r="8" fill="#f2c14e" />
      <path d="M6 -70 q22 -8 34 4" stroke="#c0504a" stroke-width="5" fill="none" stroke-linecap="round" />
    </g>

    <!-- fish [62,52,16,12] → c(828,464) -->
    <g id="item-fish" transform="translate(828 464)">
      <ellipse cx="0" cy="40" rx="84" ry="9" fill="#4a3527" opacity="0.08" />
      <path d="M-70 0 q20 -36 66 -34 q40 2 62 30 q-22 30 -62 32 q-46 2 -66 -28 z" fill="#8fb6c4" />
      <path d="M58 -4 q26 -16 34 -2 q-12 14 -34 6 z" fill="#6d9cab" />
      <circle cx="-40" cy="-8" r="6" fill="#4a3527" />
      <path d="M-14 -30 q10 -12 22 -4" stroke="#6d9cab" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M-52 8 q30 10 60 0 M-44 20 q24 8 48 0" stroke="#6d9cab" stroke-width="5" fill="none" opacity="0.7" />
      <path d="M-20 -20 q8 8 0 16" stroke="#eef6f4" stroke-width="4" fill="none" opacity="0.7" />
    </g>

    <!-- milk [84,50,11,14] → c(1002,488) -->
    <g id="item-milk" transform="translate(1002 488)">
      <ellipse cx="0" cy="52" rx="46" ry="8" fill="#4a3527" opacity="0.08" />
      <path d="M-36 -44 q36 -10 72 0 l-4 86 q-32 10 -64 0 z" fill="#eef6f4" />
      <rect x="-40" y="-52" width="80" height="14" rx="6" fill="#3f7e8c" />
      <path d="M-36 -44 q36 -10 72 0 l-1 10 q-35 -8 -70 0 z" fill="#cfe3de" />
      <path d="M-22 0 h44 l-4 34 q-18 6 -36 0 z" fill="#3f7e8c" opacity="0.85" />
      <circle cx="0" cy="14" r="9" fill="#fffdf4" />
      <path d="M-3 9 l3 -6 3 6 M0 12 v8" stroke="#3f7e8c" stroke-width="3" fill="none" stroke-linecap="round" />
    </g>

    <!-- cheese [70,66,12,10] → c(912,608) -->
    <g id="item-cheese" transform="translate(912 608)">
      <ellipse cx="0" cy="30" rx="66" ry="7" fill="#4a3527" opacity="0.08" />
      <path d="M-68 20 l122 -44 l14 44 z" fill="#f2c14e" />
      <path d="M-68 20 h136 v10 q-68 12 -136 0 z" fill="#e0ad3a" />
      <circle cx="-26" cy="4" r="7" fill="#e0ad3a" />
      <circle cx="12" cy="-6" r="5" fill="#e0ad3a" />
      <circle cx="36" cy="10" r="4" fill="#e0ad3a" />
      <path d="M54 -24 l14 44" stroke="#c97430" stroke-width="4" />
    </g>
  </svg>
</template>
