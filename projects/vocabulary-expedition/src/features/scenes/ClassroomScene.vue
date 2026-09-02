<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0

Classroom gouache plate — viewBox 1200x800, item groups on their JSON bbox centres.
-->
<template>
  <svg class="scene-art" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
    <!-- wall + floor -->
    <rect width="1200" height="800" fill="#efe6d2" />
    <path d="M0 640 Q 300 630 600 644 T 1200 638 L1200 800 L0 800 Z" fill="#c8b18e" />
    <path d="M110 706 q220 -10 440 2 t460 -6" stroke="#ab9372" stroke-width="3" fill="none" opacity="0.4" />

    <!-- windows right wall (decor) -->
    <g transform="translate(1075 160)">
      <rect x="-90" y="-90" width="180" height="170" rx="10" fill="#bcd9e8" />
      <path d="M-90 20 q45 -12 90 -2 t90 -8 L90 80 L-90 80 Z" fill="#9fc3d6" />
      <path d="M0 -90 L0 80" stroke="#efe6d2" stroke-width="10" />
      <rect x="-100" y="-100" width="200" height="190" rx="12" fill="none" stroke="#b98f63" stroke-width="9" />
    </g>
    <path d="M920 300 h310" stroke="#d8c9a8" stroke-width="8" />

    <!-- globe [8,10,11,16] → c(162,144) on a side shelf -->
    <g id="item-globe" transform="translate(162 144)">
      <circle r="54" fill="#3f7e8c" />
      <path d="M-46 -22 q22 -16 44 -6 q16 8 4 24 q-20 22 -46 10 q-14 -12 -2 -28 z" fill="#7fa84b" />
      <path d="M18 -34 q26 -4 30 16 q-18 2 -30 -16 z" fill="#e08a3c" />
      <path d="M-30 34 q26 12 52 -2" stroke="#bcd9e8" stroke-width="5" fill="none" opacity="0.7" />
      <path d="M-54 0 a54 54 0 0 1 108 0" fill="none" stroke="#8a6b4f" stroke-width="6" />
      <path d="M0 -54 L0 -70 M0 -70 q14 -4 10 -14" stroke="#8a6b4f" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M-64 62 h128" stroke="#8a6b4f" stroke-width="8" stroke-linecap="round" />
      <path d="M-24 58 v-14 M24 58 v-6" stroke="#8a6b4f" stroke-width="6" />
    </g>
    <rect x="90" y="200" width="150" height="14" rx="7" fill="#b98f63" />
    <path d="M110 214 l-6 250 M224 214 l6 250" stroke="#a67f52" stroke-width="12" stroke-linecap="round" />

    <!-- board [30,8,40,20] → c(600,128) -->
    <g id="item-board" transform="translate(600 128)">
      <rect x="-238" y="-72" width="476" height="144" rx="10" fill="#b98f63" />
      <rect x="-222" y="-58" width="444" height="116" rx="6" fill="#4f7357" />
      <path d="M-186 -22 q40 -12 78 2 M-186 8 q52 -14 100 4 M-186 36 q30 -8 60 2" stroke="#fffdf4" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.9" />
      <path d="M-40 -30 q30 24 -4 46 M-40 -30 q-22 26 4 46" stroke="#e8d9bd" stroke-width="0" />
      <circle cx="130" cy="-26" r="4" fill="#f2c14e" />
      <path d="M60 30 h180" stroke="#e08a3c" stroke-width="7" stroke-linecap="round" />
      <rect x="-226" y="60" width="452" height="14" rx="7" fill="#8a6b4f" />
      <rect x="-60" y="54" width="40" height="18" rx="4" fill="#e8d9bd" />
      <rect x="-14" y="56" width="34" height="14" rx="4" fill="#fffdf4" />
    </g>

    <!-- desk [8,44,26,22] → c(252,440) -->
    <g id="item-desk" transform="translate(252 440)">
      <ellipse cx="0" cy="96" rx="150" ry="12" fill="#4a3527" opacity="0.08" />
      <rect x="-150" y="-46" width="300" height="26" rx="12" fill="#c89a66" />
      <rect x="-142" y="-20" width="284" height="46" rx="8" fill="#b98f63" />
      <rect x="-128" y="-38" width="60" height="14" rx="7" fill="#d9ab74" />
      <rect x="-52" y="-38" width="60" height="14" rx="7" fill="#d9ab74" />
      <rect x="24" y="-38" width="60" height="14" rx="7" fill="#d9ab74" />
      <path d="M-130 26 l-8 66 M130 26 l8 66" stroke="#a67f52" stroke-width="14" stroke-linecap="round" />
      <path d="M-136 92 q136 -14 272 0" stroke="#a67f52" stroke-width="0" fill="none" />
      <path d="M-90 -46 q30 -26 66 -8" stroke="#c0504a" stroke-width="7" fill="none" stroke-linecap="round" />
      <rect x="-40" y="-44" width="44" height="10" rx="5" fill="#5f8f3e" />
    </g>

    <!-- chair [38,52,10,20] → c(516,496) -->
    <g id="item-chair" transform="translate(516 496)">
      <ellipse cx="0" cy="76" rx="56" ry="9" fill="#4a3527" opacity="0.08" />
      <rect x="-52" y="-46" width="104" height="20" rx="9" fill="#e08a3c" />
      <rect x="-44" y="-26" width="88" height="16" rx="7" fill="#c97430" />
      <path d="M-40 -26 l-8 96 M40 -26 l8 96" stroke="#a85c22" stroke-width="11" stroke-linecap="round" />
      <rect x="-46" y="-140" width="14" height="100" rx="6" fill="#e08a3c" />
      <rect x="34" y="-140" width="14" height="100" rx="6" fill="#e08a3c" />
      <path d="M-42 -46 h96" stroke="#c97430" stroke-width="10" />
      <path d="M-24 -110 l48 0" stroke="#c97430" stroke-width="7" />
      <path d="M-46 -140 h112" stroke="#c97430" stroke-width="9" stroke-linecap="round" />
    </g>

    <!-- bag [70,50,12,16] → c(912,464) -->
    <g id="item-bag" transform="translate(912 464)">
      <ellipse cx="0" cy="58" rx="62" ry="10" fill="#4a3527" opacity="0.08" />
      <path d="M-56 -34 q56 -14 112 0 l-6 84 q-50 14 -100 0 z" fill="#3f7e8c" />
      <rect x="-56" y="-12" width="112" height="18" fill="#2d5e6a" />
      <path d="M-24 -44 q24 -30 48 0" stroke="#2d5e6a" stroke-width="10" fill="none" />
      <rect x="-14" y="6" width="28" height="34" rx="6" fill="#eef6f4" />
      <path d="M-8 14 h16 M-8 24 h16" stroke="#3f7e8c" stroke-width="4" stroke-linecap="round" />
      <circle cx="40" cy="16" r="7" fill="#f2c14e" />
      <path d="M-56 -34 q56 -14 112 0 l-2 10 q-54 -12 -108 0 z" fill="#5b98a5" />
    </g>

    <!-- pencil [56,60,13,10] → c(750,520) -->
    <g id="item-pencil" transform="translate(750 520)">
      <ellipse cx="0" cy="34" rx="72" ry="7" fill="#4a3527" opacity="0.08" />
      <rect x="-66" y="-16" width="112" height="30" rx="6" fill="#f2c14e" transform="rotate(-4 0 0)" />
      <path d="M46 -16 l26 14 l-26 16 z" fill="#e8d9bd" transform="rotate(-4 0 0)" />
      <path d="M64 -6 l8 4 l-8 5 z" fill="#4a3527" transform="rotate(-4 0 0)" />
      <rect x="-66" y="-16" width="14" height="30" rx="4" fill="#c97430" transform="rotate(-4 0 0)" />
      <rect x="-52" y="-12" width="86" height="7" rx="3" fill="#e0ad3a" transform="rotate(-4 0 0)" />
    </g>

    <!-- ruler [84,58,13,9] → c(1080,580) -->
    <g id="item-ruler" transform="translate(1080 580)">
      <ellipse cx="0" cy="28" rx="74" ry="6" fill="#4a3527" opacity="0.08" />
      <rect x="-72" y="-18" width="144" height="34" rx="6" fill="#e8d9bd" transform="rotate(3 0 0)" />
      <path d="M-56 -18 v12 M-38 -18 v12 M-20 -18 v12 M-2 -18 v12 M16 -18 v12 M34 -18 v12 M52 -18 v12" stroke="#8a6b4f" stroke-width="4" transform="rotate(3 0 0)" />
      <circle cx="24" cy="2" r="5" fill="#c0504a" />
    </g>
  </svg>
</template>
