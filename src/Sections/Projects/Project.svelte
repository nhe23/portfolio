<script lang="ts">
  export let header: string;
  export let imgSrc: string;
  export let imgAlt: string;
  export let githubLink: string;
  export let projectLink: string = "";
</script>

<style>
  .card {
    height: fit-content;
    background-color: var(--theme-light);
    padding: 20px;
    margin: 20px;
    border-radius: 30px;
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
  }

  img {
    margin-bottom: 20px;
    border-radius: 5px;
  }
  .text {
    margin-bottom: 20px;
  }
</style>

<div class="card">
  <div class="projectHeader">{header}</div>
  <img src={imgSrc} alt={imgAlt} />
  <div class="text">
    AirPoll is an app for displaying air pollution data. It was build for the first Accenture
    Code.Now challenge which it won!
  </div>
  <div class="text">Technologies used: Svelte, Go, GraphQL, MongoDB</div>
  <button class="button" href={githubLink}>
    <span class="icon">
      <i class="fab fa-github" />
    </span>
    <span>GitHub</span>
  </button>
</div>
