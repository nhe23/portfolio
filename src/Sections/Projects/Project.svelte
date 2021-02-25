<script lang="ts">
  export let header: string;
  export let imgSrc: string;
  export let imgAlt: string;
  export let githubLink: string;
  export let projectLink: string = "";

  let showDetails = false;
</script>

<style>
  .card {
    height: fit-content;
    background-color: var(--theme-light);
    padding: 20px;
    margin: 20px;
    border-radius: 30px;
    max-width: 300px;
    padding: 20px;
    flex: 1 1 300px;
    display: flex;
    flex-direction: column;
  }

  .projectHeader {
    font-size: 22px;
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 1px solid;
  }

  .button {
    background-color: var(--theme-secondary);
    color: #ffffff;
    width: fit-content;
    align-self: center;
  }

  .buttonLink{
    align-self: center;
  }

  img {
    margin-bottom: 20px;
    border-radius: 5px;
  }
  .text {
    margin-bottom: 20px;
  }

  .details {
    margin-bottom: 20px;
    cursor: pointer;
  }
</style>

<div class="card">
  <div class="projectHeader">{header}</div>
  <a href={projectLink} target="_blank">
    <img src={imgSrc} alt={imgAlt} />
  </a>

  <div
    class="details is-flex"
    on:click={() => {
      showDetails = !showDetails;
    }}
  >
    {#if !showDetails}
      <span class="icon">
        <i class="fas fa-chevron-down" />
      </span>
    {:else}
      <span class="icon">
        <i class="fas fa-chevron-up" />
      </span>
    {/if}
    {#if !showDetails} Show {:else} Hide {/if} Details
  </div>

  {#if showDetails}
    <div class="text">
      AirPoll is an app for displaying air pollution data. It was build for the
      first Accenture Code.Now challenge which it won!
    </div>
    <div class="text">Technologies used: Svelte, Go, GraphQL, MongoDB</div>
  {/if}
  <a class="buttonLink" href={githubLink} target="_blank"> 
    <button class="button">
      <span class="icon">
        <i class="fab fa-github" />
      </span>
      <span>GitHub</span>
    </button>
  </a>
</div>
