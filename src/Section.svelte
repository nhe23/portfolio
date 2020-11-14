<script lang="typescript">
  export let id = "";
  export let isBlue = true;

</script>

<style>
  section {
    height: 100vh;
  }

  .blue {
    background-color: #1e77fd;
  }

  .marker {
    padding-top: 1px;
  }
</style>

<section class="marker" class:blue={isBlue}>
  <div {id} />
  <slot />
</section>
