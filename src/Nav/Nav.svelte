<script>
  import Burger from "./Burger.svelte";
  import Links from "./Links.svelte";
  let w;
  let burgerOpen;
</script>

<style>
  nav {
    height: 10vh;
    max-height: 80px;
    min-height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--theme-background);
  }

  .logo {
    margin-left: 20px;
    height: 80%;
  }

  .navigation{
    display: flex;
    flex-direction: column;
  }

  img {
    height: 100%;
  }
</style>

<div class="navigation">
  <nav bind:clientWidth={w}>
    <div class="logo"><a href="/"><img src="/NHLogo.png" alt="logo" /></a></div>
    {#if w < 600}
      <Burger bind:openened={burgerOpen} />
    {:else}
      <Links />
    {/if}
  </nav>
  {#if w < 600 && burgerOpen}
    <Links showMobile={true} />
  {/if}
</div>
