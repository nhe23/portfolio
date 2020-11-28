<script>
  export let showMobile = false;
</script>

<style>
  a,
  a:hover,
  a:visited {
    text-decoration: none;
    color: var(--theme-primary);
    margin-left: 25px;
    margin-right: 25px;
  }

  .links {
    height: fit-content;
    margin-right: 20px;
  }

  .mobile a {
    margin: 10px;
  }

  .mobile {
    font-size: large;
    border-top: 1px solid var(--theme-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

<div class:links={!showMobile} class:mobile={showMobile}>
  <a href="#about">About</a>
  <a href="#projects">Projects</a>
  <a href="#contact">Contact</a>
</div>
