<script lang="ts">
export let svg;
export let header;
export let text;
</script>
<style>
  .skillContainer {
    align-items: center;
    flex: 1 1 300px;
    display: flex;
    flex-direction: column;
    padding: 25px;
    /* background-color: rgb(232, 238, 243);
    border-radius: 25px;
    margin:20px;  */
  }

  .skill {
    max-width: 250px;
    display: flex;
    flex-direction: column;
  }

  .header {
    margin: 20px;
    color: var(--theme-primary);
    font-size: 21px;
  }
  .illustrationContainer{
    display: grid;
    place-items: center;
    height:150px;
  }
</style>

<div class="skillContainer">
  <div class="illustrationContainer">
    <svelte:component this={svg}/>
  </div>
  <span class="header">{header}</span>
  <div class="skill">
    <span>{text}</span>
  </div>
</div>