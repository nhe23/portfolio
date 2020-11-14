<script>
  let flying = false;
  const handleClick = () => {
    flying = !flying;
  };
</script>

<style>
  svg {
    cursor: pointer;
  }

  .flyingLines {
    animation: vibrating 1s ease infinite;
    z-index: 2;
  }

  .pulsatingFlame {
    animation: pulsating 1s ease infinite;
    z-index: 4;
  }

  @keyframes pulsating {
    20%{
      transform: translateY(-5px);
    }
    40% {
     transform: translateY(-30px);
    }
    60%{
      transform: translateY(-15px);
    }
    80%{
      transform: translateY(-35px);
    }
  }

  @keyframes vibrating {
    0% {
      transform: translateX(0px);
    }
    20% {
      transform: translateX(-5px);
    }
    40% {
      transform: translateX(5px);
    }
    60% {
      transform: translateX(-5px);
    }
    80% {
      transform: translateX(5px);
    }
    100% {
      transform: translateX(0px);
    }
  }
</style>

<svg
  on:click={handleClick}
  width="75"
  height="75"
  viewBox="0 0 726 726"
  fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <g id="Rocket" clip-path="url(#clip0)">
    <g id="directionLines" class:flyingLines={flying} filter="url(#filter4_d)">
      <path
        id="Vector_9"
        d="M252.994 535.102L253.001 495.101C253.002 489.578 257.48 485.102 263.002 485.102C268.526 485.104 273.002 489.583 273.001 495.104L272.994 535.105C272.993 540.628 268.515 545.105 262.993 545.104C257.47 545.102 252.992 540.624 252.994 535.102Z"
        fill={flying ? 'black' : 'transparent'} />
      <path
        id="Vector_10"
        d="M453.006 535.105L452.999 495.104C452.998 489.581 457.474 485.103 462.997 485.102C468.519 485.1 472.996 489.577 472.998 495.1L473.005 535.101C473.007 540.624 468.53 545.102 463.007 545.103C457.487 545.104 453.007 540.63 453.006 535.105Z"
        fill={flying ? 'black' : 'transparent'} />
      <path
        id="Vector_11"
        d="M312.995 555.106L313.002 650.898C313.002 656.421 308.525 660.898 303.002 660.898C297.481 660.9 293.002 656.423 293.002 650.899L292.995 555.107C292.994 549.584 297.471 545.107 302.994 545.107C308.515 545.105 312.993 549.583 312.995 555.106Z"
        fill={flying ? 'black' : 'transparent'} />
      <path
        id="Vector_12"
        d="M369.563 611.674L369.57 707.466C369.571 712.989 365.094 717.467 359.571 717.467C354.05 717.468 349.57 712.991 349.57 707.468L349.563 611.676C349.563 606.153 354.04 601.675 359.563 601.675C365.084 601.675 369.562 606.153 369.563 611.674Z"
        fill={flying ? 'black' : 'transparent'} />
      <path
        id="Vector_13"
        d="M412.998 650.898L413.005 555.106C413.006 549.583 417.482 545.106 423.006 545.106C428.527 545.106 433.005 549.584 433.005 555.106L432.998 650.898C432.998 656.421 428.521 660.898 422.997 660.898C417.475 660.898 412.997 656.421 412.998 650.898Z"
        fill={flying ? 'black' : 'transparent'} />
    </g>
    <g id="Flame" class:pulsatingFlame={flying} filter="url(#filter3_d)">
      <path
        d="M393.002 455.284L333.35 455.284C327.014 465.905 323.175 479.913 323.175 495.285C323.175 528.42 363.176 575.28 363.176 575.28C363.176 575.28 403.177 528.42 403.177 495.285C403.177 479.913 399.337 465.905 393.002 455.284Z"
        fill={flying ? '#FFDD78' : 'transparent'} />
    </g>
    <g id="Vector" filter="url(#filter0_d)">
      <path
        d="M363.176 15.28C363.176 15.28 326.477 54.7083 297.542 115.279L428.81 115.279C399.875 54.7083 363.176 15.28 363.176 15.28Z"
        fill="#FF5249" />
    </g>
    <g id="Vector_2" filter="url(#filter1_d)">
      <path
        d="M428.81 115.279L297.542 115.279C278.705 154.679 263.17 203.038 263.17 255.279C263.17 303.42 272.859 351.646 289.778 395.279L436.574 395.279C447.894 366.083 457.037 331.993 461.025 295.04C462.418 282.107 463.182 268.827 463.182 255.279C463.182 203.038 447.647 154.679 428.81 115.279Z"
        fill="#F2F2F2" />
    </g>
    <path
      id="Vector_3"
      d="M363.176 175.284C341.086 175.284 323.175 193.195 323.175 215.285C323.175 237.375 341.079 255.279 363.176 255.286C385.273 255.279 403.177 237.375 403.177 215.285C403.177 193.195 385.266 175.284 363.176 175.284Z"
      fill="#7BD8E8" />
    <g id="Group" filter="url(#filter2_d)">
      <path
        id="Vector_4"
        d="M263.177 295.28C172.066 313.502 204.954 417.058 243.173 455.277C243.173 415.283 274.858 395.279 274.858 395.279L289.778 395.279C278.457 366.083 269.315 331.993 265.326 295.04L263.177 295.28Z"
        fill="#FF5249" />
      <path
        id="Vector_5"
        d="M393.002 455.284H395.293C402.06 455.277 408.629 452.032 412.079 446.205C420.614 431.773 429.071 414.604 436.574 395.279L289.778 395.279C297.281 414.604 305.738 431.773 314.272 446.205C317.723 452.032 324.292 455.277 331.059 455.284H333.35L393.002 455.284Z"
        fill="#FF5249" />
      <path
        id="Vector_6"
        d="M463.175 295.28L461.025 295.04C457.037 331.993 447.894 366.083 436.574 395.279H451.494C451.494 395.279 483.179 415.283 483.179 455.277C521.398 417.058 554.286 313.502 463.175 295.28Z"
        fill="#FF5249" />
    </g>
    <path
      id="Vector_7"
      d="M352.994 355.101C353.001 349.579 357.477 345.103 362.992 345.103C368.522 345.103 372.998 349.579 372.998 355.108C372.998 360.624 368.522 365.1 362.999 365.107C357.477 365.1 353.001 360.624 352.994 355.101Z"
      fill="black" />
    <path
      id="Vector_8"
      d="M312.998 215.108C312.998 187.477 335.363 165.107 362.999 165.107C390.632 165.108 413 187.475 413.001 215.109C413.001 242.671 390.572 265.101 362.996 265.109C335.433 265.101 312.998 242.677 312.998 215.108ZM393 215.108C393 198.53 379.581 185.107 362.999 185.107C346.421 185.107 332.998 198.527 332.999 215.108C332.998 231.645 346.457 245.104 362.997 245.109C379.541 245.104 393.001 231.646 393 215.108Z"
      fill="black" />
    <path
      id="Vector_14"
      d="M352.999 315.1L352.999 295.103C352.999 289.581 357.477 285.103 363 285.103C368.523 285.103 372.999 289.579 373 295.103L373 315.1C373 320.623 368.523 325.1 363 325.101C357.477 325.1 353 320.624 352.999 315.1Z"
      fill="black" />
  </g>
  <defs>
    <filter
      id="filter0_d"
      x="276.36"
      y="15.28"
      width="173.633"
      height="173.633"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow"
        result="shape" />
    </filter>
    <filter
      id="filter1_d"
      x="149.66"
      y="49.6454"
      width="427.031"
      height="427.031"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow"
        result="shape" />
    </filter>
    <filter
      id="filter2_d"
      x="158.792"
      y="283.701"
      width="408.767"
      height="220.172"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow"
        result="shape" />
    </filter>
    <filter
      id="filter3_d"
      x="284.265"
      y="425.458"
      width="157.822"
      height="157.822"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow"
        result="shape" />
    </filter>
    <filter
      id="filter4_d"
      x="224.855"
      y="480.96"
      width="276.289"
      height="248.649"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
      <feOffset dy="4" />
      <feGaussianBlur stdDeviation="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
      <feBlend
        mode="normal"
        in2="BackgroundImageFix"
        result="effect1_dropShadow" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow"
        result="shape" />
    </filter>
    <clipPath id="clip0">
      <rect
        width="512.001"
        height="512.001"
        fill="white"
        transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 725.04 363)" />
    </clipPath>
  </defs>
</svg>
