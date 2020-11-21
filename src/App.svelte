<script lang="ts">
  import { elasticOut, bounceOut } from "svelte/easing";
  import Nav from "./Nav.svelte";
  import Home from "./Home.svelte";
  import About from "./Sections/About.svelte";
  import Projects from "./Sections/Projects.svelte";
  import Contact from "./Sections/Contact.svelte";
  import Section from "./Section.svelte";
  import Rocket from "./Rocket.svelte";

  let scrollTop = 0;

  const scrollToTop = () => {
    const scrolling = setInterval(() => {
      document.documentElement.scrollTop = scrollTop - 100;
      if (scrollTop === 0) {
        clearInterval(scrolling);
      }
    }, 25);
  };

  const handleScroll = (e) => {
    console.log("handleScroll");
    scrollTop = document.documentElement.scrollTop;
  };
</script>

<style>
  .toTopButton {
    position: fixed;
    top: 88%;
    right: 20px;
    z-index: 1;
  }
  @media only screen and (max-width: 500px) {
    .toTopButton {
      top: 82%;
    }
  }

  .home{
    height:100vh;
    display: flex;
    flex-direction: column;
  }
</style>

<svelte:window on:scroll={handleScroll} />

<div class="home">
  <Nav />
  <Home />
</div>

{#if scrollTop > 160}
  <div class="toTopButton" on:click={scrollToTop}>
    <Rocket />
  </div>
{/if}

<Section id="about" isBlue={false}>
  <About />
</Section>

<Section id="projects" isBlue={true}>
  <Projects />
</Section>

<Section id="contact" isBlue={false}>
  <Contact />
</Section>
