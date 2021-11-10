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
    margin-top: 40px;
    margin-bottom: 40px;
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
      description="Onlineshop for polish delicacies. Shop was build from scratch and is still at work. Page load time and small bundle size is a main focus in this project"
      technologies="Technologies used: Svelte, Sveltekit, Firebase"
    />
    <Project
      githubLink="https://github.com/nhe23/AirPoll"
      header="AirPoll App"
      imgAlt="AirPoll"
      imgSrc="./AirPoll.png"
      projectLink=""
      description="AirPoll is an app for displaying air pollution data. It was build for the first Accenture
      Code.Now challenge which it won!"
      technologies="Technologies used: Svelte, Go, GraphQL, MongoDB"
    />
    <Project
      githubLink="https://github.com/nhe23/DarthCrawl_Firebase"
      header="DarthCrawl"
      imgAlt="DarthCrawl"
      imgSrc="./DarthCrawl.png"
      projectLink="https://darth-crawl.firebaseapp.com/"
      description="This project was built in order to have a dynamic web crawler with a nice dashboard. This project is currently not developed any further."
      technologies="Technologies used: Svelte, Firebase"
    />
    <Project
      githubLink="https://github.com/nhe23/blobby_volley_js"
      header="Blobby Volley JS"
      imgAlt="BlobbyVolley"
      imgSrc="./BlobbyVolley.png"
      projectLink="https://master.d3m5xqwx8sphvy.amplifyapp.com"
      description="This project was developed just for fun. Im a big fan of Blobby Volley and wanted to make a JS only version."
      technologies="Technologies used: React, Redux"
    />
  </div>
</div>
