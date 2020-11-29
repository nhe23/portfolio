<script lang="ts">
  import FrontendIllustration from "./FrontendIllustration.svelte";
  import BackendIllustration from "./BackendIllustration.svelte";
  import CloudIllustration from "./CloudIllustration.svelte";
  import Skill from "./Skill.svelte";
</script>

<style>
  .pageContainer {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
  }

  .description {
    padding: 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    background-color:var(--theme-light);
  }

  @media only screen and (max-width: 720px) {
    .description {
      align-items: flex-start;
    }
  }
  h1 {
    font-size: 35px;
  }

  h2 {
    font-weight: normal;
  }

  .imageContainer {
    width: 75px;
    height: 75px;
    align-self: center;
  }

  .profilePicture {
    border-radius: 50%;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    flex: 1;
  }
</style>

<div class="pageContainer">
  <div class="description">
    <div class="imageContainer">
      <img class="profilePicture" src="./profile_picture.jpg" alt="Profile" />
    </div>

    <h1>Hi, I'm Nathan.</h1>
    <h2>A full stack web devloper based in Karslruhe, Germany.</h2>
    <h2>I like to create beautiful applications.</h2>
  </div>
  <div class="skills">
    <Skill
      svg={FrontendIllustration}
      header={'Frontend'}
      text={`Building fast and responsive UIs is important.
      This is why I use modern web technologies (HTML5, CSS3, React &
        Svelte to name a few) to build my sites.`} />
    <Skill
      svg={BackendIllustration}
      header={'Backend'}
      text={`Building fast and responsive sites is important.
      This is why I use modern web technologies (HTML5, CSS3, React,
        Svelte to name a few) to build my sites.`} />
    <Skill
      svg={CloudIllustration}
      header={'Cloud'}
      text={`Building fast and responsive sites is important.
        This is why I use modern web technologies (HTML5, CSS3, React,
          Svelte to name a few) to build my sites.`} />
  </div>
</div>
