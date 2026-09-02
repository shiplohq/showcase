<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0

Park gouache plate — viewBox 1200x800, item groups on their JSON bbox centres.
-->
<template>
  <svg class="scene-art" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
    <!-- sky, sun, clouds -->
    <rect width="1200" height="800" fill="#bcd9e8" />
    <circle cx="95" cy="95" r="46" fill="#f2c14e" />
    <path d="M250 120 q16 -34 52 -26 q12 -26 44 -18 q30 -8 38 20 q26 2 20 24 h-152 q-10 -10 -2 -16 z" fill="#fffdf4" opacity="0.9" />
    <path d="M900 90 q14 -30 46 -22 q10 -22 38 -16 q26 -6 34 18 q22 2 16 20 h-130 q-10 -8 -4 -14 z" fill="#fffdf4" opacity="0.9" />
    <!-- rolling grass -->
    <path d="M0 470 q200 -90 420 -30 q180 50 340 -14 q220 -80 440 16 L1200 800 L0 800 Z" fill="#a4bf6b" />
    <path d="M0 560 q300 -60 600 0 t600 -8" stroke="#8ba657" stroke-width="4" fill="none" opacity="0.5" />
    <!-- path -->
    <path d="M-20 720 q220 -60 420 -30 q240 34 460 -20 q180 -44 360 10 L1200 800 L0 800 Z" fill="#d9c8a4" opacity="0.9" />
    <!-- pond -->
    <ellipse cx="1040" cy="680" rx="170" ry="46" fill="#8fb6c4" />
    <ellipse cx="1040" cy="680" rx="120" ry="28" fill="#a9c8d4" opacity="0.7" />
    <!-- bushes -->
    <circle cx="180" cy="470" r="42" fill="#8ba657" />
    <circle cx="230" cy="486" r="34" fill="#9bb164" />
    <circle cx="900" cy="450" r="38" fill="#8ba657" />
    <circle cx="946" cy="466" r="30" fill="#9bb164" />

    <!-- kite [70,6,18,20] → c(948,128) -->
    <g id="item-kite" transform="translate(948 128)">
      <path d="M0 -80 L58 0 L0 66 L-58 0 Z" fill="#c0504a" />
      <path d="M0 -80 L0 66 M-58 0 h116" stroke="#fffdf4" stroke-width="5" />
      <path d="M0 66 q-20 20 -34 40 q18 -12 26 6 q4 -22 8 -38" fill="none" stroke="#4a3527" stroke-width="3" />
      <path d="M-24 92 q-8 10 0 18 q10 -6 6 -18 z M4 108 q-8 10 0 18 q10 -6 6 -18 z M-6 136 q-8 10 0 18 q10 -6 6 -18 z" fill="#f2c14e" />
      <path d="M-58 0 q-160 120 -360 260" fill="none" stroke="#8a6b4f" stroke-width="3" stroke-dasharray="2 8" opacity="0.8" />
    </g>

    <!-- tree [50,18,16,42] → c(696,312) -->
    <g id="item-tree" transform="translate(696 312)">
      <ellipse cx="0" cy="180" rx="110" ry="16" fill="#4a3527" opacity="0.1" />
      <path d="M-18 140 q-8 -90 4 -160 h30 q12 70 4 160 q-20 10 -38 0 z" fill="#8a6b4f" />
      <path d="M-2 -20 q-16 80 -8 160" stroke="#7a5c42" stroke-width="4" fill="none" />
      <circle cx="-56" cy="-58" r="58" fill="#5f8f3e" />
      <circle cx="52" cy="-62" r="62" fill="#6b9a44" />
      <circle cx="0" cy="-108" r="60" fill="#7fa84b" />
      <circle cx="-4" cy="-62" r="56" fill="#6b9a44" />
      <circle cx="30" cy="-96" r="9" fill="#c0504a" />
      <circle cx="-44" cy="-84" r="8" fill="#c0504a" />
      <circle cx="10" cy="-40" r="8" fill="#c0504a" />
    </g>

    <!-- bird [40,34,9,9] → c(528,312) -->
    <g id="item-bird" transform="translate(528 312)">
      <ellipse cx="0" cy="6" rx="26" ry="18" fill="#e08a3c" />
      <path d="M-18 10 q-10 12 2 18 q12 -4 10 -14 z" fill="#c97430" />
      <circle cx="18" cy="-10" r="13" fill="#e08a3c" />
      <circle cx="22" cy="-13" r="3" fill="#4a3527" />
      <path d="M28 -12 l12 4 l-12 4 z" fill="#f2c14e" />
      <path d="M26 -22 q6 -8 14 -4" stroke="#8a6b4f" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M6 -6 q20 -10 30 -2 q-16 4 -28 8 z" fill="#c97430" />
      <path d="M-4 24 l0 8 M8 24 l2 8" stroke="#e0ad3a" stroke-width="4" stroke-linecap="round" />
    </g>

    <!-- butterfly [84,40,11,10] → c(1074,360) -->
    <g id="item-butterfly" transform="translate(1074 360)">
      <path d="M-6 -2 q-30 -28 -44 -8 q-8 16 16 22 q-20 10 -8 24 q14 10 34 -14 z" fill="#f2c14e" />
      <path d="M6 -2 q30 -28 44 -8 q8 16 -16 22 q20 10 8 24 q-14 10 -34 -14 z" fill="#e08a3c" />
      <ellipse cx="0" cy="4" rx="7" ry="18" fill="#4a3527" />
      <path d="M-3 -12 q-4 -12 -12 -14 M3 -12 q4 -12 12 -14" stroke="#4a3527" stroke-width="3" fill="none" stroke-linecap="round" />
      <circle cx="-12" cy="-14" r="2.5" fill="#4a3527" />
      <circle cx="12" cy="-14" r="2.5" fill="#4a3527" />
      <circle cx="-20" cy="-6" r="4" fill="#fffdf4" opacity="0.7" />
    </g>

    <!-- bicycle [8,50,22,22] → c(228,536) -->
    <g id="item-bicycle" transform="translate(228 536)">
      <ellipse cx="0" cy="86" rx="120" ry="11" fill="#4a3527" opacity="0.08" />
      <circle cx="-72" cy="44" r="42" fill="none" stroke="#4a3527" stroke-width="9" />
      <circle cx="72" cy="44" r="42" fill="none" stroke="#4a3527" stroke-width="9" />
      <circle cx="-72" cy="44" r="10" fill="#c0504a" />
      <circle cx="72" cy="44" r="10" fill="#c0504a" />
      <path d="M-72 44 L-30 -22 L24 -22 L72 44 M-30 -22 L-6 44 L52 -22 M-46 -22 h40" stroke="#3f7e8c" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M52 -22 q10 -18 26 -12" stroke="#3f7e8c" stroke-width="8" fill="none" stroke-linecap="round" />
      <path d="M78 -36 h16 M86 -44 v16" stroke="#4a3527" stroke-width="6" stroke-linecap="round" />
      <path d="M-30 -22 q-8 -16 6 -20" stroke="#4a3527" stroke-width="7" fill="none" stroke-linecap="round" />
      <path d="M-24 -44 h20" stroke="#4a3527" stroke-width="7" stroke-linecap="round" />
      <path d="M-96 20 q-8 -6 -2 -14 M96 60 q8 6 2 14" stroke="#f2c14e" stroke-width="5" fill="none" stroke-linecap="round" />
    </g>

    <!-- ball [30,62,10,11] → c(420,584) -->
    <g id="item-ball" transform="translate(420 584)">
      <ellipse cx="0" cy="42" rx="46" ry="8" fill="#4a3527" opacity="0.08" />
      <circle r="42" fill="#fffdf4" />
      <path d="M-42 0 a42 42 0 0 1 84 0 z" fill="#c0504a" />
      <path d="M0 -42 v84 M-42 0 h84" stroke="#4a3527" stroke-width="5" />
      <circle r="42" fill="none" stroke="#4a3527" stroke-width="5" />
      <path d="M-18 -36 q18 10 36 0 M-18 36 q18 -10 36 0" stroke="#4a3527" stroke-width="4" fill="none" />
    </g>

    <!-- bench [70,58,20,12] → c(960,584) -->
    <g id="item-bench" transform="translate(960 584)">
      <ellipse cx="0" cy="52" rx="110" ry="10" fill="#4a3527" opacity="0.08" />
      <rect x="-108" y="-16" width="216" height="18" rx="8" fill="#c89a66" />
      <rect x="-108" y="8" width="216" height="16" rx="7" fill="#b98f63" />
      <rect x="-100" y="-66" width="200" height="14" rx="6" fill="#c89a66" />
      <rect x="-100" y="-46" width="200" height="14" rx="6" fill="#d9ab74" />
      <path d="M-96 24 l-6 30 M96 24 l6 30" stroke="#a67f52" stroke-width="13" stroke-linecap="round" />
      <path d="M-88 -62 l-6 44 M88 -62 l6 44" stroke="#a67f52" stroke-width="9" stroke-linecap="round" />
      <path d="M-60 -12 l14 0 M-20 -12 l14 0 M20 -12 l14 0" stroke="#a67f52" stroke-width="0" />
    </g>
  </svg>
</template>
