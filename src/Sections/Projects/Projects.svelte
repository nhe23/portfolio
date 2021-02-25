<script>
  import Project from "./Project.svelte";
</script>

<style>
  .projectsContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: top;
    flex: 1;
  }

  .projects {
    margin-top:40px;
    margin-bottom:40px;
    align-items: center;
    display: flex;
    width: 100%;
    flex: 1;
  }

  .description {
    padding: 25px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: #ffffff;
    align-items: center;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    background-color: var(--theme-primaryDark);
  }

  @media only screen and (max-width: 720px) {
    .description {
      align-items: flex-start;
    }
  }
  h1 {
    font-size: 35px;
  }
</style>

<div class="description">
  <h1>What I've built</h1>
</div>
<div class="projects">
  <div class="projectsContainer">
    <Project
      githubLink="https://github.com/devidvogel/annapol-onlineshop"
      header="Annapol Onlineshop"
      imgAlt="Annpol"
      imgSrc="./Annapol.png"
      projectLink="https://www.annapol.de/"
    />
    <Project
      githubLink="https://github.com/nhe23/AirPoll"
      header="AirPoll App"
      imgAlt="AirPoll"
      imgSrc="./AirPoll.png"
      projectLink=""
    />
    <Project
      githubLink="https://github.com/nhe23/DarthCrawl_Firebase"
      header="DarthCrawl"
      imgAlt="DarthCrawl"
      imgSrc="./DarthCrawl.png"
      projectLink="https://darth-crawl.firebaseapp.com/"
    />
    <Project
      githubLink="https://github.com/nhe23/blobby_volley_js"
      header="Blobby Volley JS"
      imgAlt="BlobbyVolley"
      imgSrc="./BlobbyVolley.png"
      projectLink="https://master.d3m5xqwx8sphvy.amplifyapp.com"
    />
  </div>
</div>
