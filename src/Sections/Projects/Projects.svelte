<script>
  import Project from "./Project.svelte";
</script>

<style>
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

  .button {
    background-color: var(--theme-secondary);
    color: #ffffff;
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

  .projectHeader {
    font-size: 22px;
    text-align: center;
  }
  .projects {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: top;
    flex: 1;
  }
  .card {
    height: fit-content;
    background-color: var(--theme-light);
    padding: 20px;
    margin: 20px;
    border-radius: 30px;
    padding: 20px;
    flex: 1 1 300px;
  }
</style>

<div class="description">
  <h1>What I've built</h1>
</div>
<div class="projects">
  <Project
    githubLink="https://github.com/devidvogel/annapol-onlineshop"
    header="Annapol Onlineshop"
    imgAlt="AirPoll"
    imgSrc="./AirPoll.png"
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
    imgSrc="./AirPoll.png"
    projectLink="https://darth-crawl.firebaseapp.com/"
  />
  <Project
    githubLink="https://github.com/nhe23/blobby_volley_js"
    header="Blobby Volley JS"
    imgAlt="DarthCrawl"
    imgSrc="./AirPoll.png"
    projectLink="https://master.d3m5xqwx8sphvy.amplifyapp.com/play"
  />
</div>
