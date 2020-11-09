<script lang="ts">
  import { elasticOut, bounceOut } from "svelte/easing";
  import Nav from "./Nav.svelte";
  import Home from "./Home.svelte";
  import About from "./About.svelte";
  import Projects from "./Projects.svelte";
  import Contact from "./Contact.svelte";
  import Section from "./Section.svelte";
  let visible = false;

  function spin(node, { duration }) {
    return {
      duration,
      css: (t) => {
        const eased = bounceOut(t);

        return `
				transform: scale(${eased});
					color: hsl(
						${~~(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
					);`;
      },
    };
  }
</script>

<style>
</style>

<Nav />
<Home />
<Section id="about" isBlue={false}>
  <About />
</Section>

<Section id="projects" isBlue={true}>
  <Projects />
</Section>

<Section id="contact" isBlue={false}>
  <Contact />
</Section>

