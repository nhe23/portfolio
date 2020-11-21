<script lang="ts">
  import { fade } from "svelte/transition";
  import Nature from "./Nature.svelte";
  let h = 0;
  let w = 0;
  // let windowWidth = window.innerWidth;
  // let windowHeight = window.innerHeight;
  $: triangleWidth = w / 2;
  $: triangleHeight = h;
  // const handleResize = (e) => {
  //   windowWidth = e.target.innerWidth;
  //   windowHeight = document.getElementById("sectionContainer").clientHeight;
  // };
</script>

<style>
  .sectionContainer {
    background-color: #1e77fd;
    height: 100%;
    /* position: absolute; */
    /* z-index: 2; */
  }
  section {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    position: relative;
    height: 100%;
  }

  .description {
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: #ffff;
    z-index: 2;
  }
  @media only screen and (min-width: 720px) {
    .description {
      margin-left: 10vw;
      margin-bottom: 10vw;
    }
  }

  svg {
    margin: 20px;
  }

  h1 {
    font-size: 50px;
  }

  h2 {
    font-size: 35px;
  }
  .outstanding {
    transition: all 1s ease;
  }
  .outstanding:hover {
    /* text-shadow: 0 1px 0 #cccccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9,
      0 5px 0 #aaa, 0 6px 1px rgba(0, 0, 0, 0.1), 0 0 5px rgba(0, 0, 0, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.3), 0 3px 5px rgba(0, 0, 0, 0.2),
      0 5px 10px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.2),
      0 20px 20px rgba(0, 0, 0, 0.15); */
    /* text-shadow: -4px 4px 0px #00e6e6, -8px 8px 0px #01cccc, */
    /* -12px 12px 0px #00bdbd; */
    text-shadow: -4px 4px 0px #92b9f5, -8px 8px 0px #619bf1,
      -12px 12px 0px #4e8ff1;
    transform: translate(20px, 0px) scale(1.1);
  }

  @media only screen and (max-width: 720px) {
    .outstanding {
      text-shadow: -4px 4px 0px #92b9f5, -8px 8px 0px #619bf1,
        -12px 12px 0px #4e8ff1;
      transform: translate(10px, 0px) scale(1.1);
    }
  }
  /* .illustration{
    height:fit-content */
  /* } */

  .primaryButton {
    background-color: #ff6584;
    color: #ffffff;
    border-radius: 20px;
    padding: 5px 35px;
    width: fit-content;
    margin-top: 20px;
    align-self: center;
    font-size: 20px;
  }

  a,
  a:hover,
  a:visited {
    text-decoration: none;
  }

  #triangle {
    position: absolute;
    margin: 0;
    z-index: 1;
  }

  .illustrationContainer {
    position: absolute;
    z-index: 3;
    bottom: 40px;
    left: 50px;
  }

  @media only screen and (max-width: 720px) {
    .illustration {
      display: none;
    }
  }
</style>

<div class="sectionContainer" bind:clientWidth={w} bind:clientHeight={h}>
  <div class="illustration">
    <svg
      id="triangle"
      width={triangleWidth}
      height={triangleHeight}
      viewBox="0 0 {triangleWidth} {triangleHeight}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0L{triangleWidth} {triangleHeight}H0V0Z" fill="#1A64D4" />
    </svg>
    <div class="illustrationContainer">
      <Nature sizeFactor={0.75} />
    </div>
  </div>

  <section>
    <div in:fade class="description">
      <h1>Build</h1>
      <h1 class="outstanding">outstanding</h1>
      <h2>Web Applications</h2>
      <a href="#contact"><button class="primaryButton">Let's create</button></a>
    </div>
  </section>
</div>
