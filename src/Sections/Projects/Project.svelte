<script lang="ts">
  export let header:string;
  export let imgSrc:string;
  export let imgAlt:string;
  export let githubLink:string;
  export let projectLink:string="";

</script>
<div class="card">
  <div class="projectHeader">{header}</div>
  <img src={imgSrc} alt={imgAlt} />
  <button class="button" href={githubLink}>
    <span class="icon">
      <i class="fab fa-github" />
    </span>
    <span>GitHub</span>
  </button>
</div>