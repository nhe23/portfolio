<script lang="ts">

  import { elasticOut, bounceOut } from "svelte/easing";
import Nav from "./Nav.svelte";
import Home from "./Home.svelte";
import About from "./About.svelte";
import Projects from "./Projects.svelte";
import Contact from "./Contact.svelte";
  export let name: string;
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

<Nav/>
<Home/>
<About/>
<Projects/>
<Contact/>

