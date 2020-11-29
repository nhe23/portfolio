<script lang="typescript">
  export let id = "";
  export let isBlue = true;
</script>

<style>
  section {
    min-height: 100vh;
    display:flex;
    flex-direction: column;
  }

  .blue {
    background-color: #1e77fd;
  }

  /* .marker {
    padding-top: 1px;
  } */
</style>

<section class:blue={isBlue}>
  <div class="marker">
    <div {id} />
  </div>
  <slot />
</section>
