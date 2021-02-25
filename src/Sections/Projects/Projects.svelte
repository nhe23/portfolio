<div class="description">
  <h1>What I've built</h1>
</div>
<div class="projects">
  <div class="card"><div class="projectHeader">Annapol Onlineshop</div></div>
  <div class="card">
    <div class="projectHeader">AirPoll App</div>
    <img src="./AirPoll.png" alt="Air Poll" />
    <a href="https://google.de" target="_blank"> <button class="button" href="">
      <span class="icon">
        <i class="fab fa-github" />
      </span>
      <span>GitHub</span>
    </button></a>
  </div>
  <div class="card">DarthCrawl</div>
  <div class="card">Blobby Volly js</div>
</div>

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
